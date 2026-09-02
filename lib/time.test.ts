import { describe, expect, it } from "vitest"

import { pickBestSample, sampleOffsetMs, type SyncSample } from "./clock-sync"
import {
  formatLongDate,
  formatUtcOffset,
  getIsoWeek,
  getTimeZoneName,
  getWallClock,
  pad,
} from "./time"

describe("sampleOffsetMs: the NTP measurement", () => {
  it("reports no offset when the device clock already agrees", () => {
    // Request left at t=1000, took 200ms, so the server stamp should read 1100.
    expect(sampleOffsetMs(1100, 1000, 200)).toBe(0)
  })

  it("measures a device clock running behind", () => {
    // Server is 5s ahead: it stamps 6100 where a correct clock would read 1100.
    expect(sampleOffsetMs(6100, 1000, 200)).toBe(5000)
  })

  it("measures a device clock running ahead", () => {
    expect(sampleOffsetMs(1100, 6000, 200)).toBe(-5000)
  })

  it("attributes exactly half the round trip to the outbound leg", () => {
    // Same true offset, different latency. The correction must absorb it.
    expect(sampleOffsetMs(1000, 1000, 0)).toBe(0)
    expect(sampleOffsetMs(1050, 1000, 100)).toBe(0)
    expect(sampleOffsetMs(1500, 1000, 1000)).toBe(0)
  })

  it("bounds the error by half the round trip", () => {
    // Whatever the true offset, a sample can only be wrong by rtt/2, which is
    // the whole reason the fastest sample is preferred.
    const rtt = 80
    const truth = 4321
    const measured = sampleOffsetMs(1000 + truth + rtt / 2, 1000, rtt)
    expect(Math.abs(measured - truth)).toBeLessThanOrEqual(rtt / 2)
  })
})

describe("pickBestSample", () => {
  const samples: SyncSample[] = [
    { offsetMs: 400, rttMs: 300 },
    { offsetMs: 12, rttMs: 18 },
    { offsetMs: -900, rttMs: 1200 },
    { offsetMs: 55, rttMs: 42 },
  ]

  it("takes the lowest round trip, not the average or the last", () => {
    expect(pickBestSample(samples)).toEqual({ offsetMs: 12, rttMs: 18 })
  })

  it("is unmoved by one pathologically slow response", () => {
    const withOutlier = [...samples, { offsetMs: 99_999, rttMs: 30_000 }]
    expect(pickBestSample(withOutlier).offsetMs).toBe(12)
  })

  it("handles a single sample", () => {
    expect(pickBestSample([{ offsetMs: 7, rttMs: 9 }]).offsetMs).toBe(7)
  })
})

describe("pad", () => {
  it("pads single digits to two", () => {
    expect(pad(0)).toBe("00")
    expect(pad(7)).toBe("07")
    expect(pad(59)).toBe("59")
  })

  it("leaves anything already two or more digits alone", () => {
    expect(pad(100)).toBe("100")
  })
})

describe("getWallClock", () => {
  const instant = new Date("2026-08-17T21:34:56.000Z")

  it("reads a UTC instant as UTC", () => {
    const w = getWallClock(instant, "UTC")
    expect(w).toMatchObject({
      year: 2026,
      month: 8,
      day: 17,
      hour: 21,
      minute: 34,
      second: 56,
    })
    expect(w.weekday).toBe("Monday")
  })

  it("shifts the same instant into another zone", () => {
    // Zurich is UTC+2 in August (CEST).
    expect(getWallClock(instant, "Europe/Zurich").hour).toBe(23)
    // Tokyo is UTC+9 year-round, so this instant is already the next day.
    const tokyo = getWallClock(instant, "Asia/Tokyo")
    expect(tokyo.day).toBe(18)
    expect(tokyo.hour).toBe(6)
  })

  it("uses a 24-hour clock rather than wrapping midnight to 24", () => {
    expect(getWallClock(new Date("2026-08-17T00:15:00.000Z"), "UTC").hour).toBe(
      0
    )
  })
})

