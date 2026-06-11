"use client"

import * as React from "react"

/**
 * A tiny localStorage-backed external store for useSyncExternalStore.
 * Snapshots are cached by the raw stored string so repeated reads return
 * a stable reference (required for non-primitive values).
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>()
  let cached: { raw: string | null; value: T } | null = null

  function subscribe(listener: () => void) {
    listeners.add(listener)
    window.addEventListener("storage", listener)

    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", listener)
    }
  }

  function getSnapshot(): T {
    const raw = localStorage.getItem(key)

    if (!cached || cached.raw !== raw) {
      let value = fallback

      if (raw !== null) {
        try {
          value = JSON.parse(raw) as T
        } catch {
          // Corrupt entry — fall back and let the next set() overwrite it.
        }
      }

      cached = { raw, value }
    }

    return cached.value
  }

  function getServerSnapshot(): T {
    return fallback
  }

  function set(value: T) {
    localStorage.setItem(key, JSON.stringify(value))
    listeners.forEach((listener) => listener())
  }

  function get(): T {
    return typeof window === "undefined" ? fallback : getSnapshot()
  }

  function useValue(): T {
    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  }

  return { get, set, useValue }
}
