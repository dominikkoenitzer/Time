"use client"

import * as React from "react"

import { useNow } from "@/hooks/use-now"
import { useTimeFormat } from "@/hooks/use-time-format"
import { dayPeriod, displayHour, getWallClock, pad } from "@/lib/time"

/** Keeps the browser tab title ticking with the current time. */
export function LiveTitle({
  label,
  timeZone,
}: {
  label: string
  timeZone?: string
}) {
  const now = useNow()
  const { hour12 } = useTimeFormat()

  React.useEffect(() => {
    if (!now) return

    const wall = getWallClock(now, timeZone)
    const time = `${displayHour(wall.hour, hour12)}:${pad(wall.minute)}:${pad(wall.second)}`
    const suffix = hour12 ? ` ${dayPeriod(wall.hour)}` : ""

    document.title = `${time}${suffix} — ${label}`
  }, [now, timeZone, label, hour12])

  return null
}
