import moth from "@assets/dreamgate_collage_cutouts/moth.webp";
import portal from "@assets/dreamgate_collage_cutouts/portal.webp";
import study2 from "@assets/dreamgate_collage_cutouts/study-2.webp";
import study3 from "@assets/dreamgate_collage_cutouts/study-3.webp";
import study4 from "@assets/dreamgate_collage_cutouts/study-4.webp";
import study5 from "@assets/dreamgate_collage_cutouts/study-5.webp";
import study6 from "@assets/dreamgate_collage_cutouts/study-6.webp";
import study7 from "@assets/dreamgate_collage_cutouts/study-7.webp";
import study8 from "@assets/dreamgate_collage_cutouts/study-8.webp";
import study9 from "@assets/dreamgate_collage_cutouts/study-9.webp";
import study10 from "@assets/dreamgate_collage_cutouts/study-10.webp";
import study11 from "@assets/dreamgate_collage_cutouts/study-11.webp";

const pieces = [
  { src: portal, className: "home-collage-piece--portal" },
  { src: moth, className: "home-collage-piece--moth" },
  { src: study2, className: "home-collage-piece--study-2" },
  { src: study3, className: "home-collage-piece--study-3" },
  { src: study4, className: "home-collage-piece--study-4" },
  { src: study5, className: "home-collage-piece--study-5" },
  { src: study6, className: "home-collage-piece--study-6" },
  { src: study7, className: "home-collage-piece--study-7" },
  { src: study8, className: "home-collage-piece--study-8" },
  { src: study9, className: "home-collage-piece--study-9" },
  { src: study10, className: "home-collage-piece--study-10" },
  { src: study11, className: "home-collage-piece--study-11" },
];

export function HomeCollage() {
  return (
    <div className="home-collage" aria-hidden="true">
      {pieces.map((piece, index) => (
        <img
          key={piece.className}
          src={piece.src}
          alt=""
          className={`home-collage-piece ${piece.className}`}
          draggable={false}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "low"}
          decoding="async"
        />
      ))}
    </div>
  );
}