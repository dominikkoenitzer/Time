"use client"

import * as React from "react"

import { useNow } from "@/hooks/use-now"
import { getWallClock, pad } from "@/lib/time"

/** Keeps the browser tab title ticking with the current time. */
export function LiveTitle({ label }: { label: string }) {
  const now = useNow()

  React.useEffect(() => {
    if (!now) return

    const wall = getWallClock(now)
    const time = `${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)}`

    document.title = `${time} — ${label}`
  }, [now, label])

  return null
}
