"use client"

import * as React from "react"

import { createLocalStore } from "@/lib/local-store"

const store = createLocalStore<string[]>("time:favorites", [])

/** Favorite cities as IANA zone names, persisted and shared globally. */
export function useFavorites() {
  const favorites = store.useValue()

  const toggleFavorite = React.useCallback((zone: string) => {
    const current = store.get()

    store.set(
      current.includes(zone)
        ? current.filter((entry) => entry !== zone)
        : [...current, zone]
    )
  }, [])

  return { favorites, toggleFavorite }
}
