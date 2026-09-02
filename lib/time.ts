/** Two-digit clock number: 7 becomes "07". */
export function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: string
}

/**
 * Looks up the formatted pieces of an instant once and hands back a getter for
 * them. Every formatter below needs the same formatToParts/find dance, so it
 * lives here instead of in each of them.
 */
function partsOf(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US"
): (type: Intl.DateTimeFormatPartTypes) => string {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date)

  return (type) => parts.find((part) => part.type === type)?.value ?? ""
}

/** An instant read as the numbers a wall clock in `timeZone` would show. */
export function getWallClock(date: Date, timeZone?: string): WallClock {
  const get = partsOf(date, {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  })

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

/**
 * "Tuesday, 2 September 2026". Assembled from the parts rather than handed to
 * a locale pattern, so the order stays put instead of following whatever
 * locale the browser happens to be in.
 */
export function formatLongDate(date: Date, timeZone?: string): string {
  const get = partsOf(date, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`
}

/**
 * "Central European Summer Time". An hour is requested alongside the zone name
 * because a format with no time component at all is not something every
 * runtime will name a zone for; only the name is read back.
 */
export function getTimeZoneName(date: Date, timeZone?: string): string {
  return partsOf(date, { timeZone, hour: "numeric", timeZoneName: "long" })(
    "timeZoneName"
  )
}

/**
 * "UTC+02:00" from an offset in minutes east of Greenwich. Takes the number
 * rather than a Date because `Date#getTimezoneOffset` counts the other way
 * (minutes to add to local time to get UTC), and that sign flip is worth
 * settling in one tested place. Not every zone is a whole hour off, so the
 * minutes are carried through.
 */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+"
  const total = Math.abs(offsetMinutes)

  return `UTC${sign}${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

/**
 * The ISO-8601 week number. Weeks start on Monday and week 1 is the week
 * holding the first Thursday of the year, so the only place this can go wrong
 * is the turn of the year, where a date can belong to its neighbour's week.
 * Shown on the clock because it is a fact about *now* that no operating-system
 * clock offers, and in European working life people actually schedule by it.
 */
export function getIsoWeek(wall: WallClock): number {
  const date = new Date(Date.UTC(wall.year, wall.month - 1, wall.day))
  const weekday = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)

  return Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7)
}
