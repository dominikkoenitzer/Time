"use client"

import * as React from "react"

import { useNow } from "@/hooks/use-now"
import { useTimeFormat } from "@/hooks/use-time-format"
import { getDayShift, getWallClock, pad } from "@/lib/time"
import { cn } from "@/lib/utils"

function hourLabel(hour: number, minute: number, hour12: boolean) {
  const base = hour12 ? String(hour % 12 || 12) : pad(hour)
  const minutes = minute !== 0 ? `:${pad(minute)}` : ""
  const suffix = hour12 ? (hour < 12 ? "a" : "p") : ""

  return `${base}${minutes}${suffix}`
}

/**
 * Today's 24 local hours next to the corresponding wall time in the target
 * zone — for spotting a good moment to call.
 */
export function HourStrip({
  timeZone,
  city,
}: {
  timeZone: string
  city: string
}) {
  const now = useNow()
  const { hour12 } = useTimeFormat()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const currentRef = React.useRef<HTMLDivElement>(null)

  const ready = now !== null

  // Center the current hour once the strip has real content.
  React.useEffect(() => {
    if (!ready) return

    const container = scrollRef.current
    const target = currentRef.current
    if (!container || !target) return

    container.scrollLeft =
      target.offsetLeft - container.clientWidth / 2 + target.clientWidth / 2
  }, [ready])

  const cells = now
    ? Array.from({ length: 24 }, (_, hour) => {
        const localDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour
        )
        const remote = getWallClock(localDate, timeZone)

        return {
          hour,
          remoteHour: remote.hour,
          remoteMinute: remote.minute,
          dayShift: getDayShift(localDate, timeZone),
        }
      })
    : null

  const currentHour = now?.getHours()

  return (
    <section
      aria-label={`Hour comparison with ${city}`}
      className="flex flex-col gap-4"
    >
      <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        Plan a call with {city}
      </h2>
      <div
        ref={scrollRef}
        className="relative [scrollbar-width:thin] overflow-x-auto pb-1"
      >
        <div className="flex w-max items-stretch gap-1">
          <div className="flex flex-col justify-around pr-2 text-xs text-muted-foreground">
            <span className="flex h-8 items-center">You</span>
            <span className="flex h-8 max-w-24 items-center truncate">
              {city}
            </span>
          </div>
          {(cells ?? Array.from({ length: 24 }, (): null => null)).map(
            (cell, index) => (
              <div
                key={index}
                ref={cell && cell.hour === currentHour ? currentRef : undefined}
                className={cn(
                  "flex flex-col rounded-lg border border-transparent",
                  cell &&
                    cell.hour === currentHour &&
                    "border-time-accent/50 bg-time-accent/10"
                )}
              >
                <span className="flex h-8 w-12 items-center justify-center font-mono text-xs text-muted-foreground tabular-nums">
                  {cell ? hourLabel(cell.hour, 0, hour12) : "--"}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-md font-mono text-xs tabular-nums",
                    cell && cell.remoteHour >= 9 && cell.remoteHour < 17
                      ? "bg-emerald-500/10 text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {cell ? (
                    <>
                      {hourLabel(cell.remoteHour, cell.remoteMinute, hour12)}
                      {cell.dayShift !== 0 ? (
                        <sup className="ml-0.5 text-[0.65em] text-time-accent">
                          {cell.dayShift > 0 ? "+1" : "−1"}
                        </sup>
                      ) : null}
                    </>
                  ) : (
                    "--"
                  )}
                </span>
              </div>
            )
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground/60">
        Green: 9:00–17:00 in {city} · highlighted column: now
      </p>
    </section>
  )
}
