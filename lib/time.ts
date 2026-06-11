const OFFSET_PATTERN = /GMT([+-])(\d{1,2})(?::(\d{2}))?/

export function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/** Hour as displayed: "08" in 24h mode, 8 in 12h mode (caller adds AM/PM). */
export function displayHour(hour: number, hour12: boolean): string {
  return hour12 ? String(hour % 12 || 12) : pad(hour)
}

export function dayPeriod(hour: number): "AM" | "PM" {
  return hour < 12 ? "AM" : "PM"
}

export interface ZoneInfo {
  zone: string
  city: string
  region: string
  slug: string
}

export function listZones(): ZoneInfo[] {
  return Intl.supportedValuesOf("timeZone")
    .filter((zone) => zone.includes("/") && !zone.startsWith("Etc/"))
    .map(toZoneInfo)
}

export function toZoneInfo(zone: string): ZoneInfo {
  const segments = zone.split("/")

  return {
    zone,
    city: segments[segments.length - 1].replaceAll("_", " "),
    region: segments[0].replaceAll("_", " "),
    slug: zone.toLowerCase(),
  }
}

/**
 * Resolves a URL path like "europe/zurich" or just "zurich" to a canonical
 * IANA zone name, matching case-insensitively.
 */
export function resolveZone(path: string): string | null {
  const slug = decodeURIComponent(path).toLowerCase().replaceAll(" ", "_")
  const zones = Intl.supportedValuesOf("timeZone")

  const exact = zones.find((zone) => zone.toLowerCase() === slug)
  if (exact) return exact

  const bySuffix = zones.find((zone) => zone.toLowerCase().endsWith(`/${slug}`))
  if (bySuffix) return bySuffix

  // Aliases missing from supportedValuesOf (e.g. Asia/Kolkata where ICU
  // lists Asia/Calcutta): accept anything Intl can canonicalize.
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: slug }).resolvedOptions()
      .timeZone
  } catch {
    return null
  }
}

export function getOffsetMinutes(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value

  const match = name?.match(OFFSET_PATTERN)
  if (!match) return 0

  const sign = match[1] === "-" ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0))
}

export function formatOffset(minutes: number): string {
  if (minutes === 0) return "UTC±0"

  const sign = minutes < 0 ? "−" : "+"
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60

  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`
}

export function getZoneLongName(date: Date, timeZone: string): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "long" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  )
}

interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: string
}

export function getWallClock(date: Date, timeZone?: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  }
}

export function getIsoWeek(wall: WallClock): number {
  const date = new Date(Date.UTC(wall.year, wall.month - 1, wall.day))
  const weekday = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)

  return Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

export function getDayOfYear(wall: WallClock): number {
  const start = Date.UTC(wall.year, 0, 1)
  const today = Date.UTC(wall.year, wall.month - 1, wall.day)

  return Math.round((today - start) / 86_400_000) + 1
}

export function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 18
}

/** Whether the zone's calendar date is behind (−1), same (0), or ahead (+1) of the viewer's. */
export function getDayShift(date: Date, timeZone: string): -1 | 0 | 1 {
  const remote = getWallClock(date, timeZone)
  const local = getWallClock(date)
  const remoteDay = Date.UTC(remote.year, remote.month - 1, remote.day)
  const localDay = Date.UTC(local.year, local.month - 1, local.day)

  return remoteDay === localDay ? 0 : remoteDay > localDay ? 1 : -1
}

export function formatDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

/**
 * Difference between a zone and the viewer's own zone, as a label like
 * "+7:30h" / "−6h" / "Same as local time".
 */
export function formatZoneDifference(date: Date, timeZone: string): string {
  const local = getOffsetMinutes(date, Intl.DateTimeFormat().resolvedOptions().timeZone)
  const remote = getOffsetMinutes(date, timeZone)
  const diff = remote - local

  if (diff === 0) return "Same as local time"

  const sign = diff < 0 ? "−" : "+"
  const abs = Math.abs(diff)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60

  return `${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}h from local`
}
