import { useState } from "react";
import { getArchetype } from "@shared/psyra";

const artworkModules = {
  ...import.meta.glob(
    [
      "../assets/IMG_3527_*.jpeg",
      "../assets/IMG_3528_*.jpeg",
      "../assets/IMG_3530_*.jpeg",
      "../assets/IMG_3534_*.jpeg",
      "../assets/IMG_3535_*.jpeg",
      "../assets/IMG_3536_*.jpeg",
      "../assets/IMG_3537_*.jpeg",
      "../assets/IMG_3539_*.jpeg",
      "../assets/IMG_3540_*.jpeg",
      "../assets/IMG_3541_*.jpeg",
      "../assets/IMG_3542_*.jpeg",
      "../assets/IMG_3543_*.jpeg",
      "../assets/IMG_3544_*.jpeg",
      "../assets/IMG_3545_*.jpeg",
      "../assets/IMG_3546_*.jpeg",
      "../assets/IMG_3547_*.jpeg",
    ],
    {
      eager: true,
      query: "?url",
      import: "default",
    },
  ),
  ...import.meta.glob("../assets/psyra_archetypes/*.{jpeg,jpg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
} as Record<string, string>;

export function getPsyraArtwork(expectedFileName: string | null) {
  if (!expectedFileName) return undefined;
  const stem = expectedFileName.replace(/\.[^.]+$/, "").toLowerCase();
  const match = Object.entries(artworkModules).find(([path]) =>
    path.toLowerCase().split("/").pop()?.startsWith(stem),
  );
  return match?.[1];
}

export function PsyraMappedArtwork({
  expectedFileName,
  alt,
  fallbackLabel,
  className = "",
}: {
  expectedFileName: string | null;
  alt: string;
  fallbackLabel: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = getPsyraArtwork(expectedFileName);

  if (artwork && !imageFailed) {
    return (
      <img
        src={artwork}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-foreground text-background ${className}`}>
      <div className="px-5 text-center">
        <p className="text-[0.6rem] uppercase tracking-[0.28em] opacity-60">Psyra artwork</p>
        <p className="mt-2 font-display text-xl">{fallbackLabel}</p>
      </div>
    </div>
  );
}

export function PsyraArchetypeCard({
  archetypeId,
  compact = false,
  revealed = true,
}: {
  archetypeId: string;
  compact?: boolean;
  revealed?: boolean;
}) {
  const archetype = getArchetype(archetypeId);
  if (!archetype) return null;

  if (!revealed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-current bg-foreground text-background ${
          compact ? "aspect-[4/5]" : "min-h-[22rem] md:min-h-[28rem]"
        }`}
        data-testid="archetype-card-hidden"
      >
        <div className="px-6 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] opacity-60">Psyra pattern</p>
          <p className="mt-4 font-display text-2xl">Hidden</p>
          <p className="mt-3 max-w-[13rem] text-xs leading-relaxed opacity-65">
            Decode a dream to reveal the archetype selected for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`psyra-artwork relative overflow-hidden border border-current ${
        compact ? "aspect-[4/5]" : "min-h-[22rem] md:min-h-[28rem]"
      }`}
      data-testid={`archetype-card-${archetype.id}`}
    >
      <PsyraMappedArtwork
        expectedFileName={archetype.expectedFileName}
        alt={`${archetype.displayName} archetype artwork`}
        fallbackLabel={archetype.displayName}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-5 pt-16 text-white">
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/65">
          {archetype.subtitle}
        </p>
        <h3 className="mt-1 font-display text-2xl">{archetype.displayName}</h3>
      </div>
    </div>
  );
}