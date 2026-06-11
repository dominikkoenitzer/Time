export interface City {
  name: string
  zone: string
}

/** Curated set shown on the home page world-clock grid. */
export const FEATURED_CITIES: City[] = [
  { name: "Zürich", zone: "Europe/Zurich" },
  { name: "London", zone: "Europe/London" },
  { name: "Paris", zone: "Europe/Paris" },
  { name: "Berlin", zone: "Europe/Berlin" },
  { name: "New York", zone: "America/New_York" },
  { name: "Los Angeles", zone: "America/Los_Angeles" },
  { name: "Chicago", zone: "America/Chicago" },
  { name: "Toronto", zone: "America/Toronto" },
  { name: "São Paulo", zone: "America/Sao_Paulo" },
  { name: "Dubai", zone: "Asia/Dubai" },
  { name: "Mumbai", zone: "Asia/Kolkata" },
  { name: "Singapore", zone: "Asia/Singapore" },
  { name: "Hong Kong", zone: "Asia/Hong_Kong" },
  { name: "Tokyo", zone: "Asia/Tokyo" },
  { name: "Sydney", zone: "Australia/Sydney" },
  { name: "Auckland", zone: "Pacific/Auckland" },
]
