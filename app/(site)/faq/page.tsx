import type { Metadata } from "next"
import Link from "next/link"

import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Time: how it stays accurate, which time zones it supports, and the keyboard shortcuts.",
}

const faqs = [
  {
    question: "How does Time stay accurate?",
    answer: (
      <>
        <p>
          When the page loads, your browser asks our server for the current time
          several times in a row. For each request we know exactly when it left
          and when the answer arrived, so we can measure the round trip and read
          the server&apos;s time precisely — the same principle NTP uses to
          synchronize computers worldwide.
        </p>
        <p>
          We keep the sample with the fastest round trip, because the less time
          the request spent on the network, the less room there is for error.
          The clocks on this site are corrected by that measurement — so what
          you see is our best estimate of the true time, independent of the
          device you are viewing it on.
        </p>
      </>
    ),
  },
  {
    question: "What happens if I change my computer's clock?",
    answer: (
      <p>
        Time notices. A background check compares your wall clock against the
        browser&apos;s monotonic clock, and any sudden jump — adjusting the
        clock by hand, or a laptop waking from sleep — triggers an automatic
        re-synchronization. The measurement is also refreshed when you return to
        the tab after a while.
      </p>
    ),
  },
  {
    question: "How do I keep my computer's clock accurate?",
    answer: (
      <p>
        Enable automatic time synchronization in your operating system. On
        Windows: Settings → Time &amp; language → Date &amp; time → “Set time
        automatically”. On macOS: System Settings → General → Date &amp; Time.
        On phones it is usually on by default under “Date &amp; time”.
      </p>
    ),
  },
  {
    question: "Are there keyboard shortcuts?",
    answer: (
      <p>
        <kbd>D</kbd> switches between light and dark mode.
      </p>
    ),
  },
  {
    question: "Do you collect my data?",
    answer: (
      <p>
        No accounts, no tracking, no analytics. Synchronizing the time only
        exchanges timestamps with the server. See the{" "}
        <Link
          href="/privacy"
          className="text-foreground underline underline-offset-4"
        >
          privacy policy
        </Link>{" "}
        for details.
      </p>
    ),
  },
]

export default function FaqPage() {
  return (
    <PageShell
      title="Frequently asked questions"
      lead="Everything you might want to know about Time and how it stays accurate."
    >
      <div className="flex flex-col gap-3">
        {faqs.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-2xl border border-border bg-card px-4 py-3 transition-colors open:bg-muted/30"
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-foreground select-none marker:hidden [&::-webkit-details-marker]:hidden">
              {question}
            </summary>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </div>
          </details>
        ))}
      </div>
    </PageShell>
  )
}
