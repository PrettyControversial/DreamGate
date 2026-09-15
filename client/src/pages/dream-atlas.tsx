import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronDown, Compass, KeyRound, MapPin, Search } from "lucide-react";
import type { Dream } from "@shared/schema";
import poolImage from "@assets/stock_images/ocean_waves_texture__8ce19598.jpg";
import natureImage from "@assets/stock_images/dark_misty_forest_ni_2b87884a.jpg";
import portalImage from "@assets/night-map-portal.webp";
import parkImage from "@assets/dream-atlas-park.webp";
import mallDetail from "@assets/atlas-detail-mall.webp";
import waterDetail from "@assets/atlas-detail-water.webp";
import keyDetail from "@assets/atlas-detail-key.webp";
import villageDetail from "@assets/atlas-detail-village.webp";
import atlasBackground from "@assets/dream-atlas-background.jpg";

type AtlasRecord = {
  name: string;
  dreams: Dream[];
  image: string;
};

const locationFamilies = [
  { name: "The Pool", terms: ["pool", "swimming pool"] },
  { name: "The Fair", terms: ["fairground", "state fair", "county fair", "carnival", "amusement park"] },
  { name: "The Mall", terms: ["shopping mall", "mall"] },
  { name: "Childhood Home", terms: ["childhood home", "childhood house", "old house"] },
  { name: "Home", terms: ["my home", "my house", "at home", "house", "apartment"] },
  { name: "School", terms: ["school", "classroom", "college", "university", "campus"] },
  { name: "The Hospital", terms: ["hospital", "clinic", "doctor's office", "nurse's station"] },
  { name: "The Ocean", terms: ["ocean", "sea", "beach", "shore"] },
  { name: "The Park", terms: ["park", "playground", "public garden", "city park"], exclude: ["amusement park"] },
  { name: "The Forest", terms: ["forest", "woods", "woodland"] },
  { name: "The City", terms: ["city", "downtown", "street", "sidewalk"] },
  { name: "The Hotel", terms: ["hotel", "motel", "resort"] },
  { name: "The Airport", terms: ["airport", "airplane", "terminal"] },
  { name: "The Store", terms: ["store", "walmart", "shop", "grocery"] },
  { name: "The Restaurant", terms: ["restaurant", "cafe", "diner"] },
  { name: "The Road", terms: ["road", "highway", "driving", "parking lot"] },
];

const containsPhrase = (text: string, phrase: string) => {
  const escaped = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
};

const locationImage = (name: string) => {
  if (/pool|ocean/i.test(name)) return poolImage;
  if (/park/i.test(name)) return parkImage;
  if (/forest|home/i.test(name)) return natureImage;
  return portalImage;
};

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const excerpt = (content: string) => {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 105 ? `${clean.slice(0, 102).trim()}…` : clean;
};

export default function DreamAtlas() {
  const { data: dreams = [], isLoading } = useQuery<Dream[]>({ queryKey: ["/api/dreams"] });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"visited" | "recent">("visited");
  const [openLocation, setOpenLocation] = useState<string | null>(null);

  const records = useMemo<AtlasRecord[]>(() => {
    const activeDreams = dreams.filter((dream) => !dream.isArchived);
    const grouped = locationFamilies.map((family) => {
      const matches = activeDreams.filter((dream) => {
        const text = `${dream.title} ${dream.content}`.toLocaleLowerCase();
        const isExcluded = family.exclude?.some((term) => containsPhrase(text, term)) ?? false;
        return !isExcluded && family.terms.some((term) => containsPhrase(text, term));
      });
      return { name: family.name, dreams: matches.sort((a, b) => +new Date(a.date) - +new Date(b.date)), image: locationImage(family.name) };
    }).filter((record) => record.dreams.length > 0);

    return grouped.sort((a, b) => sort === "visited"
      ? b.dreams.length - a.dreams.length
      : +new Date(b.dreams.at(-1)!.date) - +new Date(a.dreams.at(-1)!.date));
  }, [dreams, sort]);

  const filtered = records.filter((record) => record.name.toLowerCase().includes(query.toLowerCase()));
  const recurringCount = records.filter((record) => record.dreams.length > 1).length;

  return (
    <main className="atlas-page" data-testid="dream-atlas-page">
      <img className="atlas-background" src={atlasBackground} alt="" aria-hidden="true" />
      <img className="atlas-detail atlas-detail--key" src={keyDetail} alt="" aria-hidden="true" />
      <img className="atlas-detail atlas-detail--village" src={villageDetail} alt="" aria-hidden="true" />
      <header className="atlas-header">
        <div>
          <p className="atlas-kicker">Your dreamworld</p>
          <h1>Dream Atlas</h1>
          <p className="atlas-deck">The places you return to are becoming a world of their own.</p>
          <p className="atlas-count">{dreams.filter((dream) => !dream.isArchived).length} dreams <span>·</span> {recurringCount} recurring locations</p>
        </div>
        <div className="atlas-sketch" aria-hidden="true"><Compass /><span>Same places.<br />Deeper meanings.</span></div>
      </header>

      <section className="atlas-tools" aria-label="Atlas controls">
        <label><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your dreamworld" /></label>
        <div><button className={sort === "visited" ? "is-active" : ""} onClick={() => setSort("visited")}>Most visited</button><button className={sort === "recent" ? "is-active" : ""} onClick={() => setSort("recent")}>Recently visited</button></div>
        <img className="atlas-detail atlas-detail--mall" src={mallDetail} alt="" aria-hidden="true" />
      </section>

      {isLoading ? <p className="atlas-empty">Opening your dreamworld…</p> : filtered.length === 0 ? (
        <section className="atlas-empty"><MapPin /><h2>Your atlas is ready to grow.</h2><p>As you record dreams, recurring places will gather here automatically.</p><Link href="/dream">Record a dream →</Link></section>
      ) : (
        <section className="atlas-records" aria-label="Dream locations">
          {filtered.map((record) => {
            const isOpen = openLocation === record.name;
            const dates = record.dreams.slice(-3).map((dream) => formatDate(dream.date));
            return (
              <article className={`atlas-record${isOpen ? " is-open" : ""}`} key={record.name}>
                <button className="atlas-record__summary" onClick={() => setOpenLocation(isOpen ? null : record.name)} aria-expanded={isOpen}>
                  <img className={record.name === "The Park" ? "atlas-record__park-image" : ""} src={record.image} alt="" />
                  <span><strong>{record.name}</strong><b>{record.dreams.length} {record.dreams.length === 1 ? "dream" : "dreams"}</b><small>{dates.join(" · ")}</small></span>
                  <ChevronDown aria-hidden="true" />
                </button>
                <p className="atlas-record__story">Across {record.dreams.length} {record.dreams.length === 1 ? "visit" : "visits"}, this place has gathered a story of return, change, and unfinished moments.</p>
                {record.name === "The Pool" && isOpen && <img className="atlas-detail atlas-detail--water" src={waterDetail} alt="" aria-hidden="true" />}
                {isOpen && (
                  <div className="atlas-timeline">
                    {record.dreams.map((dream) => (
                      <Link href={`/dream/${dream.id}`} key={dream.id} className="atlas-event">
                        <i aria-hidden="true" />
                        <span><b>{formatDate(dream.date)}</b><strong>{dream.title}</strong><small>{excerpt(dream.content)}</small></span>
                      </Link>
                    ))}
                    <Link href="/archive" className="atlas-full-record">Open the full archive →</Link>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      <div className="atlas-footer-mark" aria-hidden="true"><KeyRound /><span>Certain places<br />always find you.</span></div>
    </main>
  );
}
