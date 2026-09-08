import pageRing from "@assets/dreamgate_collage_cutouts/page-ring.webp";
import pagePortal from "@assets/dreamgate_collage_cutouts/page-portal.webp";
import pageCloud from "@assets/dreamgate_collage_cutouts/page-cloud.webp";
import pageFlower from "@assets/dreamgate_collage_cutouts/page-flower.webp";

const collagePieces = [
  { src: pageRing, className: "dreamgate-page-collage-piece--ring" },
  { src: pagePortal, className: "dreamgate-page-collage-piece--portal" },
  { src: pageCloud, className: "dreamgate-page-collage-piece--cloud" },
  { src: pageFlower, className: "dreamgate-page-collage-piece--flower" },
];

export function DreamgatePageCollage() {
  return (
    <div className="dreamgate-page-collage" aria-hidden="true">
      {collagePieces.map((piece) => (
        <img
          key={piece.className}
          src={piece.src}
          alt=""
          className={`dreamgate-page-collage-piece ${piece.className}`}
          draggable={false}
          loading="eager"
          decoding="async"
        />
      ))}
    </div>
  );
}