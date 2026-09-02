import type { Metadata, Viewport } from "next"
import { Figtree, Geist_Mono } from "next/font/google"

import "./globals.css"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site"
import { cn } from "@/lib/utils"

// Two faces, each with a job: the mono sets every number and caption on the
// clock, the sans carries the prose on the error and not-found pages.
const fontSans = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

// Structured data: only facts that are true of the page itself.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "dominikkoenitzer",
    url: "https://github.com/dominikkoenitzer",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "antialiased",
        "font-sans",
        fontSans.variable,
        fontMono.variable
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* One screen, and the only landmark: everything the site has to say
            is the clock, so this is the region a screen reader jumps to.
            `my-auto` rather than `justify-center` does the centring on purpose
            -- an auto margin collapses to zero when the viewport is too short,
            where centring would instead push the top of the content past the
            top edge, somewhere no scroll or zoom can reach it. Horizontal
            alignment is left to each route, which is why this centres nothing
            itself. */}
        <main className="flex min-h-svh flex-col justify-start px-8 py-8 md:px-16">
          <div className="my-auto w-full">{children}</div>
        </main>
      </body>
    </html>
  )
}
