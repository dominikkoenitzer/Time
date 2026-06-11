"use client"

import * as React from "react"

import { correctedNowMs, ensureClockSync } from "@/lib/clock-sync"

/**
 * The current server-corrected time, ticking at the beginning of every
 * second. Returns null until mounted so server and client HTML never
 * disagree.
 */
export function useNow(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null)

  React.useEffect(() => {
    ensureClockSync()

    let timeout: number

    const tick = () => {
      const corrected = correctedNowMs()
      setNow(new Date(corrected))
      timeout = window.setTimeout(tick, 1000 - (corrected % 1000))
    }

    tick()

    return () => window.clearTimeout(timeout)
  }, [])

  return now
}
