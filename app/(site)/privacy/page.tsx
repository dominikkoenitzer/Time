import type { Metadata } from "next"

import { PageSection, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Time collects no personal data: no accounts, no tracking cookies, no analytics.",
}

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy policy" lead="Last updated June 11, 2026.">
      <PageSection heading="The short version">
        <p>
          Time has no accounts, sets no tracking cookies, and runs no analytics.
          We don&apos;t know who you are and don&apos;t want to.
        </p>
      </PageSection>

      <PageSection heading="What stays on your device">
        <p>
          Your 12/24-hour format choice and your light/dark theme preference are
          stored in your browser&apos;s local storage. They never leave your
          device, and clearing your browser data removes them.
        </p>
      </PageSection>

      <PageSection heading="Time synchronization">
        <p>
          To synchronize the displayed time, your browser requests the current
          time from our server a few times when a page loads. These requests
          carry no personal information — only timestamps travel in either
          direction, and nothing about the measurement is stored.
        </p>
      </PageSection>

      <PageSection heading="Server logs">
        <p>
          Like virtually every website, our hosting infrastructure may keep
          short-lived technical logs (such as IP addresses and requested pages)
          for security and reliability. These are not used to identify or
          profile visitors.
        </p>
      </PageSection>

      <PageSection heading="Your time zone">
        <p>
          The local clock and time-zone information are read by your browser
          using its built-in internationalization API and rendered on your
          device. Your location is never requested and never transmitted.
        </p>
      </PageSection>

      <PageSection heading="Contact">
        <p>
          Questions about this policy? Reach out to the site operator at the
          contact address published with the service.
        </p>
      </PageSection>
    </PageShell>
  )
}
