"use client"

import * as React from "react"

const STORAGE_KEY = "time:hour12"
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "true"
}

function getServerSnapshot() {
  return false
}

/** Global 12/24-hour preference, persisted and shared across components. */
export function useTimeFormat() {
  const hour12 = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const toggleHour12 = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, String(!getSnapshot()))
    listeners.forEach((listener) => listener())
  }, [])

  return { hour12, toggleHour12 }
}
