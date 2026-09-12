import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type SavedWritingPrompt, type WritingPrompt } from "@shared/schema";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, PenLine, Shuffle, Sparkles, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  const { data: prompts, isLoading, isError, refetch } = useQuery<WritingPrompt[]>({
    queryKey: ["/api/prompts"],
  });
  const { data: savedPrompts = [], isLoading: savedPromptsLoading } = useQuery<SavedWritingPrompt[]>({
    queryKey: ["/api/saved-prompts"],
  });
  const savePromptMutation = useMutation({
    mutationFn: (prompt: WritingPrompt) =>
      apiRequest("POST", "/api/saved-prompts", {
        promptId: prompt.id,
        prompt: prompt.prompt,
        category: prompt.category,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-prompts"] }),
  });
  const removePromptMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/saved-prompts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-prompts"] }),
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

  const saveCurrentPrompt = () => {
    if (!currentPrompt) return;
    savePromptMutation.mutate(currentPrompt);
  };
  const currentPromptIsSaved = savedPrompts.some((saved) => saved.prompt === currentPrompt?.prompt);

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
                    onClick={saveCurrentPrompt}
                    disabled={currentPromptIsSaved || savePromptMutation.isPending}
                    data-testid="button-save-writing-prompt"
                  >
                    {currentPromptIsSaved ? <BookmarkCheck className="h-4 w-4 mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
                    {currentPromptIsSaved ? "Saved" : savePromptMutation.isPending ? "Saving..." : "Save Prompt"}
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

      <section className="writing-prompts-saved" aria-labelledby="saved-prompts-title">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Your collection</p>
            <h2 id="saved-prompts-title" className="font-display text-xl font-semibold">Saved Prompts</h2>
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {savedPrompts.length} saved
          </p>
        </div>
        {savedPromptsLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : savedPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPrompts.map((saved) => (
              <Card key={saved.id} className="writing-prompts-saved-card">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <blockquote className="font-display text-lg leading-relaxed">“{saved.prompt}”</blockquote>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <Badge variant="outline">{formatCategory(saved.category)}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePromptMutation.mutate(saved.id)}
                      disabled={removePromptMutation.isPending}
                      aria-label={`Remove saved prompt: ${saved.prompt}`}
                      data-testid={`button-remove-saved-prompt-${saved.id}`}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="writing-prompts-saved-empty">
            <CardContent className="p-8 text-center">
              <Bookmark className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="font-display text-lg">Your saved prompts will appear here.</p>
              <p className="mt-1 text-sm text-muted-foreground">Choose a prompt above and save it for later.</p>
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
