import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { expect, it } from "vitest"

const root = fileURLToPath(new URL("..", import.meta.url))

it("the README badge gives the number of tests vitest runs", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8")
  const badge = /badge\/tests-(\d+)%20passing/.exec(readme)
  expect(badge, "README.md has no test badge").not.toBeNull()

  // Collecting by running the files counts each row of an it.each, as a run does.
  const list = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/vitest/vitest.mjs", import.meta.url)
      ),
      "list",
      "--json",
      "--no-static-parse",
    ],
    { cwd: root, encoding: "utf8" }
  )
  expect(list.status, "vitest could not list the tests").toBe(0)
  const collected = (JSON.parse(list.stdout) as unknown[]).length

  expect(
    Number(badge?.[1]),
    `The README badge says ${badge?.[1]} tests, but vitest runs ${collected}`
  ).toBe(collected)
}, 60_000)
