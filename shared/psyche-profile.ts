import type { Dream, EnhancedDreamInterpretation } from "./schema";

export function readPsycheInterpretation(value?: string | null): EnhancedDreamInterpretation | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed.interpretation ?? (
      typeof parsed.dreamOverview === "string" ? parsed : undefined
    );
  } catch { return undefined; }
}

// Shared by the real Stats screen, the demo screen and the seed report.
export function buildPsycheProfile(dreams: Pick<Dream, "decodedInsights">[]) {
  const analyses = dreams.map(dream => readPsycheInterpretation(dream.decodedInsights)?.archetypeAnalysis)
    .filter((analysis): analysis is NonNullable<typeof analysis> => Boolean(analysis));
  const counts = new Map<string, number>();
  const dimensions = { shadow: 0, ego: 0, self: 0, persona: 0 };
  for (const analysis of analyses) {
    counts.set(analysis.primaryArchetype, (counts.get(analysis.primaryArchetype) ?? 0) + 1);
    for (const key of Object.keys(dimensions) as Array<keyof typeof dimensions>) {
      dimensions[key] += analysis.jungianDimensions[key];
    }
  }
  const dominantId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const divisor = analyses.length || 1;
  return {
    total: analyses.length, dominantId, counts,
    dimensions: Object.fromEntries(Object.entries(dimensions).map(([key, value]) =>
      [key, value / divisor],
    )) as typeof dimensions,
  };
}
