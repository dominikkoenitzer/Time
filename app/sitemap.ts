import type { MetadataRoute } from "next"

import { FEATURED_CITIES } from "@/lib/cities"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/faq", "/privacy", "/terms"].map(
    (path) => ({
      url: `${SITE_URL}${path || "/"}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.5,
    })
  )

  const cityPages = FEATURED_CITIES.map((city) => ({
    url: `${SITE_URL}/${city.zone.toLowerCase()}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...cityPages]
}