describe("formatLongDate", () => {
  const instant = new Date("2026-09-02T12:00:00.000Z")

  it("puts the day before the month and drops the American comma", () => {
    // en-US would render this "Wednesday, September 2, 2026". The parts are
    // reassembled precisely so the caption does not move with the locale.
    expect(formatLongDate(instant, "UTC")).toBe("Wednesday, 2 September 2026")
  })

  it("names the day the visitor is actually having", () => {
    // Noon UTC is already the 3rd in Auckland, a Thursday.
    expect(formatLongDate(instant, "Pacific/Auckland")).toBe(
      "Thursday, 3 September 2026"
    )
  })

  it("pads nothing: the 2nd is 2, not 02", () => {
    expect(formatLongDate(instant, "UTC")).toContain(" 2 ")
  })
})

describe("getTimeZoneName", () => {
  it("names the zone in full", () => {
    expect(getTimeZoneName(new Date("2026-09-02T12:00:00Z"), "UTC")).toBe(
      "Coordinated Universal Time"
    )
  })

  it("follows a zone in and out of summer time", () => {
    const zurich = "Europe/Zurich"
    expect(getTimeZoneName(new Date("2026-09-02T12:00:00Z"), zurich)).toBe(
      "Central European Summer Time"
    )
    expect(getTimeZoneName(new Date("2026-01-02T12:00:00Z"), zurich)).toBe(
      "Central European Standard Time"
    )
  })
})

describe("formatUtcOffset", () => {
  it("labels Greenwich itself", () => {
    expect(formatUtcOffset(0)).toBe("UTC+00:00")
  })

  it("signs east as plus and west as minus", () => {
    // The caller negates Date#getTimezoneOffset, which counts the other way,
    // so New York (+300 from that method) arrives here as -300.
    expect(formatUtcOffset(120)).toBe("UTC+02:00")
    expect(formatUtcOffset(-300)).toBe("UTC-05:00")
  })

  it("keeps the zones that are not a whole hour off", () => {
    expect(formatUtcOffset(330)).toBe("UTC+05:30") // India
    expect(formatUtcOffset(345)).toBe("UTC+05:45") // Nepal
    expect(formatUtcOffset(-570)).toBe("UTC-09:30") // Marquesas
  })

  it("pads to two digits on both sides", () => {
    expect(formatUtcOffset(60)).toBe("UTC+01:00")
    expect(formatUtcOffset(-60)).toBe("UTC-01:00")
  })

  it("handles the far ends of the range", () => {
    expect(formatUtcOffset(840)).toBe("UTC+14:00") // Kiritimati
    expect(formatUtcOffset(-720)).toBe("UTC-12:00")
  })
})

describe("getIsoWeek", () => {
  const wall = (year: number, month: number, day: number) => ({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    second: 0,
    weekday: "",
  })

  /*
   * Weeks start on Monday and week 1 is the week holding the first Thursday of
   * the year, so the turn of the year is the only place this can go wrong.
   * These are the standard boundary cases.
   */
  it("puts the first Thursday's week at 1", () => {
    expect(getIsoWeek(wall(2026, 1, 1))).toBe(1) // Thursday
    expect(getIsoWeek(wall(2021, 1, 4))).toBe(1) // Monday
  })

  it("keeps early-January days in the previous year's last week", () => {
    expect(getIsoWeek(wall(2021, 1, 1))).toBe(53) // Fri, belongs to 2020-W53
    expect(getIsoWeek(wall(2021, 1, 3))).toBe(53) // Sun, still 2020-W53
  })

  it("pulls late-December days into the next year's week 1", () => {
    expect(getIsoWeek(wall(2019, 12, 30))).toBe(1) // Mon, 2020-W01
    expect(getIsoWeek(wall(2024, 12, 30))).toBe(1) // Mon, 2025-W01
  })

  it("recognises a 53-week year", () => {
    expect(getIsoWeek(wall(2020, 12, 31))).toBe(53)
  })

  it("stays within 1..53 for every day of several years", () => {
    for (const year of [2019, 2020, 2021, 2024, 2026]) {
      for (let m = 1; m <= 12; m++) {
        for (let d = 1; d <= 28; d++) {
          const week = getIsoWeek(wall(year, m, d))
          expect(week).toBeGreaterThanOrEqual(1)
          expect(week).toBeLessThanOrEqual(53)
        }
      }
    }
  })
})
