import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, LockKeyhole, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/subscription";
import type { Dream } from "@shared/schema";
import atlasBackground from "@assets/dream-atlas-background.webp";
import atlasPool from "@/assets/atlas-location-pool.svg";
import atlasFair from "@/assets/atlas-location-fair.svg";
import atlasMall from "@/assets/atlas-location-mall.svg";
import atlasPark from "@/assets/dream-atlas-park.webp";
import atlasWater from "@/assets/atlas-detail-water.webp";
import atlasForest from "@assets/stock_images/dark_misty_forest_ni_2b87884a.jpg";
import atlasDesert from "@assets/stock_images/desert_sand_dunes_go_b71b71c5.jpg";
import atlasLake from "@assets/stock_images/misty_mountain_lake__396c4e5f.jpg";

type AtlasRecord = {
  name: string;
  dreams: Dream[];
};

type LocationFamily = {
  name: string;
  terms: string[];
  exclude?: string[];
};

type LocationImage = {
  src: string;
  alt: string;
};

// These are physical places only. Do not add objects, characters, emotions,
// symbols, or activities here: a dream belongs to a location because the
// writing names the place where it happens, not because it contains an object
// associated with that place.
const locationFamilies = [
  { name: "The Pool", terms: ["pool", "swimming pool", "natatorium"] },
  { name: "The Fair", terms: ["fairground", "state fair", "county fair", "carnival", "amusement park"] },
  { name: "The Mall", terms: ["shopping mall", "mall", "food court"] },
  { name: "Childhood Home", terms: ["childhood home", "childhood house", "old house"] },
  { name: "Home", terms: ["my home", "my house", "at home", "apartment", "bedroom", "living room", "kitchen", "hallway"] },
  { name: "School", terms: ["school", "classroom", "college", "university", "campus"] },
  { name: "The Hospital", terms: ["hospital", "clinic", "doctor's office", "doctor’s office", "nurse's station", "nurse’s station"] },
  { name: "The Ocean", terms: ["ocean", "at sea", "beach", "shore", "seashore", "coast", "coastline"] },
  { name: "The Park", terms: ["park", "playground", "public garden", "city park", "garden"], exclude: ["amusement park"] },
  { name: "The Forest", terms: ["forest", "woods", "woodland"] },
  { name: "The City", terms: ["city", "downtown", "street", "sidewalk", "neighborhood", "town"] },
  { name: "The Hotel", terms: ["hotel", "motel", "resort"] },
  { name: "The Airport", terms: ["airport", "terminal", "arrivals hall", "departure lounge"] },
  { name: "The Store", terms: ["store", "walmart", "shop", "grocery store", "supermarket", "bookstore", "market"] },
  { name: "The Restaurant", terms: ["restaurant", "cafe", "café", "diner", "bar"] },
  { name: "The Road", terms: ["road", "highway", "motorway", "parking lot", "parking garage", "driveway"] },
  { name: "The Train Station", terms: ["train station", "railway station", "subway station", "platform"] },
  { name: "The Library", terms: ["library"] },
  { name: "The Church", terms: ["church", "chapel", "cathedral", "mosque", "temple"] },
  { name: "The Theater", terms: ["theater", "theatre", "cinema", "movie theater"] },
  { name: "The Office", terms: ["office", "workplace"] },
  { name: "The Rooftop", terms: ["rooftop", "roof terrace"] },
  { name: "The Bridge", terms: ["bridge", "overpass"] },
  { name: "The Lake", terms: ["lake", "pond", "reservoir"] },
  { name: "The Cave", terms: ["cave", "cavern"] },
  { name: "The Desert", terms: ["desert", "dunes"] },
  { name: "The Mountain", terms: ["mountain", "mountainside", "summit"] },
  { name: "The Threshold", terms: ["doorway", "threshold", "entrance", "stairwell", "elevator"] },
] satisfies LocationFamily[];

