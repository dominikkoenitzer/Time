export function pad(value: number): string {
  return String(value).padStart(2, "0")
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
