"use client"

import * as React from "react"
import { Maximize01Icon, Minimize01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { CopyChip } from "@/components/copy-chip"
import { correctedNowMs } from "@/lib/clock-sync"
import { useNow } from "@/hooks/use-now"
import { useTimeFormat } from "@/hooks/use-time-format"
import {
  dayPeriod,
  formatDate,
  formatOffset,
  formatZoneDifference,
  getDayOfYear,
  getIsoWeek,
  getOffsetMinutes,
  getWallClock,
  getZoneLongName,
  pad,
} from "@/lib/time"
import { cn } from "@/lib/utils"

const CURSOR_IDLE_MS = 3000

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export function Clock({
  timeZone,
  heading,
}: {
  timeZone?: string
  heading?: string
}) {
  const now = useNow()
  const { hour12 } = useTimeFormat()
  const sectionRef = React.useRef<HTMLElement>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [cursorHidden, setCursorHidden] = React.useState(false)

  const toggleFullscreen = React.useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void sectionRef.current?.requestFullscreen()
    }
  }, [])

  React.useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === sectionRef.current)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "f") return
      if (isTypingTarget(event.target)) return

      toggleFullscreen()
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [toggleFullscreen])

  // While fullscreen, keep the screen awake — the clock is likely on a wall
  // or desk. Re-acquire on tab return; the lock auto-releases when hidden.
  React.useEffect(() => {
    if (!isFullscreen || !("wakeLock" in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let released = false

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen")
        if (released) void sentinel.release().catch(() => {})
      } catch {
        // Denied (e.g. battery saver) — the clock still works.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void acquire()
    }

    void acquire()
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      released = true
      document.removeEventListener("visibilitychange", onVisibilityChange)
      void sentinel?.release().catch(() => {})
    }
  }, [isFullscreen])

  // Hide the cursor after a few idle seconds in fullscreen.
  React.useEffect(() => {
    if (!isFullscreen) return

    let timeout = window.setTimeout(() => setCursorHidden(true), CURSOR_IDLE_MS)

    function onMouseMove() {
      setCursorHidden(false)
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => setCursorHidden(true), CURSOR_IDLE_MS)
    }

    window.addEventListener("mousemove", onMouseMove)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [isFullscreen])

  const wall = now ? getWallClock(now, timeZone) : null
  const displayHour = wall ? (hour12 ? wall.hour % 12 || 12 : wall.hour) : null

  return (
    <section
      ref={sectionRef}
      className={cn(
        "flex flex-col items-center gap-6 bg-background py-10 text-center",
        isFullscreen && "justify-center",
        isFullscreen && cursorHidden && "cursor-none **:cursor-none"
      )}
    >
      <header className="flex flex-col items-center gap-1">
        {heading ? (
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        ) : null}
        <p className="text-base text-muted-foreground sm:text-lg">
          {now ? formatDate(now, timeZone) : " "}
        </p>
      </header>

      <p
        aria-label={heading ? `Current time in ${heading}` : "Current local time"}
        className="font-mono text-[clamp(3.5rem,16vw,11rem)] leading-none font-medium tracking-tight tabular-nums select-none"
      >
        {wall && displayHour !== null ? (
          <>
            {pad(displayHour)}
            <span className="font-sans text-muted-foreground/30">:</span>
            {pad(wall.minute)}
            <span className="font-sans text-muted-foreground/30">:</span>
            <span className="text-time-accent">{pad(wall.second)}</span>
            {hour12 ? (
              <span className="ml-3 align-middle text-[0.2em] font-sans font-semibold text-muted-foreground">
                {dayPeriod(wall.hour)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground/30">--:--:--</span>
        )}
      </p>

      <p className="max-w-2xl text-xs text-muted-foreground tabular-nums sm:text-sm">
        {now && wall ? (
          <>
            {getZoneLongName(now, timeZone ?? localZone())} ·{" "}
            {formatOffset(getOffsetMinutes(now, timeZone ?? localZone()))}
            {timeZone ? <> · {formatZoneDifference(now, timeZone)}</> : null} ·
            Week {getIsoWeek(wall)} · Day {getDayOfYear(wall)}
          </>
        ) : (
          " "
        )}
      </p>

      <div className="flex items-center gap-1">
        <CopyChip
          label="Copy Unix timestamp"
          getValue={() => String(Math.floor(correctedNowMs() / 1000))}
        >
          Unix
        </CopyChip>
        <CopyChip
          label="Copy current time as ISO 8601"
          getValue={() => new Date(correctedNowMs()).toISOString()}
        >
          ISO
        </CopyChip>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={`${isFullscreen ? "Exit" : "Enter"} fullscreen (F)`}
          onClick={toggleFullscreen}
          className="text-muted-foreground"
        >
          <HugeiconsIcon
            icon={isFullscreen ? Minimize01Icon : Maximize01Icon}
            strokeWidth={2}
          />
        </Button>
      </div>
    </section>
  )
}

function localZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
