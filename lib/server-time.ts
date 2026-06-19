import dgram from "node:dgram"

/**
 * Authoritative server time, disciplined against NTP.
 *
 * The host's own wall clock (`Date.now()`) cannot be trusted for a
 * clock-accuracy site — a serverless host or a dev machine can sit a second
 * or more off true time, which would make the site "correct" every visitor
 * toward the wrong moment. Instead we measure the offset between this host's
 * clock and a stratum-1-backed NTP server, cache it, and report
 * `Date.now() + offset` so the API always returns true UTC regardless of how
 * far the host clock has drifted.
 *
 * NTP is queried over UDP (sub-10ms accuracy). If UDP egress is blocked, we
 * fall back to Cloudflare's HTTP time beacon (tens-of-ms accuracy), and if
 * everything is unreachable we degrade to the raw host clock.
 */

const NTP_SERVERS = ["time.cloudflare.com", "time.google.com", "pool.ntp.org"]
const NTP_PORT = 123
const NTP_TIMEOUT_MS = 800
const HTTP_TIMEOUT_MS = 1200

// How long a measured offset is trusted before the next request re-measures.
// Host clocks drift slowly, so a few minutes keeps us accurate while making
// virtually every request a cache hit.
const REFRESH_AFTER_MS = 5 * 60_000

// Seconds between the NTP epoch (1900-01-01) and the Unix epoch (1970-01-01).
const NTP_UNIX_EPOCH_DIFF = 2_208_988_800

export interface ServerTime {
  /** True UTC in milliseconds — host clock corrected by the measured offset. */
  now: number
  /** How far the host clock is from true time (negative = host is ahead). */
  offsetMs: number
  /** Round-trip to the time source for the winning measurement. */
  rttMs: number
  /** Where the offset came from: `ntp:<host>`, `http:cloudflare`, or `uncorrected`. */
  source: string
}

interface Offset {
  offsetMs: number
  rttMs: number
  at: number
  source: string
}

let cached: Offset | null = null
let inFlight: Promise<Offset> | null = null

/** Read a 64-bit NTP timestamp (seconds + 32-bit fraction) as Unix ms. */
function readNtpTimestamp(buf: Buffer, offset: number): number {
  const seconds = buf.readUInt32BE(offset)
  const fraction = buf.readUInt32BE(offset + 4)
  return (seconds - NTP_UNIX_EPOCH_DIFF) * 1000 + (fraction * 1000) / 2 ** 32
}

/**
 * One NTP exchange. Resolves with the clock offset between the NTP server and
 * this host, latency-compensated with the standard four-timestamp formula:
 *
 *   offset = ((t2 − t1) + (t3 − t4)) / 2
 *
 * where t1/t4 are our send/receive times and t2/t3 are the server's
 * receive/transmit times. Asymmetric latency cancels to first order.
 */
function queryNtp(host: string): Promise<Offset> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4")
    const packet = Buffer.alloc(48)
    packet[0] = 0x1b // LI = 0, VN = 3, Mode = 3 (client)

    let t1 = Date.now()

    const timer = setTimeout(
      () => finish(() => reject(new Error(`NTP timeout (${host})`))),
      NTP_TIMEOUT_MS
    )

    function finish(cb: () => void) {
      clearTimeout(timer)
      try {
        socket.close()
      } catch {
        // already closed
      }
      cb()
    }

    socket.once("message", (msg) => {
      const t4 = Date.now()
      const t2 = readNtpTimestamp(msg, 32) // server receive
      const t3 = readNtpTimestamp(msg, 40) // server transmit
      finish(() =>
        resolve({
          offsetMs: (t2 - t1 + (t3 - t4)) / 2,
          rttMs: t4 - t1 - (t3 - t2),
          at: t4,
          source: `ntp:${host}`,
        })
      )
    })

    socket.once("error", (err) => finish(() => reject(err)))

    socket.send(packet, NTP_PORT, host, (err) => {
      if (err) finish(() => reject(err))
      else t1 = Date.now() // stamp the send as close to the wire as possible
    })
  })
}

/** HTTP fallback: Cloudflare's edge clock (`ts=` is Unix seconds, fractional). */
async function queryHttp(): Promise<Offset> {
  const t1 = Date.now()
  const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
    cache: "no-store",
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  })
  const t4 = Date.now()
  const text = await res.text()
  const match = text.match(/^ts=([\d.]+)/m)
  if (!match) throw new Error("no ts in cloudflare trace")

  const serverMs = parseFloat(match[1]) * 1000
  return {
    offsetMs: serverMs - (t1 + (t4 - t1) / 2),
    rttMs: t4 - t1,
    at: t4,
    source: "http:cloudflare",
  }
}

/** Best available offset: race the NTP servers, then HTTP, then give up. */
async function measureOffset(): Promise<Offset | null> {
  try {
    return await Promise.any(NTP_SERVERS.map(queryNtp))
  } catch {
    // every NTP server failed (UDP likely blocked) — fall through to HTTP
  }

  try {
    return await queryHttp()
  } catch {
    return null
  }
}

async function getOffset(): Promise<Offset> {
  if (cached && Date.now() - cached.at < REFRESH_AFTER_MS) return cached

  // Coalesce concurrent refreshes into a single measurement.
  if (!inFlight) {
    inFlight = measureOffset()
      .then(
        (result) =>
          result ?? { offsetMs: 0, rttMs: 0, at: Date.now(), source: "uncorrected" }
      )
      .finally(() => {
        inFlight = null
      })
  }

  cached = await inFlight
  return cached
}

/** Current true time and the diagnostics behind it. */
export async function getServerTime(): Promise<ServerTime> {
  const offset = await getOffset()
  return {
    now: Date.now() + offset.offsetMs,
    offsetMs: offset.offsetMs,
    rttMs: offset.rttMs,
    source: offset.source,
  }
}
