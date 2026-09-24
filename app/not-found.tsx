import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
      {/* A stopped clock as decoration: drawn by CSS so it is neither read
          aloud nor held to the text contrast rules. */}
      <p
        aria-hidden="true"
        className="font-mono text-7xl leading-none font-medium tracking-[-0.03em] text-muted-foreground/30 before:content-['00:00:00']"
      />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          There is nothing at this address.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to the clock</Link>
      </Button>
    </div>
  )
}
