export const tarotJourneyStartedAtStorageKey = "tarot_journey_started_at";

export function getJournalMonthCount(
  dreams: Array<{ date: Date | string }>,
): number {
  const journalMonths = new Set<string>();

  for (const dream of dreams) {
    const date = dream.date instanceof Date ? dream.date : new Date(dream.date);
    if (Number.isNaN(date.getTime())) continue;

    journalMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
  }

  return journalMonths.size;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getTarotJourneyStartDate(): Date | null {
  if (typeof localStorage === "undefined") return null;

  const storedStart = parseDate(
    localStorage.getItem(tarotJourneyStartedAtStorageKey),
  );
  if (storedStart) return storedStart;

  try {
    const history = JSON.parse(localStorage.getItem("tarot_history") || "[]") as Array<{
      date?: unknown;
    }>;
    const earliestReading = history
      .map((reading) => parseDate(reading.date))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (!earliestReading) return null;

    localStorage.setItem(
      tarotJourneyStartedAtStorageKey,
      earliestReading.toISOString(),
    );
    return earliestReading;
  } catch {
    return null;
  }
}

export function recordTarotJourneyStart(date: Date | string): void {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(tarotJourneyStartedAtStorageKey)) return;

  const parsedDate = parseDate(date);
  if (parsedDate) {
    localStorage.setItem(
      tarotJourneyStartedAtStorageKey,
      parsedDate.toISOString(),
    );
  }
}

export function hasCompletedTarotYear(now = new Date()): boolean {
  const startDate = getTarotJourneyStartDate();
  if (!startDate) return false;

  const anniversary = new Date(startDate);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return now.getTime() >= anniversary.getTime();
}