/**
 * The WebGL field behind the clock: one full-screen triangle running the
 * fragment shader below, driven each frame by the scroll timeline.
 *
 * `createField` hands back a small handle instead of loose uniform locations,
 * so the render loop names what it is setting and cannot silently pass the
 * wrong one. It returns null when WebGL is unavailable — the page is still
 * perfectly readable without it.
 */

// Single accent — drives the shader field, the live rail dot, the active rail
// label, and the accretion-ring glow. A muted sage rather than a vivid hue, so
// the field reads calm instead of electric.
export const ACCENT = "#a3bd93" // muted sage

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
    // muted sage field deeper down.
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

/** What the timeline feeds the shader each frame. */
export interface FieldUniforms {
  /** Scroll through the first viewport, 0..1. */
  scroll: number
  /** Scroll through the second viewport, 0..1. */
  scroll2: number
  /** Sub-second pulse, 1 on the tick and decaying to 0. */
  pulse: number
  /** Raw scroll position in viewports — drives which act is on screen. */
  phase: number
  /** Singularity collapse, 0..1. */
  collapse: number
  /** The plunge past the horizon, 0..1. */
  dive: number
}

export interface Field {
  /** Match the drawing buffer to the canvas's CSS size. */
  resize: () => void
  draw: (u: FieldUniforms) => void
}

export function createField(canvas: HTMLCanvasElement): Field | null {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null

  // Render the field in Display P3 so the sage reproduces faithfully on
  // wide-gamut displays; sRGB-only displays clamp to their gamut. Accent is
  // #a3bd93, background #08080a.
  gl.drawingBufferColorSpace = "display-p3"
  gl.unpackColorSpace = "display-p3"

  const vsh = gl.createShader(gl.VERTEX_SHADER)
  const fsh = gl.createShader(gl.FRAGMENT_SHADER)
  const prog = gl.createProgram()
  if (!vsh || !fsh || !prog) return null

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

  const u = (name: string) => gl.getUniformLocation(prog, name)
  const uRes = u("u_res")
  const uTime = u("u_time")
  const uScroll = u("u_scroll")
  const uScroll2 = u("u_scroll2")
  const uPulse = u("u_pulse")
  const uPhase = u("u_phase")
  const uCollapse = u("u_collapse")
  const uDive = u("u_dive")
  const uAccent = u("u_accent")

  const accent = hexToVec(ACCENT)

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(canvas.clientWidth * dpr)
    canvas.height = Math.floor(canvas.clientHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const draw = (f: FieldUniforms) => {
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, performance.now() / 1000)
    gl.uniform1f(uScroll, f.scroll)
    gl.uniform1f(uScroll2, f.scroll2)
    gl.uniform1f(uPulse, f.pulse)
    gl.uniform1f(uPhase, f.phase)
    gl.uniform1f(uCollapse, f.collapse)
    gl.uniform1f(uDive, f.dive)
    gl.uniform3f(uAccent, accent[0], accent[1], accent[2])
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  resize()
  return { resize, draw }
}
