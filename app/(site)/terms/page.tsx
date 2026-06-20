import type { Metadata } from "next"

import { PageSection, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms under which the Time website is provided.",
}

export default function TermsPage() {
  return (
    <PageShell title="Terms of use" lead="Last updated June 11, 2026.">
      <PageSection heading="Acceptance">
        <p>
          By using this website you agree to these terms. If you don&apos;t
          agree with them, please don&apos;t use the site.
        </p>
      </PageSection>

      <PageSection heading="The service">
        <p>
          Time displays the current time for your device and for time zones
          around the world, and estimates how far your device clock deviates
          from our server clock. The service is provided free of charge, as is,
          and may change or be discontinued at any time.
        </p>
      </PageSection>

      <PageSection heading="No guarantee of accuracy">
        <p>
          We work hard to show the most accurate time we can, and we
          transparently state the measured margin of error. Even so, the
          displayed time ultimately depends on your device, your network, and
          our server. Do not rely on this site for safety-critical,
          legal-deadline, financial, or other timing-sensitive decisions.
        </p>
      </PageSection>

      <PageSection heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, the operator of this site is
          not liable for any damages arising from the use of, or inability to
          use, this website — including decisions made based on the times or
          accuracy measurements displayed.
        </p>
      </PageSection>

      <PageSection heading="Changes">
        <p>
          These terms may be updated from time to time. The date above reflects
          the latest revision; continued use after a change means you accept the
          revised terms.
        </p>
      </PageSection>
    </PageShell>
  )
}
