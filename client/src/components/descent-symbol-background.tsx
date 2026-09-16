import symbol75 from "@assets/descent-symbols/75.webp";
import symbol149 from "@assets/descent-symbols/149.webp";
import symbol166 from "@assets/descent-symbols/166.webp";
import symbol167 from "@assets/descent-symbols/167.webp";
import symbol48 from "@assets/descent-symbols/48.webp";
import symbol73 from "@assets/descent-symbols/73.webp";

const symbols = [
  { src: symbol75, className: "descent-symbol--75" },
  { src: symbol149, className: "descent-symbol--149" },
  { src: symbol166, className: "descent-symbol--166" },
  { src: symbol167, className: "descent-symbol--167" },
  { src: symbol48, className: "descent-symbol--48" },
  { src: symbol73, className: "descent-symbol--73" },
];

export function DescentSymbolBackground() {
  return (
    <div className="descent-symbol-field" aria-hidden="true">
      {symbols.map((symbol) => (
        <img
          key={symbol.className}
          src={symbol.src}
          alt=""
          className={`descent-symbol ${symbol.className}`}
          draggable={false}
          decoding="async"
        />
      ))}
    </div>
  );
}