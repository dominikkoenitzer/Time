"use client"

import Link from "next/link"

import { useNow } from "@/hooks/use-now"
import { useRecentZones } from "@/hooks/use-recents"
import { useTimeFormat } from "@/hooks/use-time-format"
import { displayHour, getWallClock, pad, toZoneInfo } from "@/lib/time"

/** Pills linking to recently viewed zone pages, with live times. */
export function RecentZones({ exclude }: { exclude?: string }) {
  const recents = useRecentZones().filter((zone) => zone !== exclude)
  const now = useNow()
  const { hour12 } = useTimeFormat()

  if (recents.length === 0) return null

  return (
    <section aria-label="Recently viewed" className="flex flex-col gap-3">
      <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        Recently viewed
      </h2>
      <ul className="flex flex-wrap gap-2">
        {recents.map((zone) => {
          const { city, slug } = toZoneInfo(zone)
          const wall = now ? getWallClock(now, zone) : null

          return (
            <li key={zone}>
              <Link
                href={`/${slug}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors outline-none hover:border-ring/40 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {city}
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {wall
                    ? `${displayHour(wall.hour, hour12)}:${pad(wall.minute)}`
                    : "--:--"}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
