import { describe, expect, it } from "vitest"

import { pickBestSample, sampleOffsetMs, type SyncSample } from "./clock-sync"
import { easeIO, sstep } from "./kinetic/easing"
import { daysInYear, getDayOfYear, getIsoWeek, getWallClock, pad } from "./time"

const wall = (year: number, month: number, day: number) => ({
  year,
  month,
  day,
  hour: 12,
  minute: 0,
  second: 0,
  weekday: "",
})

describe("sampleOffsetMs — the NTP measurement", () => {
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
    // Same true offset, different latency — the correction must absorb it.
    expect(sampleOffsetMs(1000, 1000, 0)).toBe(0)
    expect(sampleOffsetMs(1050, 1000, 100)).toBe(0)
    expect(sampleOffsetMs(1500, 1000, 1000)).toBe(0)
  })

  it("bounds the error by half the round trip", () => {
    // Whatever the true offset, a sample can only be wrong by rtt/2 — that is
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

describe("getIsoWeek", () => {
  /*
   * ISO-8601 weeks start on Monday and week 1 is the week containing the first
   * Thursday of the year — which is why the turn of the year is the only place
   * this can go wrong. These are the standard boundary cases.
   */
  it("puts the first Thursday's week at 1", () => {
    expect(getIsoWeek(wall(2026, 1, 1))).toBe(1) // Thursday
    expect(getIsoWeek(wall(2021, 1, 4))).toBe(1) // Monday
  })

  it("keeps early-January days in the previous year's last week", () => {
    expect(getIsoWeek(wall(2021, 1, 1))).toBe(53) // Fri — belongs to 2020-W53
    expect(getIsoWeek(wall(2021, 1, 3))).toBe(53) // Sun — still 2020-W53
  })

  it("pulls late-December days into the next year's week 1", () => {
    expect(getIsoWeek(wall(2019, 12, 30))).toBe(1) // Mon — 2020-W01
    expect(getIsoWeek(wall(2024, 12, 30))).toBe(1) // Mon — 2025-W01
  })

  it("recognises a 53-week year", () => {
    expect(getIsoWeek(wall(2020, 12, 31))).toBe(53)
  })

  it("stays within 1..53 for every day of several years", () => {
    for (const year of [2019, 2020, 2021, 2024, 2026]) {
      for (let m = 1; m <= 12; m++) {
        for (let d = 1; d <= 28; d++) {
          const w = getIsoWeek(wall(year, m, d))
          expect(w).toBeGreaterThanOrEqual(1)
          expect(w).toBeLessThanOrEqual(53)
        }
      }
    }
  })
})

describe("getDayOfYear", () => {
  it("counts from 1 on January 1st", () => {
    expect(getDayOfYear(wall(2026, 1, 1))).toBe(1)
  })

  it("handles the end of a common year", () => {
    expect(getDayOfYear(wall(2026, 12, 31))).toBe(365)
  })

  it("handles the end of a leap year", () => {
    expect(getDayOfYear(wall(2024, 12, 31))).toBe(366)
    expect(getDayOfYear(wall(2024, 3, 1))).toBe(61) // Feb 29 exists
    expect(getDayOfYear(wall(2026, 3, 1))).toBe(60) // it does not
  })

  it("increases by exactly one per day across a month boundary", () => {
    expect(
      getDayOfYear(wall(2026, 2, 1)) - getDayOfYear(wall(2026, 1, 31))
    ).toBe(1)
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

describe("daysInYear", () => {
  it("is 365 in a common year", () => {
    expect(daysInYear(2026)).toBe(365)
    expect(daysInYear(2025)).toBe(365)
  })

  it("is 366 in a leap year", () => {
    expect(daysInYear(2024)).toBe(366)
    expect(daysInYear(2020)).toBe(366)
  })

  it("applies the century rule", () => {
    // Divisible by 4 but not a leap year — the case a naive `% 4` gets wrong.
    expect(daysInYear(1900)).toBe(365)
    expect(daysInYear(2100)).toBe(365)
    // Divisible by 400, so it is one after all.
    expect(daysInYear(2000)).toBe(366)
    expect(daysInYear(2400)).toBe(366)
  })

  it("agrees with the day-of-year count for December 31st", () => {
    for (const year of [1900, 2000, 2020, 2024, 2025, 2026, 2100]) {
      expect(getDayOfYear({ ...wall(year, 12, 31) })).toBe(daysInYear(year))
    }
  })
})

describe("easeIO", () => {
  it("is pinned at both ends and passes through the midpoint", () => {
    expect(easeIO(0)).toBe(0)
    expect(easeIO(1)).toBe(1)
    expect(easeIO(0.5)).toBeCloseTo(0.5, 10)
  })

  it("rises monotonically", () => {
    let prev = -Infinity
    for (let i = 0; i <= 100; i++) {
      const v = easeIO(i / 100)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it("is symmetric about the midpoint", () => {
    for (const x of [0.1, 0.25, 0.4]) {
      expect(easeIO(x) + easeIO(1 - x)).toBeCloseTo(1, 10)
    }
  })
})

describe("sstep", () => {
  it("clamps outside the thresholds rather than running away", () => {
    expect(sstep(0.2, 0.8, 0)).toBe(0)
    expect(sstep(0.2, 0.8, -5)).toBe(0)
    expect(sstep(0.2, 0.8, 1)).toBe(1)
    expect(sstep(0.2, 0.8, 99)).toBe(1)
  })

  it("hits the thresholds exactly", () => {
    expect(sstep(0.2, 0.8, 0.2)).toBe(0)
    expect(sstep(0.2, 0.8, 0.8)).toBe(1)
  })

  it("is half way at the midpoint of the band", () => {
    expect(sstep(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 10)
    expect(sstep(6.1, 7.3, 6.7)).toBeCloseTo(0.5, 10)
  })

  it("rises monotonically across the band", () => {
    let prev = -Infinity
    for (let i = 0; i <= 100; i++) {
      const v = sstep(0.2, 0.8, i / 100)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it("never leaves 0..1, whatever the band", () => {
    for (const [a, b] of [
      [0, 1],
      [0.55, 1.15],
      [6.1, 7.3],
      [-2, 3],
    ]) {
      for (let i = -20; i <= 120; i++) {
        const v = sstep(a, b, i / 10)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})
