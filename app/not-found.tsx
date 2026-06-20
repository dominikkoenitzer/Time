import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-6xl font-medium tracking-tight text-muted-foreground/40 tabular-nums">
        00:00
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page doesn&apos;t exist. Head back to the clock.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to the clock</Link>
      </Button>
    </div>
  )
}
