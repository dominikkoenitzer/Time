"use client"

import * as React from "react"
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

/** A quiet button that copies a value to the clipboard when clicked. */
export function CopyChip({
  children,
  getValue,
  label,
}: {
  children: React.ReactNode
  getValue: () => string
  label: string
}) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<number>(undefined)

  React.useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const copy = () => {
    navigator.clipboard
      .writeText(getValue())
      .then(() => {
        setCopied(true)
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        copied && "text-emerald-600 dark:text-emerald-400"
      )}
    >
      {children}
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Copy01Icon}
        size={12}
        strokeWidth={2}
      />
    </button>
  )
}
