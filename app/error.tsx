"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-6xl font-medium tracking-tight text-muted-foreground/40 tabular-nums">
        --:--
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The clock hit a snag. Try again — your device&apos;s time is unaffected.
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  )
}
