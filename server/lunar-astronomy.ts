import * as Astronomy from "astronomy-engine";
import {
  type CelestialData,
  type EclipseType,
  type LunarCalendarDay,
  type LunarEvent,
  type MoonPhase,
  type MonthlyLunarCalendar,
  type ZodiacSign,
} from "@shared/schema";

const zodiacSigns: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signForLongitude(longitude: number): ZodiacSign {
  return zodiacSigns[Math.floor(normalizeDegrees(longitude) / 30) % 12];
}

function phaseForAngle(angle: number): MoonPhase {
  const normalized = normalizeDegrees(angle);
  if (normalized < 22.5 || normalized >= 337.5) return "new_moon";
  if (normalized < 67.5) return "waxing_crescent";
  if (normalized < 112.5) return "first_quarter";
  if (normalized < 157.5) return "waxing_gibbous";
  if (normalized < 202.5) return "full_moon";
  if (normalized < 247.5) return "waning_gibbous";
  if (normalized < 292.5) return "last_quarter";
  return "waning_crescent";
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function eventTime(date: Date) {
  return date.toISOString().slice(11, 16);
}

function eclipseType(kind: Astronomy.EclipseKind, solar: boolean): EclipseType {
  if (solar) {
    if (kind === Astronomy.EclipseKind.Total) return "total_solar";
    if (kind === Astronomy.EclipseKind.Annular) return "annular_solar";
    return "partial_solar";
  }
  if (kind === Astronomy.EclipseKind.Total) return "total_lunar";
  if (kind === Astronomy.EclipseKind.Partial) return "partial_lunar";
  return "penumbral_lunar";
}

export function getAstronomicalSnapshot(date = new Date()) {
  const instant = new Date(date.getTime());
  const moonLongitude = normalizeDegrees(Astronomy.EclipticGeoMoon(instant).lon);
  const sunLongitude = normalizeDegrees(Astronomy.SunPosition(instant).elon);
  const phaseAngle = normalizeDegrees(Astronomy.MoonPhase(instant));
  const illumination = Astronomy.Illumination(
    Astronomy.Body.Moon,
    instant,
  ).phase_fraction;

  return {
    instant: instant.toISOString(),
    moonPhase: phaseForAngle(phaseAngle),
    phaseAngle,
    illumination: Math.min(1, Math.max(0, illumination)),
    moonLongitude,
    moonSign: signForLongitude(moonLongitude),
    sunLongitude,
    sunSign: signForLongitude(sunLongitude),
  };
}

function phaseEventsForYear(year: number): LunarEvent[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const events: LunarEvent[] = [];

  (
    [
      { angle: 0, type: "new_moon" },
      { angle: 180, type: "full_moon" },
    ] as const
  ).forEach(({ angle, type }) => {
    let cursor = start;
    while (cursor < end) {
      const result = Astronomy.SearchMoonPhase(angle, cursor, 40);
      if (!result || result.date >= end) break;
      const snapshot = getAstronomicalSnapshot(result.date);
      events.push({
        date: dateKey(result.date),
        instant: result.date.toISOString(),
        type,
        moonSign: snapshot.moonSign,
        sunSign: snapshot.sunSign,
        time: eventTime(result.date),
      });
      cursor = new Date(result.date.getTime() + 60_000);
    }
  });

  return events;
}

function eclipseEventsForYear(year: number): LunarEvent[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const events: LunarEvent[] = [];

  let lunar = Astronomy.SearchLunarEclipse(start);
  while (lunar.peak.date < end) {
    if (lunar.peak.date >= start) {
      const snapshot = getAstronomicalSnapshot(lunar.peak.date);
      events.push({
        date: dateKey(lunar.peak.date),
        instant: lunar.peak.date.toISOString(),
        type: "lunar_eclipse",
        eclipseType: eclipseType(lunar.kind, false),
        moonSign: snapshot.moonSign,
        sunSign: snapshot.sunSign,
        time: eventTime(lunar.peak.date),
      });
    }
    lunar = Astronomy.NextLunarEclipse(lunar.peak);
  }

  let solar = Astronomy.SearchGlobalSolarEclipse(start);
  while (solar.peak.date < end) {
    if (solar.peak.date >= start) {
      const snapshot = getAstronomicalSnapshot(solar.peak.date);
      events.push({
        date: dateKey(solar.peak.date),
        instant: solar.peak.date.toISOString(),
        type: "solar_eclipse",
        eclipseType: eclipseType(solar.kind, true),
        moonSign: snapshot.moonSign,
        sunSign: snapshot.sunSign,
        time: eventTime(solar.peak.date),
      });
    }
    solar = Astronomy.NextGlobalSolarEclipse(solar.peak);
  }

  return events;
}

export function getLunarEventsForYear(year: number) {
  return [...phaseEventsForYear(year), ...eclipseEventsForYear(year)].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      (left.time ?? "").localeCompare(right.time ?? ""),
  );
}

export function getMonthlyAstronomicalCalendar(
  year: number,
  month: number,
): MonthlyLunarCalendar {
  const events = getLunarEventsForYear(year);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const lunarEvents = events.filter((event) =>
    event.date.startsWith(monthPrefix),
  );
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: LunarCalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const instant = new Date(Date.UTC(year, month - 1, day, 12));
    const snapshot = getAstronomicalSnapshot(instant);
    const key = dateKey(instant);
    const dayEvents = lunarEvents.filter((event) => event.date === key);
    const eclipse = dayEvents.find(
      (event) => event.type === "lunar_eclipse" || event.type === "solar_eclipse",
    );

    days.push({
      date: key,
      instant: snapshot.instant,
      moonPhase: snapshot.moonPhase,
      moonSign: snapshot.moonSign,
      sunSign: snapshot.sunSign,
      illumination: snapshot.illumination,
      phaseAngle: snapshot.phaseAngle,
      moonLongitude: snapshot.moonLongitude,
      isNewMoon: dayEvents.some((event) => event.type === "new_moon"),
      isFullMoon: dayEvents.some((event) => event.type === "full_moon"),
      eclipse: eclipse?.eclipseType
        ? {
            type: eclipse.eclipseType,
          }
        : undefined,
    });
  }

  return {
    schemaVersion: 2,
    year,
    month,
    days,
    lunarEvents,
    dataSource: "astronomy-engine",
    referenceFrame: "geocentric-tropical",
    generatedAt: new Date().toISOString(),
  };
}

function nextPhaseDate(angle: 0 | 180, from: Date) {
  const result = Astronomy.SearchMoonPhase(angle, from, 40);
  if (!result) throw new Error("Unable to calculate the next lunar phase.");
  return result.date;
}

export function getCurrentCelestialData(date = new Date()): CelestialData {
  const snapshot = getAstronomicalSnapshot(date);
  return {
    ...snapshot,
    nextFullMoon: nextPhaseDate(180, date).toISOString(),
    nextNewMoon: nextPhaseDate(0, date).toISOString(),
    dataSource: "astronomy-engine",
    referenceFrame: "geocentric-tropical",
  };
}