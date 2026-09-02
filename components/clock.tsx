"use client"

import * as React from "react"

import { useNow } from "@/hooks/use-now"
import { correctedNowMs } from "@/lib/clock-sync"
import {
  formatLongDate,
  formatUtcOffset,
  getIsoWeek,
  getTimeZoneName,
  getWallClock,
  pad,
} from "@/lib/time"

/**
 * Stands in for a pair of digits before the clock has mounted. Two monospaced
 * cells wide, exactly like the numbers that replace them, so the first client
 * paint agrees with the server HTML and the face never reflows.
 */
const PLACEHOLDER = "--"

/** Both caption rows are set identically. Hierarchy is carried by position. */
const CAPTION =
  "font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase sm:text-[11px]"

/** Expo-out. No overshoot: back-easing on numerals reads as a toy. */
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"

/** The face assembles hours first, one pair every 110ms, and then never again. */
const ENTRY_MS = 340
const ENTRY_DELAY_MS = 60
const ENTRY_STAGGER_MS = 110
const ENTRY_TOTAL_MS = ENTRY_DELAY_MS + ENTRY_STAGGER_MS * 2 + ENTRY_MS

/**
 * The fraction of each second at which the colons go dark: lit for the first
 * 90%, extinguished for the last 100ms.
 */
const DARK_AT = 0.9

/** Re-seeding the loop every tick would itself be a stutter; a frame is the tolerance. */
const DRIFT_TOLERANCE_MS = 16
const RESYNC_EVERY_MS = 5000

const layoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/**
 * Whether the visitor has asked for less movement. Read through an external
 * store rather than an effect, so the very first render already has the answer
 * and changing the setting mid-session takes effect immediately.
 */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)")
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // Nothing has moved on the server, and nothing will until this resolves
    // for real on the client.
    () => false
  )
}

/**
 * Everything the face ever does, which is two things.
 *
 * **It assembles, once.** When the real time replaces the placeholder the pairs
 * rise into place, hours first and seconds last. This runs in a layout effect
 * so the first painted frame is already the start of the animation, rather than
 * a flash of finished digits.
 *
 * **Then the colons keep time, forever.** A station clock's second hand sweeps
 * early, waits at twelve, and is released by the impulse from the master clock:
 * the sync protocol made visible rather than decorated. This is that gesture,
 * given to the only part of a digital face that can honestly spare it, since
 * the digits themselves may never show a wrong second. The colons anticipate
 * the boundary, dwell dark, and return on the tick.
 *
 * The dwell is one looping compositor animation rather than a per-frame job,
 * and it is phase-locked to `correctedNowMs()` (the server-corrected clock, not
 * the device's) so it lands on the true boundary even on a machine whose own
 * clock is wrong. It starts only once the assembly has finished, because two
 * animations on one property would otherwise fight over it.
 *
 * If the visitor prefers reduced motion, none of it runs at all.
 */
function useFace<T extends HTMLElement>(
  root: React.RefObject<T | null>,
  live: boolean,
  animate: boolean
) {
  layoutEffect(() => {
    const face = root.current
    if (!live || !animate || !face) return

    const running: Animation[] = []
    let resyncTimer = 0

    for (const pair of face.querySelectorAll<HTMLElement>("[data-pair]")) {
      running.push(
        pair.animate(
          [
            { opacity: 0, transform: "translateY(0.22em)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: ENTRY_MS,
            delay:
              ENTRY_DELAY_MS + Number(pair.dataset.pair) * ENTRY_STAGGER_MS,
            easing: EXPO_OUT,
            // Hold the pair displaced and invisible through its delay.
            fill: "backwards",
          }
        )
      )
    }

    const colons = face.querySelectorAll<HTMLElement>("[data-colon]")
    for (const colon of colons) {
      running.push(
        colon.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: EXPO_OUT,
        })
      )
    }

    const beginPause = window.setTimeout(() => {
      const pause = Array.from(colons).map((colon) =>
        colon.animate(
          [
            { opacity: 1, offset: 0 },
            { opacity: 1, offset: DARK_AT },
            { opacity: 0, offset: DARK_AT },
            { opacity: 0, offset: 1 },
          ],
          { duration: 1000, iterations: Infinity }
        )
      )
      running.push(...pause)

      const resync = () => {
        const phase = correctedNowMs() % 1000

        for (const animation of pause) {
          const at = Number(animation.currentTime ?? 0) % 1000
          if (Math.abs(at - phase) > DRIFT_TOLERANCE_MS) {
            animation.currentTime = phase
          }
        }
      }

      resync()
      resyncTimer = window.setInterval(resync, RESYNC_EVERY_MS)
    }, ENTRY_TOTAL_MS)

    return () => {
      window.clearTimeout(beginPause)
      window.clearInterval(resyncTimer)
      for (const animation of running) animation.cancel()
    }
  }, [root, live, animate])
}

