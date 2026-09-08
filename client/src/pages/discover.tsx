import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  BookOpen, 
  Moon, 
  Wind, 
  ChevronRight,
  Heart,
  Star,
} from "lucide-react";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import tarotSymbol from "@assets/dreamgate_symbols/footer/54.webp";
import psycheSymbol from "@assets/85_1788623536944.png";
import {
  markDiscoverToolSelected,
  markTarotEntrySource,
  trackEvent,
} from "@/lib/analytics";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
  featured?: boolean;
}

const allContent: ContentCard[] = [
  {
    id: "psyche",
    title: "Your Psyche",
    description: "Discover patterns emerging across your dreams",
    icon: (
      <img
        src={psycheSymbol}
        alt=""
        aria-hidden="true"
        className="h-10 w-8 object-contain brightness-0 invert"
      />
    ),
    href: "/psyche",
    category: "Dreams",
    featured: true,
  },
  {
    id: "decoder",
    title: "Ask Psyra",
    description: "Jungian dream interpretation and archetype discovery",
    icon: <DreamGateFunctionSymbol kind="psyra" className="h-7 w-7 brightness-0 invert" />,
    href: "/dream",
    category: "Dreams",
    featured: true,
  },
  {
    id: "dictionary",
    title: "Dream Dictionary",
    description: "Explore symbol meanings",
    icon: <DreamGateFunctionSymbol kind="dictionary" className="h-6 w-6" />,
    href: "/dictionary",
    category: "Dreams",
  },
  {
    id: "prompts",
    title: "Writing Prompts",
    description: "Guided dream journaling",
    icon: <DreamGateFunctionSymbol kind="prompts" className="h-6 w-6" />,
    href: "/prompts",
    category: "Dreams",
  },
  {
    id: "tarot",
    title: "Tarot Readings",
    description: "Daily card insights",
    icon: (
      <img
        src={tarotSymbol}
        alt=""
        aria-hidden="true"
        className="h-7 w-7 object-contain brightness-0 invert"
      />
    ),
    href: "/tarot",
    category: "Divination",
    featured: true,
  },
  {
    id: "meditation",
    title: "Sound Healing",
    description: "Binaural beats & frequencies",
    icon: <DreamGateFunctionSymbol kind="sound-healing" className="h-7 w-7 brightness-0 invert" />,
    href: "/meditation",
    category: "Wellness",
  },
  {
    id: "calendar",
    title: "Moon Calendar",
    description: "Lunar phase tracking",
    icon: <DreamGateFunctionSymbol kind="calendar" className="h-6 w-6" />,
      href: "/lunar-calendar",
    category: "Cosmos",
  },
  {
    id: "archive",
    title: "Dream Archive",
    description: "Browse your dream journal",
    icon: <DreamGateFunctionSymbol kind="archive" className="h-6 w-6" />,
    href: "/archive",
    category: "Dreams",
  },
  {
    id: "night-map",
    title: "Night Map",
    description: "Track sleep patterns",
    icon: <DreamGateFunctionSymbol kind="night-map" className="h-8 w-8 brightness-0 invert" />,
    href: "/night-map",
    category: "Wellness",
  },
];

const learnContent = [
  {
    id: "dreams-101",
    title: "How to Interpret Dreams",
    description: "Learn the basics of dream analysis and common symbols",
    icon: <Moon className="h-5 w-5" />,
    href: "/dictionary",
  },
  {
    id: "tarot-101",
    title: "Understanding Tarot",
    description: "Guide to the Major Arcana and card meanings",
    icon: (
      <img
        src={tarotSymbol}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 object-contain brightness-0 invert"
      />
    ),
    href: "/tarot",
  },
  {
    id: "meditation-101",
    title: "Meditation Techniques",
    description: "Breathing exercises and mindfulness practices",
    icon: <Wind className="h-5 w-5" />,
    href: "/meditation",
  },
];

