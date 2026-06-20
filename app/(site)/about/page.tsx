import type { Metadata } from "next"
import Link from "next/link"

import { PageSection, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "About",
  description:
    "Time shows the exact, server-corrected current time, accurate to within hundredths of a second.",
}

export default function AboutPage() {
  return (
    <PageShell
      title="About Time"
      lead="The exact time, anywhere — and an honest answer to how exact it really is."
    >
      <PageSection heading="What you can do here">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            See the exact current time, synchronized to our server and accurate
            to within hundredths of a second — even when the device you&apos;re
            on has the wrong time.
          </li>
          <li>
            Scroll the home page to fall through the clock — from this second
            out to the day, the year, and the Unix epoch.
          </li>
          <li>
            Keep it open full-screen as an ambient, always-correct wall clock.
          </li>
        </ul>
      </PageSection>

      <PageSection heading="What makes Time exact">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Time displays corrected time, not just your computer&apos;s clock.
            When a page loads, your browser measures the difference to our
            server several times — the same round-trip principle NTP uses — and
            the displayed time is adjusted by the best measurement.
          </li>
          <li>
            The correction is measured, not guessed. How precisely the time can
            be pinned depends on your connection; on a good one the displayed
            time is accurate to within a few hundredths of a second.
          </li>
          <li>
            The display updates at the beginning of every second. Many web
            clocks update at an arbitrary point within the second and drift when
            the computer is busy, causing visible two-second jumps.
          </li>
          <li>
            Your local time zone and its daylight-saving rules come from your
            browser&apos;s built-in data, applied automatically — so the date
            stays correct across DST changes even if your computer&apos;s clock
            isn&apos;t aware of them.
          </li>
          <li>
            If you adjust your computer clock, or come back to a laptop that was
            asleep, Time notices and re-synchronizes automatically.
          </li>
          <li>
            The pages are small and load fast — no trackers, no heavy scripts,
            and a design that works on any screen.
          </li>
        </ul>
      </PageSection>

      <PageSection heading="Disclaimer">
        <p>
          Time aims to be an accurate, reliable and friendly source of time. We
          do our best to show correct information, but no warranty is given, and
          any use of it is at your own risk — see the{" "}
          <Link
            href="/terms"
            className="text-foreground underline underline-offset-4"
          >
            terms of use
          </Link>
          . If you spot an error, please let us know.
        </p>
      </PageSection>

      <PageSection heading="Thanks to">
        <p>
          The maintainers of and contributors to the{" "}
          <a
            href="https://www.iana.org/time-zones"
            rel="noopener noreferrer"
            target="_blank"
            className="text-foreground underline underline-offset-4"
          >
            IANA Time Zone Database
          </a>
          , which every time and date on this site ultimately depends on, and
          the Unicode CLDR and ICU projects that deliver it to your browser.
        </p>
      </PageSection>
    </PageShell>
  )
}
