import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Clock } from "@/components/clock"
import { FavoriteToggle } from "@/components/favorite-toggle"
import { HourStrip } from "@/components/hour-strip"
import { LiveTitle } from "@/components/live-title"
import { RecentZones } from "@/components/recent-zones"
import { WorldClocks } from "@/components/world-clocks"
import { ZoneVisitTracker } from "@/components/zone-visit-tracker"
import { FEATURED_CITIES } from "@/lib/cities"
import { resolveZone, toZoneInfo } from "@/lib/time"

interface Props {
  params: Promise<{ zone: string[] }>
}

/** Prerender the featured cities; everything else renders on demand. */
export function generateStaticParams() {
  return FEATURED_CITIES.map((city) => ({
    zone: city.zone.toLowerCase().split("/"),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zone } = await params
  const resolved = resolveZone(zone.join("/"))

  if (!resolved) {
    return { title: "Unknown time zone" }
  }

  const { city } = toZoneInfo(resolved)

  return {
    title: `Time in ${city} right now`,
    description: `The exact current time in ${city} (${resolved}), with date, UTC offset, and the difference to your local time.`,
  }
}

export default async function ZonePage({ params }: Props) {
  const { zone } = await params
  const resolved = resolveZone(zone.join("/"))

  if (!resolved) {
    notFound()
  }

  const { city } = toZoneInfo(resolved)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 sm:px-6">
      <LiveTitle label={city} timeZone={resolved} />
      <ZoneVisitTracker zone={resolved} />
      <div className="flex flex-col items-center gap-4 pt-6">
        <Clock timeZone={resolved} heading={city} />
        <FavoriteToggle zone={resolved} city={city} />
      </div>
      <HourStrip timeZone={resolved} city={city} />
      <RecentZones exclude={resolved} />
      <WorldClocks />
    </div>
  )
}
