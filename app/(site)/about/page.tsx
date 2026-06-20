import type { Metadata } from "next"
import Link from "next/link"

import { PageSection, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "About",
  description:
    "Time shows server-corrected, second-accurate time for every time zone on earth — and is honest about how precise that is.",
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
            See the exact current time for every time zone in the IANA database
            — search any city, or go straight to an address like{" "}
            <Link
              href="/europe/zurich"
              className="text-foreground underline underline-offset-4"
            >
              /europe/zurich
            </Link>{" "}
            or{" "}
            <Link
              href="/tokyo"
              className="text-foreground underline underline-offset-4"
            >
              /tokyo
            </Link>
            .
          </li>
          <li>Check how accurate your device clock is.</li>
          <li>
            Compare time across locations: world clocks for your favorite cities
            and an hour-by-hour strip for planning calls.
          </li>
          <li>
            Use it as a wall clock — fullscreen mode keeps the screen awake.
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
            The margin of error is measured, not promised. Every check states
            its own accuracy, which depends on your connection; on a good one it
            is typically a few hundredths of a second.
          </li>
          <li>
            The display updates at the beginning of every second. Many web
            clocks update at an arbitrary point within the second and drift when
            the computer is busy, causing visible two-second jumps.
          </li>
          <li>
            Time zones and daylight saving rules come from the IANA Time Zone
            Database, applied automatically — DST transitions are shown
            correctly even if your computer&apos;s clock isn&apos;t aware of
            them.
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
