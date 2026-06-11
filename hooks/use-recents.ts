"use client"

import { createLocalStore } from "@/lib/local-store"

const MAX_RECENTS = 6

const store = createLocalStore<string[]>("time:recent-zones", [])

/** Recently viewed zone pages, most recent first. */
export function useRecentZones(): string[] {
  return store.useValue()
}

export function recordZoneVisit(zone: string) {
  const rest = store.get().filter((entry) => entry !== zone)
  store.set([zone, ...rest].slice(0, MAX_RECENTS))
}
