"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useNow } from "@/hooks/use-now"
import { useTimeFormat } from "@/hooks/use-time-format"
import { getWallClock, listZones, type ZoneInfo } from "@/lib/time"
import { cn } from "@/lib/utils"

const MAX_RESULTS = 8

export function TimezoneSearch() {
  const router = useRouter()
  const now = useNow()
  const { hour12 } = useTimeFormat()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)

  const zones = React.useMemo(() => listZones(), [])

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase().replaceAll("_", " ")
    if (!needle) return []

    const matches = (zone: ZoneInfo) =>
      zone.city.toLowerCase().includes(needle) ||
      zone.region.toLowerCase().includes(needle) ||
      zone.zone.toLowerCase().replaceAll("_", " ").includes(needle)

    const ranked = zones.filter(matches)
    ranked.sort((a, b) => {
      const aStarts = a.city.toLowerCase().startsWith(needle) ? 0 : 1
      const bStarts = b.city.toLowerCase().startsWith(needle) ? 0 : 1
      return aStarts - bStarts || a.city.localeCompare(b.city)
    })

    return ranked.slice(0, MAX_RESULTS)
  }, [zones, query])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isSlash =
        event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey
      const isCommandK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)

      if (!isSlash && !isCommandK) return
      if (document.activeElement === inputRef.current) return

      const target = event.target
      if (
        isSlash &&
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navigateTo = (zone: ZoneInfo) => {
    setOpen(false)
    setQuery("")
    router.push(`/${zone.slug}`)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault()
      navigateTo(results[activeIndex])
    } else if (event.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-full max-w-xs">
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="timezone-search-results"
        aria-label="Search for a city or time zone"
        placeholder="Search any city…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onInputKeyDown}
        className="peer h-9 w-full rounded-4xl border border-border bg-input/30 pr-8 pl-9 text-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground peer-focus:hidden">
        /
      </kbd>
      {open && results.length > 0 ? (
        <ul
          id="timezone-search-results"
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-lg"
        >
          {results.map((zone, index) => {
            const wall = now ? getWallClock(now, zone.zone) : null

            return (
              <li
                key={zone.zone}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  navigateTo(zone)
                }}
                className={cn(
                  "flex cursor-pointer items-baseline justify-between gap-3 rounded-xl px-3 py-2 text-sm",
                  index === activeIndex && "bg-muted"
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{zone.city}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {zone.zone.replaceAll("_", " ")}
                  </span>
                </span>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {wall
                    ? new Intl.DateTimeFormat("en-US", {
                        timeZone: zone.zone,
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12,
                      }).format(now!)
                    : ""}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
