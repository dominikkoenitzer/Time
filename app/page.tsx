import { Clock } from "@/components/clock"
import { LiveTitle } from "@/components/live-title"
import { SITE_NAME, SITE_TITLE } from "@/lib/site"

export default function Page() {
  return (
    <>
      {/* The clock is the whole page, so the heading exists for screen readers
          and search results rather than for the layout. */}
      <h1 className="sr-only">{SITE_TITLE}</h1>
      <LiveTitle label={SITE_NAME} />
      <Clock />
    </>
  )
}
