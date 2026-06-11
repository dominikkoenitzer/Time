"use client"

import * as React from "react"

import { recordZoneVisit } from "@/hooks/use-recents"

/** Records a zone-page visit for the "Recently viewed" row. */
export function ZoneVisitTracker({ zone }: { zone: string }) {
  React.useEffect(() => {
    recordZoneVisit(zone)
  }, [zone])

  return null
}
