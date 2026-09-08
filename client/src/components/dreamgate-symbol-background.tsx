import symbol62 from "@assets/dreamgate_symbols/background/62.webp";
import symbol55 from "@assets/dreamgate_symbols/background/55.webp";
import symbol59 from "@assets/dreamgate_symbols/background/59.webp";
import symbol85 from "@assets/dreamgate_symbols/background/85.webp";
import symbol96 from "@assets/dreamgate_symbols/background/96.webp";
import symbol126 from "@assets/dreamgate_symbols/background/126.webp";
import symbol141 from "@assets/dreamgate_symbols/background/141.webp";
import symbol150 from "@assets/dreamgate_symbols/background/150.webp";

const symbols = [
  { src: symbol62, className: "dreamgate-symbol--62" },
  { src: symbol55, className: "dreamgate-symbol--55" },
  { src: symbol59, className: "dreamgate-symbol--59" },
  { src: symbol85, className: "dreamgate-symbol--85" },
  { src: symbol96, className: "dreamgate-symbol--96" },
  { src: symbol126, className: "dreamgate-symbol--126" },
  { src: symbol141, className: "dreamgate-symbol--141" },
  { src: symbol150, className: "dreamgate-symbol--150" },
];

export function DreamGateSymbolBackground() {
  return (
    <div className="dreamgate-symbol-field" aria-hidden="true">
      {symbols.map((symbol) => (
        <img
          key={symbol.className}
          src={symbol.src}
          alt=""
          className={`dreamgate-symbol ${symbol.className}`}
          draggable={false}
          decoding="async"
        />
      ))}
    </div>
  );
}