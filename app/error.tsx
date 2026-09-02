"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
      <p className="font-mono text-7xl leading-none font-medium tracking-[-0.03em] text-muted-foreground/30">
        --:--:--
      </p>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The clock hit a snag. Try again. Nothing on your device was touched.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
