"use client"

import { Refresh01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { resync, useClockSync } from "@/lib/clock-sync"

export function SyncStatus() {
  const sync = useClockSync()

  if (sync.status === "unavailable") {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="size-2 rounded-full bg-muted-foreground/30"
        />
        Couldn&apos;t reach the server to synchronize the time.
        <CheckAgainButton />
      </p>
    )
  }

  if (sync.status === "checking") {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-muted-foreground/50"
        />
        Synchronizing with the server…
      </p>
    )
  }

  const { accuracyMs, samples } = sync

  // The raw measurements, inspectable on hover — nothing is made up.
  const sampleDetail = samples
    .map(
      (sample, index) =>
        `Sample ${index + 1}: round trip ${sample.rttMs.toFixed(1)} ms`
    )
    .join("\n")

  return (
    <div
      title={sampleDetail}
      className="flex flex-col items-center gap-1 text-center"
    >
      <p className="flex items-center gap-2 text-sm">
        <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
        Synchronized with the server — the time shown is exact.
        <CheckAgainButton />
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        Accuracy of synchronization was ±{(accuracyMs / 1000).toFixed(3)}{" "}
        seconds.
      </p>
    </div>
  )
}

function CheckAgainButton() {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Check again"
      title="Check again"
      onClick={resync}
      className="text-muted-foreground"
    >
      <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
    </Button>
  )
}
