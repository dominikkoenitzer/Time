"use client"

import * as React from "react"
import Link from "next/link"
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { TimezoneSearch } from "@/components/timezone-search"
import { useTimeFormat } from "@/hooks/use-time-format"

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  )
}

export function SiteHeader() {
  const { hour12, toggleHour12 } = useTimeFormat()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "t") return
      if (isTypingTarget(event.target)) return

      toggleHour12()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggleHour12])

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          Time<span className="text-time-accent">.</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <TimezoneSearch />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHour12}
            aria-label={`Switch to ${hour12 ? "24-hour" : "12-hour"} format`}
            className="font-mono text-xs"
          >
            {hour12 ? "12H" : "24H"}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

const emptySubscribe = () => () => {}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // True only after hydration, so server and client render the same icon.
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} strokeWidth={2} />
    </Button>
  )
}