const categories = ["All", "Dreams", "Divination", "Wellness", "Cosmos"];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredContent = allContent.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredContent = allContent.filter((item) => item.featured);

  const trackToolSelection = (
    item: { id: string; href: string; category?: string },
    placement: "featured" | "catalog" | "learn",
  ) => {
    markDiscoverToolSelected(item.id);
    if (item.href === "/tarot") {
      markTarotEntrySource("discover", placement);
    }
    trackEvent("discover_tool_selected", {
      tool_id: item.id,
      destination: item.href,
      category: item.category ?? "education",
      placement,
    });
  };

  return (
    <div className="discover-page px-4 py-8 md:px-8 md:py-10" data-testid="discover-page">
      <div className="mx-auto max-w-6xl space-y-10">
      <header className="discover-header space-y-5">
        <div className="space-y-2">
          <p className="discover-kicker text-xs uppercase tracking-[0.28em]">Explore</p>
          <h1 className="discover-title text-4xl md:text-5xl font-display">Discover</h1>
          <p className="discover-muted text-sm">
            Tools for your dream journey
          </p>
        </div>
        <div className="discover-search relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-none border px-11 shadow-none placeholder:opacity-60 focus-visible:ring-1"
            data-testid="input-search"
          />
        </div>
      </header>

      {!searchQuery && (
        <>
          <section className="space-y-5">
            <div className="discover-section-heading flex items-center gap-3">
              <Star className="h-4 w-4" />
              <h2 className="text-xl font-display font-semibold">Featured</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featuredContent.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => trackToolSelection(item, "featured")}
                >
                  <Card 
                    className="discover-panel h-full cursor-pointer overflow-hidden"
                    data-testid={`featured-${item.id}`}
                  >
                    <CardContent className="discover-panel-content flex items-stretch p-0">
                      <div className="discover-panel-icon flex w-20 shrink-0 items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-5 md:p-6">
                        <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                        <p className="discover-muted text-sm">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <div className="discover-filters flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap rounded-none px-4 py-2 text-xs uppercase tracking-[0.12em] ${
                  selectedCategory === category ? "discover-filter-active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </>
      )}

      <section className="space-y-5">
        {(searchQuery || selectedCategory !== "All") && (
          <h2 className="text-xl font-display font-semibold">
            {searchQuery ? "Search Results" : selectedCategory}
          </h2>
        )}
        <div className="space-y-3">
          {filteredContent.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => trackToolSelection(item, "catalog")}
            >
              <Card 
                className="discover-panel cursor-pointer"
                data-testid={`content-${item.id}`}
              >
                <CardContent className="discover-panel-content flex items-stretch p-0">
                  <div className="discover-panel-icon flex w-16 shrink-0 items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 md:p-5">
                    <h3 className="font-display font-semibold truncate">{item.title}</h3>
                    <p className="discover-muted text-sm truncate">
                      {item.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="discover-category my-auto mr-3 hidden rounded-none text-xs uppercase tracking-[0.1em] sm:flex">
                    {item.category}
                  </Badge>
                  <ChevronRight className="my-auto mr-4 h-4 w-4 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {!searchQuery && (
        <section className="space-y-5">
          <div className="discover-section-heading flex items-center gap-3">
            <Heart className="h-4 w-4" />
            <h2 className="text-xl font-display font-semibold">Learn More</h2>
          </div>
          <div className="space-y-3">
            {learnContent.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => trackToolSelection(item, "learn")}
              >
                <Card 
                  className="discover-panel cursor-pointer"
                  data-testid={`learn-${item.id}`}
                >
                  <CardContent className="discover-panel-content flex items-stretch p-0">
                    <div className="discover-panel-icon flex w-16 shrink-0 items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 md:p-5">
                      <h3 className="font-display text-sm font-semibold">{item.title}</h3>
                      <p className="discover-muted text-xs line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="my-auto mr-4 h-4 w-4 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
