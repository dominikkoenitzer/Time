/** Absolute origin for metadata, sitemap and robots. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://time.punds.ch"

export const SITE_NAME = "Time"

/** One title for the document, the social card and its alt text. */
export const SITE_TITLE = `${SITE_NAME}: the exact current time, anywhere`

export const SITE_DESCRIPTION =
  "The exact current time, corrected against the server and accurate to within hundredths of a second."
