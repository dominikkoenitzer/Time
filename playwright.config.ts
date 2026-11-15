import { defineConfig, devices } from "@playwright/test"

// Switches that keep headless Chromium off the Windows credential paths; they only mean something to Chromium.
const HARDENED_ARGS = [
  "--password-store=basic",
  "--use-mock-keychain",
  "--auth-server-allowlist=_none_",
  "--auth-negotiate-delegate-allowlist=_none_",
  "--disable-features=PasswordManagerOnboarding,BiometricAuthenticationForFilling,BiometricAuthenticationInSettings",
  "--block-new-web-contents",
]

// Not 1000: the dev and start scripts hold that one.
const PORT = 4310

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: HARDENED_ARGS,
          // A local run may point at an installed Chromium; CI leaves this unset.
          executablePath: process.env.E2E_CHROMIUM || undefined,
        },
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `bunx next build && bunx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
