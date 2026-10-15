import { useMemo } from "react";
import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import type { Dream } from "@shared/schema";
import { buildPsycheProfile } from "@shared/psyche-profile";
import { getArchetype } from "@shared/psyra";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PsyraArchetypeCard } from "@/components/psyra-archetype-card";

export function PsycheProfile() {
  const { user } = useUser();
  const { data: dreams = [], isLoading, isError } = useQuery<Dream[]>({
    queryKey: ["/api/dreams", user?.id, "psyche-profile"],
    queryFn: async () => (await apiRequest("GET", "/api/dreams")).json(),
    enabled: Boolean(user),
    staleTime: 0,
  });
  const profile = useMemo(() => buildPsycheProfile(dreams), [dreams]);
  const archetype = getArchetype(profile.dominantId);

  if (isLoading) {
    return <p className="mt-10" role="status">Opening your dream patterns…</p>;
  }
  if (isError) {
    return <p className="mt-10" role="alert">Your dream patterns could not be loaded. Please try again.</p>;
  }
  if (!archetype) {
    return <p className="mt-10" role="status">Your pattern will appear after you interpret a dream.</p>;
  }

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]" data-testid="psyche-profile">
      <Card className="overflow-hidden">
        <PsyraArchetypeCard archetypeId={archetype.id} compact />
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Dominant Archetype
          </p>
          <p className="mt-2 text-sm leading-relaxed">{archetype.shortDescription}</p>
          <p className="mt-3 text-xs text-muted-foreground" data-testid="archetype-frequency">
            Appeared in {profile.counts.get(archetype.id) ?? 0} of {profile.total} analyzed dreams.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Jungian Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(profile.dimensions).map(([name, value]) => (
            <div key={name} data-testid={`dimension-${name}`}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="capitalize">{name}</span>
                <span className="text-muted-foreground">{Math.round(value * 100)}%</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div className="h-full bg-foreground" style={{ width: `${value * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
            These are reflective signals, not diagnoses. They shift as your dream journal grows.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