const locationImages: Record<string, LocationImage> = {
  "The Pool": { src: atlasPool, alt: "An indoor swimming pool beneath tall windows" },
  "The Fair": { src: atlasFair, alt: "A fairground with a ferris wheel and illuminated stalls at dusk" },
  "The Mall": { src: atlasMall, alt: "A glass-roofed shopping mall interior" },
  "Childhood Home": { src: atlasMall, alt: "A warmly lit interior passage" },
  Home: { src: atlasMall, alt: "A warmly lit interior passage" },
  School: { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Hospital": { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Ocean": { src: atlasWater, alt: "A quiet waterside landscape" },
  "The Park": { src: atlasPark, alt: "A stone path through a leafy hillside park" },
  "The Forest": { src: atlasForest, alt: "A dark, misty forest" },
  "The City": { src: atlasMall, alt: "A glass-roofed urban interior" },
  "The Hotel": { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Airport": { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Store": { src: atlasMall, alt: "A glass-roofed shopping mall interior" },
  "The Restaurant": { src: atlasMall, alt: "A warmly lit public interior" },
  "The Road": { src: atlasPark, alt: "A stone path leading through a broad landscape" },
  "The Train Station": { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Library": { src: atlasMall, alt: "A quiet public interior with tall architectural lines" },
  "The Church": { src: atlasMall, alt: "A tall, quiet public interior" },
  "The Theater": { src: atlasFair, alt: "A warmly lit public venue at dusk" },
  "The Office": { src: atlasMall, alt: "A bright public interior with long architectural lines" },
  "The Rooftop": { src: atlasMall, alt: "A broad view across an urban interior" },
  "The Bridge": { src: atlasLake, alt: "A mountain landscape beside still water" },
  "The Lake": { src: atlasLake, alt: "A still mountain lake" },
  "The Cave": { src: atlasForest, alt: "A dark, textured natural landscape" },
  "The Desert": { src: atlasDesert, alt: "Dunes stretching across a desert" },
  "The Mountain": { src: atlasLake, alt: "A mountain landscape beside still water" },
  "The Threshold": { src: atlasMall, alt: "A bright architectural passage" },
};

const locationImageFor = (name: string): LocationImage =>
  locationImages[name] ?? { src: atlasMall, alt: `${name} recurring location` };

const locationId = (name: string) =>
  `atlas-record-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

const containsPhrase = (text: string, phrase: string) => {
  const escaped = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
};

const locationScenePrepositions =
  "in|at|on|near|by|inside|within|through|across|along|around|toward|towards|from|to|into|outside|beside|under|over|behind|between";
const locationSceneVerbs =
  "was|were|is|are|felt|looked|seemed|stood|lay|stretched|surrounded|appeared|opened|led|continued|ended|began";
const nonLocationReferenceWords =
  "picture|photo|photograph|painting|drawing|image|map|symbol|metaphor|memory|story|video|movie|book|article";

const isExplicitLocationMention = (text: string, term: string) => {
  const escaped = term
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const location = `(?:the|a|an|my|our)?\\s*${escaped}`;
  const sentences = text.split(/[.!?;\n]+/);

  return sentences.some((sentence) => {
    const normalized = sentence.trim();
    if (!normalized || !containsPhrase(normalized, term)) return false;

    const referencedAsNonLocation = new RegExp(
      `\\b(?:${nonLocationReferenceWords})\\b[^,;]{0,60}\\b${escaped}\\b|\\b${escaped}\\b[^,;]{0,60}\\b(?:${nonLocationReferenceWords})\\b`,
      "i",
    ).test(normalized);
    if (referencedAsNonLocation) return false;

    const enteredAsPlace = new RegExp(
      `\\b(?:${locationScenePrepositions})\\s+${location}(?=$|[^a-z0-9])`,
      "i",
    ).test(normalized);
    const placeAsScene = new RegExp(
      `\\b${location}\\s+(?:${locationSceneVerbs})\\b`,
      "i",
    ).test(normalized);
    const dreamPlace = new RegExp(
      `\\b(?:dreamed|dreamt|dreaming|dream)\\s+(?:about|of|in|at|on)\\s+${location}(?=$|[^a-z0-9])`,
      "i",
    ).test(normalized);

    return enteredAsPlace || placeAsScene || dreamPlace;
  });
};

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const excerpt = (content: string) => {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 105 ? `${clean.slice(0, 102).trim()}…` : clean;
};

export default function DreamAtlas() {
  const { data: dreams = [], isLoading } = useQuery<Dream[]>({ queryKey: ["/api/dreams"] });
  const {
    canAccessAtlasLocation,
    freeAtlasLocationsRemaining,
    isPremium,
    openPaywall,
    recordAtlasLocation,
  } = useSubscription();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"visited" | "recent">("visited");
  const [openLocation, setOpenLocation] = useState<string | null>(null);

  const records = useMemo<AtlasRecord[]>(() => {
    const activeDreams = dreams.filter((dream) => !dream.isArchived);
    const grouped = locationFamilies.map((family) => {
      const matches = activeDreams.filter((dream) => {
        const text = `${dream.title}. ${dream.content}`.toLocaleLowerCase();
        const isExcluded = family.exclude?.some((term) => containsPhrase(text, term)) ?? false;
        return !isExcluded && family.terms.some((term) => isExplicitLocationMention(text, term));
      });
      return { name: family.name, dreams: matches.sort((a, b) => +new Date(a.date) - +new Date(b.date)) };
    }).filter((record) => record.dreams.length > 0);

    return grouped.sort((a, b) => sort === "visited"
      ? b.dreams.length - a.dreams.length
      : +new Date(b.dreams.at(-1)!.date) - +new Date(a.dreams.at(-1)!.date));
  }, [dreams, sort]);

  const filtered = records.filter((record) => record.name.toLowerCase().includes(query.toLowerCase()));
  const recurringCount = records.filter((record) => record.dreams.length > 1).length;
  const openLocationRecord = (locationName: string) => {
    if (openLocation === locationName) {
      setOpenLocation(null);
      return;
    }
    if (!canAccessAtlasLocation(locationName)) {
      openPaywall({
        feature: "dreamAtlasLocations",
        eyebrow: "Dream Atlas",
        title: "Unlock Your Full Dreamworld",
        description:
          "Follow every recurring place across your dream journal and watch your inner geography take shape with Psyra+.",
      });
      return;
    }
    recordAtlasLocation(locationName);
    setOpenLocation(locationName);
  };

  return (
    <main className="atlas-page" data-testid="dream-atlas-page">
      <img className="atlas-background" src={atlasBackground} alt="" aria-hidden="true" />
      <header className="atlas-header">
        <div>
          <p className="atlas-kicker">Your dreamworld</p>
          <h1>Dream Atlas</h1>
          <p className="atlas-deck">The places you return to are becoming a world of their own.</p>
          <p className="atlas-count">{dreams.filter((dream) => !dream.isArchived).length} dreams <span>·</span> {recurringCount} recurring locations</p>
        </div>
      </header>

      {!isPremium && (
        <section className="mx-auto mb-7 flex max-w-4xl flex-col gap-4 rounded-2xl border border-[#85765f]/35 bg-[#f6f3ec]/75 p-5 text-[#2d2924] shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">One dream location is yours to explore free.</p>
              <p className="mt-1 text-sm text-[#625d56]">
                {freeAtlasLocationsRemaining > 0
                  ? "Open the place that feels most familiar. Psyra+ reveals the full map."
                  : "Your free location is open. Unlock the rest of your dreamworld."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 border-[#2d2924] bg-transparent text-[#2d2924] hover:bg-[#2d2924] hover:text-[#f6f3ec]"
            onClick={() =>
              openPaywall({
                feature: "dreamAtlasLocations",
                eyebrow: "Dream Atlas",
                title: "Unlock Your Full Dreamworld",
                description:
                  "Follow every recurring place across your dream journal and watch your inner geography take shape with Psyra+.",
              })
            }
            data-testid="button-unlock-atlas"
          >
            Unlock Full Atlas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      )}

      {records.length > 0 && (
        <section className="atlas-world-path" aria-label="Recurring locations">
          <div className="atlas-world-path__line" aria-hidden="true" />
          <div className="atlas-world-path__locations">
            {records.map((record) => {
              const image = locationImageFor(record.name);
              return (
                <button
                  className="atlas-world-path__location"
                  key={record.name}
                  type="button"
                  onClick={() => document.getElementById(locationId(record.name))?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <img src={image.src} alt="" aria-hidden="true" />
                  <span>{record.name.replace(/^The /, "")}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="atlas-tools" aria-label="Atlas controls">
        <label><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your dreamworld" /></label>
        <div>
          <button className={sort === "visited" ? "is-active" : ""} onClick={() => setSort("visited")}>Most visited</button>
          <button className={sort === "recent" ? "is-active" : ""} onClick={() => setSort("recent")}>Recently visited</button>
        </div>
      </section>

      {isLoading ? <p className="atlas-empty">Opening your dreamworld…</p> : filtered.length === 0 ? (
        <section className="atlas-empty"><MapPin /><h2>Your atlas is ready to grow.</h2><p>As you record dreams, recurring places will gather here automatically.</p><Link href="/dream">Record a dream →</Link></section>
      ) : (
        <section className="atlas-records" aria-label="Dream locations">
          {filtered.map((record) => {
            const isOpen = openLocation === record.name;
            const isLocked = !canAccessAtlasLocation(record.name);
            const dates = record.dreams.slice(-3).map((dream) => formatDate(dream.date));
            const image = locationImageFor(record.name);
            return (
              <article className={`atlas-record${isOpen ? " is-open" : ""}`} id={locationId(record.name)} key={record.name}>
                <button
                  className="atlas-record__summary"
                  onClick={() => openLocationRecord(record.name)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Close" : "Open"} ${record.name}${isLocked ? " (Psyra+)" : ""}`}
                >
                  <img className="atlas-record__image" src={image.src} alt={image.alt} />
                  <span className="atlas-record__summary-copy"><strong>{record.name} {isLocked && <LockKeyhole aria-hidden="true" className="inline-block h-3.5 w-3.5 align-[-0.1em]" />}</strong><b>{record.dreams.length} {record.dreams.length === 1 ? "dream" : "dreams"}</b><small>{dates.join(" · ")}</small></span>
                  <ChevronDown aria-hidden="true" />
                </button>
                <p className="atlas-record__story">An evolving storyline from the dreams that took place here, in the order they were remembered.</p>
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

    </main>
  );
}
