import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// Answered in the browser, so the server never queries NTP or Cloudflare.
const STUB_TIME = {
  now: Date.UTC(2026, 0, 1, 12, 0, 0),
  offsetMs: 0,
  rttMs: 0,
  source: "stub",
}

const PAGES = [
  { path: "/", status: 200, syncs: true },
  { path: "/no-such-page", status: 404, syncs: false },
]

for (const { path, status, syncs } of PAGES) {
  test(`${path} renders without errors or serious axe issues`, async ({
    page,
    baseURL,
  }) => {
    const documentUrl = new URL(path, baseURL).href
    const problems: string[] = []
    let timeRequests = 0

    await page.route("**/api/time", (route) => {
      timeRequests++
      return route.fulfill({ json: STUB_TIME })
    })
    page.on("pageerror", (error) => problems.push(`uncaught: ${error.message}`))
    page.on("console", (message) => {
      const type = message.type()
      if (type !== "error" && type !== "warning") return
      // The browser reports the 404 document's own status; that is the page working.
      const ownStatus =
        status !== 200 &&
        message.location().url === documentUrl &&
        message.text().startsWith("Failed to load resource")
      if (!ownStatus) problems.push(`${type}: ${message.text()}`)
    })

    const response = await page.goto(path)
    expect(response?.status()).toBe(status)
    await expect(page.getByRole("main")).toBeVisible()
    await page.waitForLoadState("networkidle")
    if (syncs) expect(timeRequests).toBeGreaterThan(0)

    const { violations } = await new AxeBuilder({ page }).analyze()
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.help}, ${v.nodes.length} nodes`)
    expect(serious).toEqual([])
    expect(problems).toEqual([])
  })
}
