import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type WritingPrompt } from "@shared/schema";
import { ChevronLeft, ChevronRight, PenLine, Shuffle, Sparkles } from "lucide-react";

const WRITING_PROMPT_SESSION_KEY = "dreamgate:writing-prompt:pending";

const categories = [
  { id: "all", label: "All Prompts" },
  { id: "reflection", label: "Reflection" },
  { id: "exploration", label: "Exploration" },
  { id: "healing", label: "Healing" },
  { id: "creativity", label: "Creativity" },
  { id: "growth", label: "Growth" },
];

const normalizeCategory = (category: string) =>
  category.trim().toLowerCase().replace(/[\s_-]+/g, "-");

const formatCategory = (category: string) =>
  category
    .trim()
    .replace(/[\s_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function WritingPrompts() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  const { data: prompts, isLoading, isError, refetch } = useQuery<WritingPrompt[]>({
    queryKey: ["/api/prompts"],
  });

  const filteredPrompts = useMemo(
    () =>
      (prompts ?? []).filter(
        (prompt) =>
          selectedCategory === "all" ||
          normalizeCategory(prompt.category) === selectedCategory,
      ),
    [prompts, selectedCategory],
  );

  const currentPrompt =
    filteredPrompts.find((prompt) => prompt.id === selectedPromptId) ??
    filteredPrompts[0];

  useEffect(() => {
    if (
      filteredPrompts.length > 0 &&
      !filteredPrompts.some((prompt) => prompt.id === selectedPromptId)
    ) {
      setSelectedPromptId(filteredPrompts[0].id);
    }
  }, [filteredPrompts, selectedPromptId]);

  useEffect(() => {
    const selectedButton = categoryCarouselRef.current?.querySelector<HTMLElement>(
      `[data-category-id="${selectedCategory}"]`,
    );
    selectedButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedCategory]);

  const selectCategory = (categoryId: string) => {
    const firstPrompt = (prompts ?? []).find(
      (prompt) =>
        categoryId === "all" ||
        normalizeCategory(prompt.category) === categoryId,
    );
    setSelectedCategory(categoryId);
    setSelectedPromptId(firstPrompt?.id ?? null);
  };

  const shufflePrompt = () => {
    if (filteredPrompts.length > 1 && currentPrompt) {
      let nextPrompt: WritingPrompt;
      do {
        nextPrompt =
          filteredPrompts[Math.floor(Math.random() * filteredPrompts.length)];
      } while (nextPrompt.id === currentPrompt.id);
      setSelectedPromptId(nextPrompt.id);
    }
  };

  const moveCategoryCarousel = (direction: -1 | 1) => {
    categoryCarouselRef.current?.scrollBy({
      left: direction * 190,
      behavior: "smooth",
    });
  };

  const startWriting = () => {
    if (!currentPrompt) return;
    sessionStorage.setItem(WRITING_PROMPT_SESSION_KEY, currentPrompt.prompt);
    navigate("/decoder");
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="writing-prompts-page p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Writing Prompts
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore your dreamscape with guided prompts
        </p>
      </header>

      <div className="writing-prompts-category-shell" aria-label="Prompt categories">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="writing-prompts-category-arrow"
          onClick={() => moveCategoryCarousel(-1)}
          aria-label="Show previous prompt categories"
          data-testid="button-category-previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          ref={categoryCarouselRef}
          className="writing-prompts-category-carousel"
          role="group"
          aria-label="Swipe through prompt categories"
        >
          <div className="flex min-w-max gap-2 px-1">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`home-capsule-button writing-prompts-button writing-prompts-category-button ${
                    isSelected
                      ? "home-capsule-button--solid writing-prompts-category-button--selected"
                      : "home-capsule-button--outline"
                  }`}
                  onClick={() => selectCategory(category.id)}
                  aria-pressed={isSelected}
                  data-category-id={category.id}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="writing-prompts-category-arrow"
          onClick={() => moveCategoryCarousel(1)}
          aria-label="Show next prompt categories"
          data-testid="button-category-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Featured Prompt</h2>
            <Button
            variant="ghost"
            size="sm"
            className="home-capsule-button home-capsule-button--outline writing-prompts-button"
            onClick={shufflePrompt}
              disabled={filteredPrompts.length < 2}
            data-testid="button-shuffle"
          >
            <Shuffle className="h-4 w-4 mr-1.5" />
            Shuffle
          </Button>
        </div>

        {currentPrompt ? (
            <Card className="writing-prompts-featured border-border" data-testid="card-featured-prompt">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                
                <blockquote className="font-display text-xl md:text-2xl font-medium leading-relaxed max-w-2xl" data-testid="text-featured-prompt">
                  "{currentPrompt.prompt}"
                </blockquote>

                <Badge variant="outline" className="capitalize" data-testid="badge-prompt-category">
                  {formatCategory(currentPrompt.category)}
                </Badge>

                <div className="mt-2 flex w-full justify-center">
                  <Button
                    className="home-capsule-button home-capsule-button--solid writing-prompts-button w-full max-w-xs"
                    onClick={startWriting}
                    data-testid="button-start-writing-prompt"
                  >
                    <PenLine className="h-4 w-4 mr-1.5" />
                    Start Writing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">Prompts are unavailable right now.</p>
              <Button
                variant="outline"
                className="home-capsule-button home-capsule-button--outline writing-prompts-button"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No prompts available in this category</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold">More Prompts</h2>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {filteredPrompts.length} available
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Available writing prompts">
          {filteredPrompts.slice(0, 8).map((prompt) => (
            <Card 
              key={prompt.id} 
              className={`hover-elevate cursor-pointer overflow-visible transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${prompt.id === currentPrompt?.id ? 'ring-2 ring-primary' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={prompt.id === currentPrompt?.id}
              aria-label={`Feature prompt: ${prompt.prompt}`}
              onClick={() => setSelectedPromptId(prompt.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedPromptId(prompt.id);
                }
              }}
              data-testid={`card-prompt-${prompt.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PenLine className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed line-clamp-3" data-testid={`text-prompt-${prompt.id}`}>
                      {prompt.prompt}
                    </p>
                    <Badge variant="outline" className="mt-2 capitalize text-xs" data-testid={`badge-category-${prompt.id}`}>
                       {formatCategory(prompt.category)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
