"use client"

import * as React from "react"
import Link from "next/link"
import { Moon02Icon, StarIcon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useFavorites } from "@/hooks/use-favorites"
import { useNow } from "@/hooks/use-now"
import { useTimeFormat } from "@/hooks/use-time-format"
import { FEATURED_CITIES, type City } from "@/lib/cities"
import {
  dayPeriod,
  displayHour,
  formatZoneDifference,
  getDayShift,
  getWallClock,
  isDaytime,
  pad,
  toZoneInfo,
} from "@/lib/time"
import { cn } from "@/lib/utils"

export function WorldClocks() {
  const { favorites } = useFavorites()

  // Starred cities first (any zone, not just curated ones), then the rest.
  const cities = React.useMemo(() => {
    const curated = new Map(FEATURED_CITIES.map((city) => [city.zone, city]))
    const starred = favorites.map(
      (zone) => curated.get(zone) ?? { name: toZoneInfo(zone).city, zone }
    )
    const rest = FEATURED_CITIES.filter((city) => !favorites.includes(city.zone))

    return [...starred, ...rest]
  }, [favorites])

  return (
    <section aria-label="World clocks" className="flex flex-col gap-4">
      <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        Around the world
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cities.map((city) => (
          <CityCard key={city.zone} city={city} />
        ))}
      </ul>
    </section>
  )
}

function CityCard({ city }: { city: City }) {
  const now = useNow()
  const { hour12 } = useTimeFormat()
  const { favorites, toggleFavorite } = useFavorites()
  const saved = favorites.includes(city.zone)

  const wall = now ? getWallClock(now, city.zone) : null
  const daytime = wall ? isDaytime(wall.hour) : true
  const dayShift = now ? getDayShift(now, city.zone) : 0

  // Only label what differs from the viewer's own time — "Same as local
  // time" on half the cards is noise.
  const difference = now ? formatZoneDifference(now, city.zone) : ""
  const diffLabel =
    difference && difference !== "Same as local time"
      ? `${difference}${dayShift !== 0 ? ` · ${dayShift > 0 ? "tomorrow" : "yesterday"}` : ""}`
      : ""

  return (
    <li className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-ring/40 hover:bg-muted/50 focus-within:ring-[3px] focus-within:ring-ring/50">
      <Link
        href={`/${city.zone.toLowerCase()}`}
        aria-label={`Time in ${city.name}`}
        className="absolute inset-0 rounded-2xl outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{city.name}</span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={saved}
            aria-label={
              saved
                ? `Remove ${city.name} from favorites`
                : `Add ${city.name} to favorites`
            }
            onClick={() => toggleFavorite(city.zone)}
            className={cn(
              "relative z-10 cursor-pointer rounded-full transition-all outline-none focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              saved
                ? "text-amber-500"
                : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100 hover:text-amber-500"
            )}
          >
            <HugeiconsIcon
              icon={StarIcon}
              size={16}
              strokeWidth={2}
              className={cn(saved && "fill-amber-400")}
            />
          </button>
          <HugeiconsIcon
            icon={daytime ? Sun01Icon : Moon02Icon}
            size={16}
            strokeWidth={2}
            className={daytime ? "text-amber-500" : "text-indigo-400"}
            aria-label={daytime ? "Daytime" : "Nighttime"}
          />
        </span>
      </div>
      <span className="font-mono text-2xl leading-none font-medium tracking-tight tabular-nums">
        {wall ? (
          <>
            {displayHour(wall.hour, hour12)}:{pad(wall.minute)}
            {hour12 ? (
              <span className="ml-1 text-sm text-muted-foreground">
                {dayPeriod(wall.hour)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground/30">--:--</span>
        )}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {diffLabel || " "}
      </span>
    </li>
  )
}