/**
 * The separator, drawn rather than typed.
 *
 * A font's colon is positioned to sit against lowercase, so its dots centre on
 * the x-height. Geist Mono puts that centre at 0.2554em while its digits centre
 * at 0.355em, which left the colon hanging 0.0996em low against the numerals --
 * about 24px at full size, and plainly visible.
 *
 * So the real `:` is kept as the layout box and simply made transparent. That
 * matters for three reasons: the advance stays exactly whatever the font says
 * it is, so the face still measures eight cells and the composition cannot
 * shift; the character stays in the text content, so it copies and reads as
 * "22:34:34"; and the overlay inherits a normal inline box to position against.
 *
 * The overlay spans that box, so its centre sits (ascender - descender) / 2 =
 * (1.005 - 0.295) / 2 = 0.355em above the baseline -- exactly the digits'
 * centre, and independent of `line-height`, since half-leading is symmetric.
 * An earlier attempt sized a flex box to the cap height and leaned on the
 * inline-block baseline rule instead; a flex container synthesises its baseline
 * by different rules, and it hung below the line.
 *
 * The dots are not invented either. Geist Mono draws its own colon as a
 * 135.2 x 131.6 hard-cornered rectangle with a 247.6 gap, so these are the same
 * ink (sqrt(135.2 x 131.6) = 0.133em square, 0.244em apart, no corner radius)
 * at the same 1.83:1 ratio. Only their position changes.
 *
 * `left-0 w-[0.6em]` rather than `inset-x-0`: trailing `letter-spacing` shrinks
 * the box to 0.57em, and centring in that would sit 0.015em to the left.
 */
function Colon() {
  return (
    <span data-colon className="relative inline-block text-transparent">
      :
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex w-[0.6em] flex-col items-center justify-center gap-[0.244em]"
      >
        <span className="size-[0.133em] bg-mark" />
        <span className="size-[0.133em] bg-mark" />
      </span>
    </span>
  )
}

export function Clock() {
  const now = useNow()
  const wall = now && getWallClock(now)
  const face = React.useRef<HTMLTimeElement>(null)

  useFace(face, Boolean(wall), !usePrefersReducedMotion())

  return (
    <div className="mx-auto w-fit max-w-full">
      {/* Four marks on the corners of a rectangle that is never drawn: the
          clock's own width is the measure, and the captions register to its
          edges rather than to the screen's. The block is centred on the page,
          but nothing inside it is: the captions are pinned to the numerals they
          describe. Below `sm` the split closes into flush-left runs, since a
          320px screen has no right edge worth reaching for. */}
      <div
        className={`mb-4 flex flex-col gap-y-1 sm:mb-7 sm:flex-row sm:justify-between sm:gap-4 ${CAPTION}`}
      >
        <span>{now ? formatLongDate(now) : <>&nbsp;</>}</span>
        <span>{wall ? `W${getIsoWeek(wall)}` : <>&nbsp;</>}</span>
      </div>

      {/* Width sets the size on a normal screen; the 26svh term only takes over
          on a short or landscape one, where scaling by width alone would push
          the captions off a page that is not allowed to scroll.
 */}
      <time
        ref={face}
        dateTime={now?.toISOString()}
        className="block font-mono text-[clamp(3rem,min(15vw,26svh),15rem)] leading-none font-medium tracking-[-0.03em]"
      >
        <span data-pair="0" className="inline-block">
          {wall ? pad(wall.hour) : PLACEHOLDER}
        </span>
        <Colon />
        <span data-pair="1" className="inline-block">
          {wall ? pad(wall.minute) : PLACEHOLDER}
        </span>
        <Colon />
        <span data-pair="2" className="inline-block text-muted-foreground">
          {wall ? pad(wall.second) : PLACEHOLDER}
        </span>
      </time>

      <div
        className={`mt-4 flex flex-col gap-y-1 sm:mt-7 sm:flex-row sm:justify-between sm:gap-4 ${CAPTION}`}
      >
        <span>{now ? getTimeZoneName(now) : <>&nbsp;</>}</span>
        <span>
          {now ? formatUtcOffset(-now.getTimezoneOffset()) : <>&nbsp;</>}
        </span>
      </div>
    </div>
  )
}
