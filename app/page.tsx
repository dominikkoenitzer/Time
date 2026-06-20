import { KineticClock } from "@/components/kinetic-clock"
import { LiveTitle } from "@/components/live-title"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript",
  isAccessibleForFree: true,
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LiveTitle label={SITE_NAME} />
      <KineticClock />
    </>
  )
}
