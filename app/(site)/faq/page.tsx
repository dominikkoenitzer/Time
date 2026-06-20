import type { Metadata } from "next"
import Link from "next/link"

import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Time: how the clock accuracy check works, what the ± margin means, and how to fix a drifting device clock.",
}

const faqs = [
  {
    question: "How does Time know if my clock is wrong?",
    answer: (
      <>
        <p>
          When the page loads, your browser asks our server for the current time
          several times in a row. For each request we know exactly when it left
          and when the answer arrived, so we can estimate the difference between
          your device clock and the server clock — the same principle NTP uses
          to synchronize computers worldwide.
        </p>
        <p>
          We keep the sample with the fastest round trip, because the less time
          the request spent on the network, the less room there is for error.
          The clocks on this site are then corrected by that measurement — so
          what you see is our best estimate of the true time, not just a copy of
          your computer&apos;s clock.
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
    question:
      "What does “Accuracy of synchronization was ±0.023 seconds” mean?",
    answer: (
      <p>
        It is the margin of error of the measurement itself. The server&apos;s
        answer travels over the network, and we can&apos;t know whether it spent
        more time on the way there or on the way back — so the true offset could
        be up to half the round-trip time away from our estimate. We state that
        bound instead of hiding it.
      </p>
    ),
  },
  {
    question: "My clock is a few seconds off. How do I fix it?",
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
    question: "Which cities and time zones are supported?",
    answer: (
      <p>
        All of them — every zone in the IANA time zone database. Press{" "}
        <kbd>/</kbd> and search for any city, or go there directly with an
        address like{" "}
        <Link
          href="/europe/zurich"
          className="text-foreground underline underline-offset-4"
        >
          /europe/zurich
        </Link>{" "}
        or simply{" "}
        <Link
          href="/tokyo"
          className="text-foreground underline underline-offset-4"
        >
          /tokyo
        </Link>
        .
      </p>
    ),
  },
  {
    question: "Can I use the 12-hour format?",
    answer: (
      <p>
        Yes — use the 24H/12H button in the header. The preference is saved on
        your device and applies everywhere: the main clock, the world clocks,
        and search results.
      </p>
    ),
  },
  {
    question: "Are there keyboard shortcuts?",
    answer: (
      <p>
        <kbd>/</kbd> focuses the search, <kbd>F</kbd> toggles the fullscreen
        clock, and <kbd>D</kbd> switches between light and dark mode.
      </p>
    ),
  },
  {
    question: "Do you collect my data?",
    answer: (
      <p>
        No accounts, no tracking, no analytics. The accuracy check only
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
      lead="Everything you might want to know about Time and the clock accuracy check."
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
