import { cn } from "@/lib/utils";

// These names match the physical-location families in Dream Atlas. Keeping the
// asset selection here makes a place's memory token identical in both views.
const sketches = import.meta.glob("../assets/atlas-sketches/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

type RecurringLocationSketchProps = {
  location: string;
  className?: string;
};

export function RecurringLocationSketch({
  location,
  className,
}: RecurringLocationSketchProps) {
  const slug = location
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const source =
    sketches[`../assets/atlas-sketches/${slug}.webp`] ??
    sketches["../assets/atlas-sketches/unknown.webp"];

  if (!source) {
    throw new Error("The Dream Atlas sketch assets are unavailable.");
  }

  return (
    <span className={cn("atlas-sketch", className)} aria-hidden="true">
      <img src={source} alt="" loading="lazy" decoding="async" />
    </span>
  );
}