"use client"

import Lenis from "lenis"
import * as React from "react"

import { correctedNowMs, ensureClockSync } from "@/lib/clock-sync"
import { easeIO, sstep } from "@/lib/kinetic/easing"
import { ACCENT, createField } from "@/lib/kinetic/field"
import {
  daysInYear,
  getDayOfYear,
  getIsoWeek,
  getWallClock,
  pad,
} from "@/lib/time"

import {
  headline,
  mono,
  RAIL,
  railDot,
  railLabel,
  station,
  stationLabel,
  stationSub,
} from "./kinetic-clock.styles"

export function KineticClock() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const kickerRef = React.useRef<HTMLDivElement>(null)
  const hRef = React.useRef<HTMLSpanElement>(null)
  const mRef = React.useRef<HTMLSpanElement>(null)
  const sRef = React.useRef<HTMLSpanElement>(null)
  const hintRef = React.useRef<HTMLDivElement>(null)
  const railRef = React.useRef<HTMLDivElement>(null)
  const s1Ref = React.useRef<HTMLDivElement>(null)
  const s2Ref = React.useRef<HTMLDivElement>(null)
  const s3Ref = React.useRef<HTMLDivElement>(null)
  const s4Ref = React.useRef<HTMLDivElement>(null)
  const s5Ref = React.useRef<HTMLDivElement>(null)
  const todayPctRef = React.useRef<HTMLSpanElement>(null)
  const untilRef = React.useRef<HTMLSpanElement>(null)
  const yearRef = React.useRef<HTMLSpanElement>(null)
  const yearPctRef = React.useRef<HTMLSpanElement>(null)
  const weekRef = React.useRef<HTMLSpanElement>(null)
  const doyRef = React.useRef<HTMLSpanElement>(null)
  const yearLenRef = React.useRef<HTMLSpanElement>(null)
  const remainRef = React.useRef<HTMLSpanElement>(null)
  const unixRef = React.useRef<HTMLDivElement>(null)
  const onpageRef = React.useRef<HTMLSpanElement>(null)
  const finaleRef = React.useRef<HTMLDivElement>(null)
  const nowRef = React.useRef<HTMLDivElement>(null)
  const escapeRef = React.useRef<HTMLDivElement>(null)
  const whiteRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    ensureClockSync()

    // Smooth scroll. Lenis drives the real document scroll, so window.scrollY
    // and native scroll events — which the whole timeline below reads — keep
    // working untouched; it just glides between positions. Disabled when the
    // visitor prefers reduced motion.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const lenis = reduceMotion
      ? null
      : new Lenis({ lerp: 0.09, smoothWheel: true })

    const mount = performance.now()
    const canvas = canvasRef.current
    const field = canvas ? createField(canvas) : null

    const stations: [React.RefObject<HTMLDivElement | null>, number, number][] =
      [
        [s1Ref, 0.85, 1.95],
        [s2Ref, 1.85, 2.95],
        [s3Ref, 2.85, 3.95],
        [s4Ref, 3.85, 4.95],
        [s5Ref, 4.85, 6.05],
      ]

    const fmt = (n: number) => n.toLocaleString("en-US")

    let p = 0
    let p2 = 0
    let phase = 0
    let collapse = 0
    let dive = 0
    let flash = 0
    let diving = false
    let reset = false
    let diveStart = 0
    let diveC0 = 0
    let rebornStart = 0

    const updateOverlay = () => {
      if (diving) return // gravity has taken over — ignore scroll

      const vh = window.innerHeight || 1
      const sc = window.scrollY || window.pageYOffset || 0
      const sv = sc / vh
      p = Math.min(sv, 1)
      p2 = Math.min(Math.max(sv - 1, 0), 1)
      phase = sv
      const e = easeIO(p)

      if (wrapRef.current)
        wrapRef.current.style.transform = `translate(-50%,-50%) translateY(${-e * 38}vh) scale(${1 - e * 0.66})`
      if (kickerRef.current)
        kickerRef.current.style.opacity = String(Math.max(0, 1 - p * 2.2))
      if (hintRef.current)
        hintRef.current.style.opacity = String(Math.max(0, 1 - sv * 2.5))

      let best = -1
      let bestOp = 0.05
      stations.forEach(([ref, a, b], i) => {
        const el = ref.current
        if (!el) return
        const t = (sv - a) / (b - a)
        let op = 0
        let y = 40
        if (t > -0.4 && t < 1.4) {
          op = sstep(0, 0.28, t) * (1 - sstep(0.72, 1, t))
          y = (0.5 - Math.min(1, Math.max(0, t))) * 46
        }
        el.style.opacity = String(op)
        el.style.transform = `translateY(${y}px)`
        if (op > bestOp) {
          bestOp = op
          best = i
        }
      })

      if (railRef.current) {
        railRef.current.style.opacity = String(sstep(0.55, 1.15, sv))
        Array.from(railRef.current.children).forEach((el, i) => {
          const on = i === best
          const lab = el.querySelector<HTMLElement>(".rl")
          const dot = el.querySelector<HTMLElement>(".rd")
          if (lab) lab.style.color = on ? "#eaeae3" : "#5a5a54"
          if (dot) {
            dot.style.background = on ? ACCENT : "transparent"
            dot.style.borderColor = on ? ACCENT : "#4a4a44"
          }
        })
      }

      // ---- SINGULARITY COLLAPSE ----
      collapse = sstep(6.1, 7.3, sv)
      if (wrapRef.current)
        wrapRef.current.style.opacity = String(
          Math.max(0, 1 - sstep(0.08, 0.5, collapse))
        )
      if (railRef.current && collapse > 0)
        railRef.current.style.opacity = String(
          (parseFloat(railRef.current.style.opacity) || 0) * (1 - collapse)
        )
      if (finaleRef.current)
        finaleRef.current.style.opacity = String(collapse > 0.001 ? 1 : 0)
      if (nowRef.current) {
        const ns = 1 - sstep(0.28, 1, collapse) * 0.94
        const nrot = collapse * 220
        nowRef.current.style.transform = `scale(${ns}) rotate(${nrot}deg)`
        nowRef.current.style.opacity = String(
          sstep(0.04, 0.26, collapse) * (1 - sstep(0.8, 0.98, collapse))
        )
      }
      if (escapeRef.current)
        escapeRef.current.style.opacity = String(sstep(0.84, 1, collapse))

      // past the point of no return — gravity takes over, no more scrolling needed
      if (collapse >= 0.5) {
        diving = true
        diveStart = performance.now()
        reset = false
        diveC0 = collapse
      }
    }
    updateOverlay()
    window.addEventListener("scroll", updateOverlay, { passive: true })

    const resize = () => field?.resize()
    if (field) window.addEventListener("resize", resize)

    let raf = 0
    const frame = (time: number) => {
      lenis?.raf(time)

      const now = new Date(correctedNowMs())
      const h = now.getHours()
      const m = now.getMinutes()
      const s = now.getSeconds()
      const ms = now.getMilliseconds()

      if (hRef.current) hRef.current.textContent = pad(h)
      if (mRef.current) mRef.current.textContent = pad(m)
      if (sRef.current) sRef.current.textContent = pad(s)
      if (kickerRef.current) {
        const weekday = now.toLocaleDateString("en-US", { weekday: "long" })
        const month = now.toLocaleDateString("en-US", { month: "long" })
        kickerRef.current.textContent = `${weekday} · ${now.getDate()} ${month} ${now.getFullYear()}`
      }

      updateOverlay()

      // ---- AUTOMATIC DIVE TIMELINE ----
      if (diving) {
        const pnow = performance.now()
        const dt = (pnow - diveStart) / 1000
        const A = 1.8 // fall → white-out
        if (dt < A) {
          const k = dt / A
          collapse =
            (diveC0 || 0.5) + (1 - (diveC0 || 0.5)) * sstep(0, 0.35, dt)
          dive = k * k * k // accelerating plunge
          flash = sstep(A - 0.45, A, dt)
          if (finaleRef.current) finaleRef.current.style.opacity = "0"
          if (railRef.current) railRef.current.style.opacity = "0"
          if (wrapRef.current) wrapRef.current.style.opacity = "0"
        } else if (!reset) {
          // crossed the horizon
          reset = true
          rebornStart = pnow
          // Snap back to the top through Lenis so its internal target stays in
          // sync (a raw window.scrollTo would fight the smoothing).
          if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
          else window.scrollTo(0, 0)
          collapse = 0
          dive = 0
          flash = 1
        } else {
          // emerge into the present
          const dt2 = (pnow - rebornStart) / 1000
          const HOLD = 0.22
          const D = 1.5
          const rp = Math.min(1, Math.max(0, dt2 - HOLD) / D)
          const ease = 1 - Math.pow(1 - rp, 3) // easeOutCubic
          flash = 1 - ease // the light recedes
          collapse = 0
          dive = 0
          p = 1 - ease
          p2 = 0
          phase = (1 - ease) * 2.0
          if (wrapRef.current) {
            // the clock focus-pulls out of the light
            wrapRef.current.style.opacity = String(ease)
            wrapRef.current.style.transform = `translate(-50%,-50%) translateY(0vh) scale(${1.1 - 0.1 * ease})`
            wrapRef.current.style.filter = `blur(${(1 - ease) * 12}px)`
          }
          if (kickerRef.current)
            kickerRef.current.style.opacity = String(
              Math.max(0, (ease - 0.45) / 0.55)
            )
          if (dt2 > HOLD + D + 0.1) {
            diving = false
            reset = false
            flash = 0
            p = 0
            phase = 0
            if (wrapRef.current) wrapRef.current.style.filter = "none"
          }
        }
      }
      if (whiteRef.current) whiteRef.current.style.opacity = String(flash)

      const secsToday = h * 3600 + m * 60 + s
      const wall = getWallClock(now)
      const yearLen = daysInYear(wall.year)
      const doy = getDayOfYear(wall)

      if (todayPctRef.current)
        todayPctRef.current.textContent = ((secsToday / 86400) * 100).toFixed(1)
      if (untilRef.current) {
        const rem = 86400 - secsToday
        untilRef.current.textContent = `${pad(Math.floor(rem / 3600))}h ${pad(Math.floor(rem / 60) % 60)}m`
      }
      if (yearRef.current) yearRef.current.textContent = String(wall.year)
      if (yearPctRef.current)
        yearPctRef.current.textContent = (
          ((doy - 1 + secsToday / 86400) / yearLen) *
          100
        ).toFixed(2)
      if (weekRef.current)
        weekRef.current.textContent = String(getIsoWeek(wall))
      if (doyRef.current) doyRef.current.textContent = String(doy)
      if (yearLenRef.current) yearLenRef.current.textContent = String(yearLen)
      if (remainRef.current)
        remainRef.current.textContent = String(yearLen - doy)
      if (unixRef.current)
        unixRef.current.textContent = fmt(Math.floor(now.getTime() / 1000))
      if (onpageRef.current) {
        const el = Math.floor((performance.now() - mount) / 1000)
        onpageRef.current.textContent =
          el < 60
            ? `${el} second${el === 1 ? "" : "s"}`
            : `${Math.floor(el / 60)}m ${pad(el % 60)}s`
      }

      field?.draw({
        scroll: p,
        scroll2: p2,
        pulse: Math.pow(1 - ms / 1000, 3),
        phase,
        collapse,
        dive,
      })

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", updateOverlay)
      window.removeEventListener("resize", resize)
      lenis?.destroy()
    }
  }, [])

  return (
    <>
      {/* Pin this route to the exact kinetic backdrop and a dark color-scheme,
          inline in the SSR HTML so it applies at first paint — no white
          scrollbar/flash. */}
      <style>{`html,body{background:#08080a!important;overflow-x:hidden}html{color-scheme:dark!important}@media(max-width:640px){.kc-rail{display:none!important}}`}</style>
      <h1 className="sr-only">Time — the exact current time, anywhere</h1>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          display: "block",
          background: "#08080a",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          fontFamily: "var(--font-display)",
          color: "#f4f4f0",
        }}
      >
        {/* the clock — collapses into a NOW anchor on scroll */}
        <div
          ref={wrapRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            willChange: "transform",
          }}
        >
          <div
            ref={kickerRef}
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#7a7a72",
              marginBottom: 24,
            }}
          >
            &nbsp;
          </div>
          <div
            className="tabular-nums"
            aria-label="Current local time"
            style={{
              display: "flex",
              alignItems: "baseline",
              fontWeight: 500,
              letterSpacing: "-0.05em",
              lineHeight: 0.8,
              fontSize: "clamp(44px, 17vw, 280px)",
              textShadow: "0 4px 60px rgba(0,0,0,0.5)",
            }}
          >
            <span ref={hRef}>00</span>
            <span style={{ color: "#3a3a34", margin: "0 0.005em" }}>:</span>
            <span ref={mRef}>00</span>
            <span style={{ color: "#3a3a34", margin: "0 0.005em" }}>:</span>
            <span ref={sRef} style={{ color: "#7a7a72" }}>
              00
            </span>
          </div>
        </div>

        {/* scroll hint */}
        <div
          ref={hintRef}
          style={{
            position: "absolute",
            bottom: 34,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#6a6a62",
          }}
        >
          <span>Fall through time</span>
          <svg
            width="11"
            height="20"
            viewBox="0 0 11 20"
            fill="none"
            aria-hidden
          >
            <line
              x1="5.5"
              y1="0"
              x2="5.5"
              y2="17"
              stroke="#6a6a62"
              strokeWidth="1"
            />
            <path
              d="M1 13 L5.5 18 L10 13"
              stroke="#6a6a62"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        {/* station rail */}
        <div
          ref={railRef}
          className="kc-rail"
          style={{
            position: "absolute",
            right: 34,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            opacity: 0,
          }}
        >
          {RAIL.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                justifyContent: "flex-end",
              }}
            >
              <span className="rl" style={railLabel}>
                {label}
              </span>
              <span className="rd" style={railDot} />
            </div>
          ))}
        </div>

        {/* 01 — The second */}
        <div ref={s1Ref} style={station}>
          <div style={stationLabel}>The second</div>
          <div
            className="tabular-nums"
            style={{
              fontWeight: 500,
              letterSpacing: "-0.03em",
              fontSize: "clamp(26px, 8vw, 116px)",
              lineHeight: 0.92,
            }}
          >
            9,192,631,770
          </div>
          <div style={stationSub}>
            oscillations of a caesium-133 atom define exactly one second. The
            clock above is counting them — faithfully, forever.
          </div>
        </div>

        {/* 02 — Today */}
        <div ref={s2Ref} style={station}>
          <div style={stationLabel}>Today</div>
          <div style={{ ...headline, maxWidth: "13ch" }}>
            Today is{" "}
            <span className="tabular-nums" ref={todayPctRef}>
              0.0
            </span>
            % spent.
          </div>
          <div style={stationSub}>
            <span className="tabular-nums" ref={untilRef}>
              00h 00m
            </span>{" "}
            until midnight — then the count begins again.
          </div>
        </div>

        {/* 03 — This year */}
        <div ref={s3Ref} style={station}>
          <div style={stationLabel}>This year</div>
          <div style={{ ...headline, maxWidth: "13ch" }}>
            <span ref={yearRef}>2026</span> is{" "}
            <span className="tabular-nums" ref={yearPctRef}>
              0.00
            </span>
            % gone.
          </div>
          <div style={stationSub}>
            Week{" "}
            <span className="tabular-nums" ref={weekRef}>
              0
            </span>{" "}
            · Day{" "}
            <span className="tabular-nums" ref={doyRef}>
              0
            </span>{" "}
            of{" "}
            <span className="tabular-nums" ref={yearLenRef}>
              365
            </span>{" "}
            ·{" "}
            <span className="tabular-nums" ref={remainRef}>
              0
            </span>{" "}
            days still ahead of you.
          </div>
        </div>

        {/* 04 — The epoch */}
        <div ref={s4Ref} style={station}>
          <div style={stationLabel}>The epoch</div>
          <div
            className="tabular-nums"
            ref={unixRef}
            style={{
              fontFamily: mono,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              fontSize: "clamp(24px, 7vw, 104px)",
              lineHeight: 0.95,
            }}
          >
            0
          </div>
          <div style={stationSub}>
            seconds since 1 January 1970 — a number that has only ever grown,
            and never once paused.
          </div>
        </div>

        {/* 05 — Right now */}
        <div ref={s5Ref} style={station}>
          <div style={stationLabel}>Right now</div>
          <div style={{ ...headline, maxWidth: "14ch" }}>
            You&apos;ve been here{" "}
            <span className="tabular-nums" ref={onpageRef}>
              0 seconds
            </span>
            .
          </div>
          <div style={stationSub}>
            …and that, too, is already in the past. Time well spent — now back
            to it.
          </div>
        </div>

        {/* singularity finale */}
        <div
          ref={finaleRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            opacity: 0,
            willChange: "opacity",
          }}
        >
          <div
            ref={nowRef}
            style={{
              fontWeight: 600,
              letterSpacing: "-0.05em",
              fontSize: "clamp(80px,16vw,260px)",
              lineHeight: 0.8,
              textShadow: "0 0 90px rgba(0,0,0,0.7)",
              willChange: "transform, opacity",
            }}
          >
            NOW
          </div>
        </div>
        <div
          ref={escapeRef}
          style={{
            position: "absolute",
            bottom: 42,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            opacity: 0,
            fontFamily: mono,
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#cfcfc7",
          }}
        >
          Every second you spent is inside it now — ↑ climb back out
        </div>
      </div>

      {/* event-horizon flash */}
      <div
        ref={whiteRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          background: "#f6f5f1",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* scroll spacer drives the whole sequence */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "850vh",
          pointerEvents: "none",
        }}
      />
    </>
  )
}
