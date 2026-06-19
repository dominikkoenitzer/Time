"use client"

import * as React from "react"

import { correctedNowMs, ensureClockSync } from "@/lib/clock-sync"
import { getDayOfYear, getIsoWeek, getWallClock, pad } from "@/lib/time"

// Single accent — drives the shader field, the live rail dot, the active rail
// label, and the accretion-ring glow. Kept clear of the site's blue; the
// design's palette was lime / teal / amber / periwinkle / rose.
const ACCENT = "#c6f04a" // lime — matches the reference design

function hexToVec(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`

const FRAG = `
  precision highp float;
  uniform vec2 u_res; uniform float u_time; uniform float u_scroll;
  uniform float u_scroll2; uniform float u_pulse; uniform float u_phase; uniform float u_collapse; uniform float u_dive; uniform vec3 u_accent;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.03; a*=.5;} return v; }
  void main(){
    vec2 uv=(gl_FragCoord.xy - .5*u_res)/u_res.y;
    uv *= 1.0/(1.0 + u_dive*7.0);   // plunge toward the singularity
    float ang=u_phase*0.10; mat2 rot=mat2(cos(ang),-sin(ang),sin(ang),cos(ang)); uv=rot*uv;
    float t=u_time*0.05;
    float sc=u_scroll;
    float fr=1.4 + u_phase*0.16;
    vec2 q=vec2(fbm(uv*fr + vec2(0.,t)), fbm(uv*fr + vec2(5.2,t*1.3)));
    vec2 r=vec2(fbm(uv*fr + 3.*q + vec2(1.7,9.2) - t*0.5), fbm(uv*fr + 3.*q + vec2(8.3,2.8) + t*0.4));
    float f=fbm(uv*fr + (2.5+1.5*sc)*r);
    vec3 base=vec3(0.02,0.02,0.028);
    vec3 col=mix(base, u_accent, clamp(f*1.45,0.,1.));
    col=mix(col, vec3(0.95), pow(clamp(f,0.,1.),3.0)*0.55);
    float energy=mix(0.14, 1.0, smoothstep(0.,1.,sc));
    col*=energy;
    col += u_accent * 0.18 * u_scroll2 * (0.5+0.5*sin(f*22. + u_time*1.5));
    col += u_accent * 0.05 * u_pulse;
    col *= (0.82 + 0.18*cos(vec3(0.,2.1,4.2) + u_phase*0.55));
    float vig=smoothstep(1.5,0.12,length(uv));
    col*=vig*0.66+0.34;
    col*=mix(0.22,1.0, smoothstep(0.0,0.55,sc));

    // Clean hero: at rest the field is pure background (no texture/effects). Once
    // you start scrolling it fades in — gray first, then climbing into the
    // lime/gold field deeper down.
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    float reveal = smoothstep(0.0, 0.7, u_phase);
    float colorAmt = smoothstep(0.8, 3.0, u_phase);
    vec3 field = mix(vec3(lum) * 0.45, col, colorAmt);
    col = mix(vec3(0.031, 0.031, 0.039), field, reveal);

    // ---- SINGULARITY ----
    float cps = u_collapse;
    if (cps > 0.001) {
      float cr = length(uv);
      float cang = atan(uv.y, uv.x);
      float hor = mix(0.0, 0.11, smoothstep(0.0,0.45,cps));
      float sw = cps*(0.95/(cr+0.08)) + u_time*0.25*cps;
      float ar = cang + sw;
      vec2 dc = vec2(cos(ar), sin(ar)) * pow(cr, mix(1.0,0.62,cps));
      float disk = fbm(dc*4.2 + vec2(u_time*0.3,0.0));
      vec3 bh = u_accent * (0.32 + disk*1.55);
      float ringR = hor*1.7 + 0.015;
      float ring = exp(-pow((cr-ringR)/(0.05+0.02*cps),2.0));
      bh += (u_accent*1.35 + vec3(0.45)) * ring * (0.5+0.65*cos(ar));
      bh += vec3(0.75,0.82,1.0) * exp(-pow((cr-ringR*0.82)/0.035,2.0)) * 0.6;
      bh += u_accent * 0.16 * cps * pow(max(0.0,sin(cang*28.0 + sw*2.0)),4.0) * smoothstep(0.7,hor,cr);
      bh *= smoothstep(hor*0.88, hor*1.06, cr);
      col = mix(col, bh, cps);
      col *= mix(1.0, smoothstep(1.3,0.06,cr), cps*0.72);
    }

    gl_FragColor=vec4(col,1.);
  }`

const mono = "var(--font-kinetic-mono)"

const station: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 40px",
  opacity: 0,
  willChange: "opacity, transform",
  // Dark shadow (inherited by all station text) so captions stay legible over
  // the bright lime/gold field.
  textShadow: "0 1px 4px rgba(0, 0, 0, 0.85), 0 0 18px rgba(0, 0, 0, 0.5)",
}
const stationLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#cfcfc7",
  marginBottom: 28,
}
const stationSub: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 13,
  lineHeight: 1.75,
  color: "#deded7",
  maxWidth: 540,
  marginTop: 30,
}
const headline: React.CSSProperties = {
  fontWeight: 500,
  letterSpacing: "-0.025em",
  fontSize: "clamp(30px, 6.4vw, 92px)",
  lineHeight: 1.02,
}
const railLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#5a5a54",
}
const railDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  border: "1px solid #4a4a44",
}

const RAIL = ["The second", "Today", "This year", "The epoch", "Right now"]

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

    const mount = performance.now()
    const canvas = canvasRef.current
    const gl = canvas?.getContext("webgl", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    })

    const accentVec = hexToVec(ACCENT)

    const stations: [React.RefObject<HTMLDivElement | null>, number, number][] = [
      [s1Ref, 0.85, 1.95],
      [s2Ref, 1.85, 2.95],
      [s3Ref, 2.85, 3.95],
      [s4Ref, 3.85, 4.95],
      [s5Ref, 4.85, 6.05],
    ]

    const easeIO = (x: number) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    const sstep = (a: number, b: number, x: number) => {
      x = Math.min(1, Math.max(0, (x - a) / (b - a)))
      return x * x * (3 - 2 * x)
    }
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

    const resize = () => {
      if (!gl || !canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    let uRes: WebGLUniformLocation | null = null
    let uTime: WebGLUniformLocation | null = null
    let uScroll: WebGLUniformLocation | null = null
    let uScroll2: WebGLUniformLocation | null = null
    let uPulse: WebGLUniformLocation | null = null
    let uPhase: WebGLUniformLocation | null = null
    let uCollapse: WebGLUniformLocation | null = null
    let uDive: WebGLUniformLocation | null = null
    let uAccent: WebGLUniformLocation | null = null

    if (gl && canvas) {
      // Render the field in Display P3 to reproduce the original's vivid lime —
      // the design preview draws wide-gamut, which is where the punch comes
      // from. On P3-capable displays this matches the original; sRGB-only
      // displays clamp to their gamut. Accent stays #c6f04a, background #08080a.
      gl.drawingBufferColorSpace = "display-p3"
      gl.unpackColorSpace = "display-p3"

      const vsh = gl.createShader(gl.VERTEX_SHADER)
      const fsh = gl.createShader(gl.FRAGMENT_SHADER)
      const prog = gl.createProgram()
      if (vsh && fsh && prog) {
        gl.shaderSource(vsh, VERT)
        gl.compileShader(vsh)
        gl.shaderSource(fsh, FRAG)
        gl.compileShader(fsh)
        gl.attachShader(prog, vsh)
        gl.attachShader(prog, fsh)
        gl.linkProgram(prog)
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 3, -1, -1, 3]),
          gl.STATIC_DRAW
        )
        const loc = gl.getAttribLocation(prog, "a")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        uRes = gl.getUniformLocation(prog, "u_res")
        uTime = gl.getUniformLocation(prog, "u_time")
        uScroll = gl.getUniformLocation(prog, "u_scroll")
        uScroll2 = gl.getUniformLocation(prog, "u_scroll2")
        uPulse = gl.getUniformLocation(prog, "u_pulse")
        uPhase = gl.getUniformLocation(prog, "u_phase")
        uCollapse = gl.getUniformLocation(prog, "u_collapse")
        uDive = gl.getUniformLocation(prog, "u_dive")
        uAccent = gl.getUniformLocation(prog, "u_accent")

        resize()
        window.addEventListener("resize", resize)
      }
    }

    let raf = 0
    const frame = () => {
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
          collapse = (diveC0 || 0.5) + (1 - (diveC0 || 0.5)) * sstep(0, 0.35, dt)
          dive = k * k * k // accelerating plunge
          flash = sstep(A - 0.45, A, dt)
          if (finaleRef.current) finaleRef.current.style.opacity = "0"
          if (railRef.current) railRef.current.style.opacity = "0"
          if (wrapRef.current) wrapRef.current.style.opacity = "0"
        } else if (!reset) {
          // crossed the horizon
          reset = true
          rebornStart = pnow
          window.scrollTo(0, 0)
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
            kickerRef.current.style.opacity = String(Math.max(0, (ease - 0.45) / 0.55))
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
      const yearLen =
        (wall.year % 4 === 0 && wall.year % 100 !== 0) || wall.year % 400 === 0
          ? 366
          : 365
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
      if (weekRef.current) weekRef.current.textContent = String(getIsoWeek(wall))
      if (doyRef.current) doyRef.current.textContent = String(doy)
      if (yearLenRef.current) yearLenRef.current.textContent = String(yearLen)
      if (remainRef.current) remainRef.current.textContent = String(yearLen - doy)
      if (unixRef.current)
        unixRef.current.textContent = fmt(Math.floor(now.getTime() / 1000))
      if (onpageRef.current) {
        const el = Math.floor((performance.now() - mount) / 1000)
        onpageRef.current.textContent =
          el < 60
            ? `${el} second${el === 1 ? "" : "s"}`
            : `${Math.floor(el / 60)}m ${pad(el % 60)}s`
      }

      if (gl && canvas) {
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform1f(uTime, performance.now() / 1000)
        gl.uniform1f(uScroll, p)
        gl.uniform1f(uScroll2, p2)
        gl.uniform1f(uPulse, Math.pow(1 - ms / 1000, 3))
        gl.uniform1f(uPhase, phase)
        gl.uniform1f(uCollapse, collapse)
        gl.uniform1f(uDive, dive)
        gl.uniform3f(uAccent, accentVec[0], accentVec[1], accentVec[2])
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", updateOverlay)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <>
      {/* Force this immersive route fully dark regardless of the site's theme:
          overrides next-themes' light color-scheme and the white body bg. In the
          SSR HTML, so it applies at first paint — no white scrollbar/flash. */}
      <style>{`html,body{background:#08080a!important;overflow-x:hidden}html{color-scheme:dark!important}@media(max-width:640px){.kc-rail{display:none!important}}`}</style>
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
          <svg width="11" height="20" viewBox="0 0 11 20" fill="none">
            <line x1="5.5" y1="0" x2="5.5" y2="17" stroke="#6a6a62" strokeWidth="1" />
            <path d="M1 13 L5.5 18 L10 13" stroke="#6a6a62" strokeWidth="1" fill="none" />
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
              style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "flex-end" }}
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
            style={{ fontWeight: 500, letterSpacing: "-0.03em", fontSize: "clamp(26px, 8vw, 116px)", lineHeight: 0.92 }}
          >
            9,192,631,770
          </div>
          <div style={stationSub}>
            oscillations of a caesium-133 atom define exactly one second. The clock
            above is counting them — faithfully, forever.
          </div>
        </div>

        {/* 02 — Today */}
        <div ref={s2Ref} style={station}>
          <div style={stationLabel}>Today</div>
          <div style={{ ...headline, maxWidth: "13ch" }}>
            Today is <span className="tabular-nums" ref={todayPctRef}>0.0</span>% spent.
          </div>
          <div style={stationSub}>
            <span className="tabular-nums" ref={untilRef}>00h 00m</span> until midnight —
            then the count begins again.
          </div>
        </div>

        {/* 03 — This year */}
        <div ref={s3Ref} style={station}>
          <div style={stationLabel}>This year</div>
          <div style={{ ...headline, maxWidth: "13ch" }}>
            <span ref={yearRef}>2026</span> is{" "}
            <span className="tabular-nums" ref={yearPctRef}>0.00</span>% gone.
          </div>
          <div style={stationSub}>
            Week <span className="tabular-nums" ref={weekRef}>0</span> · Day{" "}
            <span className="tabular-nums" ref={doyRef}>0</span> of{" "}
            <span className="tabular-nums" ref={yearLenRef}>365</span> ·{" "}
            <span className="tabular-nums" ref={remainRef}>0</span> days still ahead of you.
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
            seconds since 1 January 1970 — a number that has only ever grown, and
            never once paused.
          </div>
        </div>

        {/* 05 — Right now */}
        <div ref={s5Ref} style={station}>
          <div style={stationLabel}>Right now</div>
          <div style={{ ...headline, maxWidth: "14ch" }}>
            You&apos;ve been here{" "}
            <span className="tabular-nums" ref={onpageRef}>0 seconds</span>.
          </div>
          <div style={stationSub}>
            …and that, too, is already in the past. Time well spent — now back to it.
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
        style={{ position: "relative", zIndex: 1, height: "850vh", pointerEvents: "none" }}
      />
    </>
  )
}
