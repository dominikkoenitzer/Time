// Loads the served production build in headless Chrome, with WebGL and without, at three widths.
import { spawn } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// Not 1000: a GitHub runner runs as a normal user and may not bind a port under 1024.
const PAGE = "http://localhost:4311/"
const SHOW_WITHIN_MS = 20_000
const SETTLE_MS = 3000

const VIEWPORTS = [
  { width: 1440, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
  { width: 360, height: 780, mobile: true },
]

const MODES = [
  {
    name: "with WebGL",
    webgl: true,
    flags: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
  { name: "without WebGL", webgl: false, flags: ["--disable-3d-apis"] },
]

// Runs in the page: all three pairs show two digits and the clock fits the screen.
function clockShown() {
  const time = document.querySelector("time")
  const pairs = [...document.querySelectorAll("time [data-pair]")]
  if (!time || pairs.length !== 3) return false
  if (!pairs.every((pair) => /^\d\d$/.test(pair.textContent))) return false
  const box = time.getBoundingClientRect()
  return box.width > 0 && box.left >= 0 && box.right <= window.innerWidth
}

// Runs in the page: proves the mode really is on or off.
function hasWebGL() {
  return Boolean(document.createElement("canvas").getContext("webgl"))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function launch(flags) {
  const profile = mkdtempSync(join(tmpdir(), "load-check-"))
  const chrome = spawn(
    "google-chrome",
    [
      "--headless",
      "--no-sandbox",
      "--mute-audio",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      ...flags,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  )
  const url = await new Promise((resolve, reject) => {
    let seen = ""
    chrome.stderr.on("data", (chunk) => {
      seen += chunk
      const match = seen.match(/ws:\/\/\S+/)
      if (match) resolve(match[0])
    })
    chrome.on("exit", (code) => reject(new Error(`Chrome quit with ${code}`)))
  })
  const quit = async () => {
    if (chrome.exitCode === null && chrome.signalCode === null) {
      await new Promise((resolve) => {
        chrome.once("exit", resolve)
        chrome.kill()
      })
    }
    rmSync(profile, { recursive: true, force: true })
  }
  return { url, quit }
}

async function connect(url) {
  const socket = new WebSocket(url)
  const waiting = new Map()
  const events = []
  let last = 0
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data)
    if (message.id === undefined) return void events.push(message)
    const { resolve, reject } = waiting.get(message.id)
    waiting.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      last += 1
      waiting.set(last, { resolve, reject })
      socket.send(JSON.stringify({ id: last, method, params, sessionId }))
    })
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve)
    socket.addEventListener("error", () => reject(new Error("No DevTools")))
  })
  return { send, events, close: () => socket.close() }
}

async function check(cdp, mode, viewport) {
  const problems = []
  const { targetId } = await cdp.send("Target.createTarget", {
    url: "about:blank",
  })
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  })
  const send = (method, params) => cdp.send(method, params, sessionId)
  const evaluate = async (fn) => {
    const { result } = await send("Runtime.evaluate", {
      expression: `(${fn})()`,
      returnByValue: true,
    })
    return result.value
  }

  await send("Runtime.enable")
  await send("Emulation.setDeviceMetricsOverride", {
    ...viewport,
    deviceScaleFactor: 1,
  })
  const { errorText } = await send("Page.navigate", { url: PAGE })
  if (errorText) problems.push(`page did not load: ${errorText}`)

  const deadline = Date.now() + SHOW_WITHIN_MS
  let shown = false
  while (!errorText && !shown && Date.now() < deadline) {
    // A context torn down by navigation throws; the next round asks again.
    shown = await evaluate(clockShown).catch(() => false)
    if (!shown) await sleep(250)
  }
  if (!errorText && !shown) problems.push("the clock never showed the time")
  await sleep(SETTLE_MS)

  if ((await evaluate(hasWebGL)) !== mode.webgl) {
    problems.push(`WebGL was ${mode.webgl ? "off" : "on"}`)
  }
  for (const event of cdp.events) {
    if (event.sessionId !== sessionId) continue
    if (event.method !== "Runtime.exceptionThrown") continue
    const { exceptionDetails } = event.params
    problems.push(
      `uncaught: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    )
  }
  await cdp.send("Target.closeTarget", { targetId })
  return problems
}

let failed = false
for (const mode of MODES) {
  const chrome = await launch(mode.flags)
  const cdp = await connect(chrome.url)
  try {
    for (const viewport of VIEWPORTS) {
      const problems = await check(cdp, mode, viewport)
      if (problems.length > 0) failed = true
      console.log(
        `${mode.name}, ${viewport.width} px: ${problems.join("; ") || "ok"}`
      )
    }
  } finally {
    cdp.close()
    await chrome.quit()
  }
}
process.exit(failed ? 1 : 0)
