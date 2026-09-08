import { cn } from "@/lib/utils";
import decodeSymbol from "@assets/dreamgate_symbols/quick-access/decode.webp";
import promptsSymbol from "@assets/dreamgate_symbols/quick-access/prompts.webp";
import archiveSymbol from "@assets/IMG_3500_1788589338921.png";
import calendarSymbol from "@assets/dreamgate_symbols/quick-access/calendar.webp";
import homeSymbol from "@assets/dreamgate_symbols/quick-access/home.webp";
import dictionarySymbol from "@assets/dreamgate_symbols/quick-access/dictionary.webp";
import newEntrySymbol from "@assets/dreamgate_symbols/quick-access/new-entry.webp";
import psyraSymbol from "@assets/dreamgate_symbols/quick-access/psyra.webp";
import soundHealingSymbol from "@assets/dreamgate_symbols/quick-access/sound-healing.webp";
import nightMapSymbol from "@assets/dreamgate_symbols/quick-access/night-map.webp";

export type DreamGateFunctionSymbolKind =
  | "decode"
  | "prompts"
  | "archive"
  | "calendar"
  | "home"
  | "dictionary"
  | "new-entry"
  | "psyra"
  | "sound-healing"
  | "night-map";

const symbolSources: Record<DreamGateFunctionSymbolKind, string> = {
  decode: decodeSymbol,
  prompts: promptsSymbol,
  archive: archiveSymbol,
  calendar: calendarSymbol,
  home: homeSymbol,
  dictionary: dictionarySymbol,
  "new-entry": newEntrySymbol,
  psyra: psyraSymbol,
  "sound-healing": soundHealingSymbol,
  "night-map": nightMapSymbol,
};

interface DreamGateFunctionSymbolProps {
  kind: DreamGateFunctionSymbolKind;
  className?: string;
}

export function DreamGateFunctionSymbol({
  kind,
  className,
}: DreamGateFunctionSymbolProps) {
  return (
    <img
      src={symbolSources[kind]}
      alt=""
      aria-hidden="true"
      className={cn("dreamgate-function-symbol object-contain", className)}
      draggable={false}
    />
  );
}