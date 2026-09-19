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