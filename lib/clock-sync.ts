"use client"

const SAMPLES = 5
const RESYNC_AFTER_MS = 5 * 60_000
const ADJUSTMENT_THRESHOLD_MS = 1000
const WATCH_INTERVAL_MS = 5000

interface SyncSample {
  offsetMs: number
  rttMs: number
}

let started = false
let measuring = false

// Offset applied to Date.now() to get server-corrected time. Kept in its own
// variable so the corrected clock never jumps back to raw device time while a
// re-measurement is in flight.
let appliedOffsetMs = 0

// Minimal record for the watchdog: whether the last measurement succeeded and
// when it ran.
let lastSync = { ok: false, measuredAt: 0 }

/** The current moment, corrected to the server's clock. */
export function correctedNowMs(): number {
  return Date.now() + appliedOffsetMs
}

/**
 * NTP-style measurement. Each sample times one request to /api/time:
 *
 *   start ──────────> server stamps Date.now() ──────────> response
 *   └────────────────────── round trip (rtt) ──────────────────┘
 *
 * The server's stamp is assumed to sit halfway through the round trip, so
 * offset = serverNow − (start + rtt/2). The round trip itself is measured
 * with performance.now(), which is monotonic — a device-clock step during
 * the measurement cannot corrupt it. The sample with the smallest round trip
 * wins; its offset cannot be wrong by more than rtt/2.
 */
async function measure() {
  if (measuring) return
  measuring = true

  try {
    const samples: SyncSample[] = []

    for (let i = 0; i < SAMPLES; i++) {
      const startWall = Date.now()
      const startMono = performance.now()
      const response = await fetch("/api/time", { cache: "no-store" })
      const rttMs = performance.now() - startMono
      const { now } = (await response.json()) as { now: number }

      samples.push({ offsetMs: now - (startWall + rttMs / 2), rttMs })
    }

    const best = samples.reduce((a, b) => (b.rttMs < a.rttMs ? b : a))

    appliedOffsetMs = best.offsetMs
    lastSync = { ok: true, measuredAt: Date.now() }
  } catch {
    lastSync = { ok: false, measuredAt: Date.now() }
  } finally {
    measuring = false
  }
}

function startWatchdogs() {
  // A jump between the wall clock and the monotonic clock means the device
  // clock was adjusted (or the machine slept) — either way, re-measure.
  let baseline = Date.now() - performance.now()

  window.setInterval(() => {
    const current = Date.now() - performance.now()

    if (Math.abs(current - baseline) > ADJUSTMENT_THRESHOLD_MS) {
      void measure()
    }

    baseline = current
  }, WATCH_INTERVAL_MS)

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return

    const stale =
      !lastSync.ok || Date.now() - lastSync.measuredAt > RESYNC_AFTER_MS

    if (stale) void measure()
  })
}

/** Starts the first measurement and the resync watchdogs, once per page. */
export function ensureClockSync() {
  if (started || typeof window === "undefined") return

  started = true
  startWatchdogs()
  void measure()
}
