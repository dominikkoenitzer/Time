import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // The browser specs under e2e run in Playwright.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
})
