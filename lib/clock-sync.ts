"use client"

import * as React from "react"

const SAMPLES = 5
const RESYNC_AFTER_MS = 5 * 60_000
const ADJUSTMENT_THRESHOLD_MS = 1000
const WATCH_INTERVAL_MS = 5000

export interface SyncSample {
  offsetMs: number
  rttMs: number
}

export type ClockSync =
  | { status: "checking" }
  | { status: "unavailable" }
  | {
      status: "synced"
      offsetMs: number
      accuracyMs: number
      measuredAt: number
      samples: SyncSample[]
    }

let state: ClockSync = { status: "checking" }
const listeners = new Set<() => void>()
let started = false
let measuring = false

// Kept separately from `state` so the corrected clock never jumps back to
// raw device time while a re-measurement is in flight.
let appliedOffsetMs = 0

function setState(next: ClockSync) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getClockOffsetMs(): number {
  return appliedOffsetMs
}

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
 * the measurement cannot corrupt it. The sample with the smallest round
 * trip wins, and its offset cannot be wrong by more than rtt/2: that bound
 * is reported as the accuracy.
 */
async function measure() {
  if (measuring) return
  measuring = true
  setState({ status: "checking" })

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
    setState({
      status: "synced",
      offsetMs: best.offsetMs,
      accuracyMs: Math.max(best.rttMs / 2, 1),
      measuredAt: Date.now(),
      samples,
    })
  } catch {
    setState({ status: "unavailable" })
  } finally {
    measuring = false
  }
}

/** Re-measure on demand (the "Check again" button). */
export function resync() {
  void measure()
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
      state.status !== "synced" ||
      Date.now() - state.measuredAt > RESYNC_AFTER_MS

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

const serverSnapshot: ClockSync = { status: "checking" }

export function useClockSync(): ClockSync {
  React.useEffect(() => {
    ensureClockSync()
  }, [])

  return React.useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot
  )
}
