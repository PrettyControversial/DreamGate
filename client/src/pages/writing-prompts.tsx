import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButton } from "@/components/voice-input-button";
import {
  type SavedWritingPrompt,
  type WritingPrompt,
  type WritingResponse,
} from "@shared/schema";
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

const formatResponseDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function WritingPrompts() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [writerPrompt, setWriterPrompt] = useState<WritingPrompt | null>(null);
  const [isWritingOpen, setIsWritingOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedDraft, setSavedDraft] = useState("");
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  const { data: prompts, isLoading, isError, refetch } = useQuery<WritingPrompt[]>({
    queryKey: ["/api/prompts"],
  });
  const { data: savedPrompts = [], isLoading: savedPromptsLoading } = useQuery<SavedWritingPrompt[]>({
    queryKey: ["/api/saved-prompts"],
  });
  const { data: writingResponses = [], isLoading: writingResponsesLoading } =
    useQuery<WritingResponse[]>({
      queryKey: ["/api/writing-responses"],
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

  const featuredPrompt =
    filteredPrompts.find((prompt) => prompt.id === selectedPromptId) ??
    filteredPrompts[0];
  const currentPrompt = isWritingOpen && writerPrompt ? writerPrompt : featuredPrompt;

  const saveResponseMutation = useMutation({
    mutationFn: async () => {
      if (!currentPrompt || !draft.trim()) {
        throw new Error("Write something before saving.");
      }
      if (activeResponseId) {
        const response = await apiRequest(
          "PATCH",
          `/api/writing-responses/${activeResponseId}`,
          { response: draft.trim() },
        );
        return response.json() as Promise<WritingResponse>;
      }
      const response = await apiRequest("POST", "/api/writing-responses", {
        promptId: currentPrompt.id,
        prompt: currentPrompt.prompt,
        response: draft.trim(),
      });
      return response.json() as Promise<WritingResponse>;
    },
    onSuccess: (response) => {
      setActiveResponseId(response.id);
      setDraft(response.response);
      setSavedDraft(response.response);
      setSaveMessage("Saved to your journal.");
      queryClient.invalidateQueries({ queryKey: ["/api/writing-responses"] });
    },
    onError: () => {
      setSaveMessage("Could not save this response. Please try again.");
    },
  });

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
    if (isWritingOpen) {
      if (hasUnsavedChanges && !window.confirm("You have an unsaved response. Leave this draft?")) {
        return;
      }
      setIsWritingOpen(false);
      setWriterPrompt(null);
    }
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
      if (isWritingOpen) {
        if (hasUnsavedChanges && !window.confirm("You have an unsaved response. Leave this draft?")) {
          return;
        }
        setIsWritingOpen(false);
        setWriterPrompt(null);
      }
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
  const hasUnsavedChanges = isWritingOpen && draft.trim() !== savedDraft.trim();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const openWriter = (prompt: WritingPrompt, response?: WritingResponse) => {
    if (hasUnsavedChanges && !window.confirm("You have an unsaved response. Leave this draft?")) {
      return;
    }
    if (
      selectedCategory !== "all" &&
      normalizeCategory(prompt.category) !== selectedCategory
    ) {
      setSelectedCategory("all");
    }
    setSelectedPromptId(prompt.id);
    setWriterPrompt(prompt);
    setActiveResponseId(response?.id ?? null);
    setDraft(response?.response ?? "");
    setSavedDraft(response?.response ?? "");
    setSaveMessage("");
    setIsWritingOpen(true);
  };

  const closeWriter = () => {
    if (hasUnsavedChanges && !window.confirm("Discard this unsaved response?")) {
      return;
    }
    setIsWritingOpen(false);
    setWriterPrompt(null);
    setSaveMessage("");
  };

  const latestResponseForPrompt = (promptId: string) =>
    writingResponses.find((response) => response.promptId === promptId);

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
          Explore your inner world with a prompt, then make the response yours.
        </p>
      </header>

      {isWritingOpen && currentPrompt && (
        <section
          className="writing-prompts-editor"
          aria-labelledby="writing-editor-title"
          data-testid="writing-prompt-editor"
        >
          <div className="writing-prompts-editor__topline">
            <p className="writing-prompts-editor__eyebrow">Your response</p>
            <button
              type="button"
              className="writing-prompts-editor__close"
              onClick={closeWriter}
              data-testid="button-close-writing-editor"
            >
              Back to prompts
            </button>
          </div>
          <h2 id="writing-editor-title" className="writing-prompts-editor__prompt">
            “{currentPrompt.prompt}”
          </h2>
          <p className="writing-prompts-editor__hint">
            Write freely. You can edit anything you dictate before saving.
          </p>
          <Textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.slice(0, 20000));
              setSaveMessage("");
            }}
            placeholder="Begin wherever the prompt takes you…"
            className="writing-prompts-editor__textarea"
            autoFocus
            data-testid="textarea-writing-response"
          />
          <div className="writing-prompts-editor__actions">
            <VoiceInputButton
              value={draft}
              onChange={(value) => {
                setDraft(value);
                setSaveMessage("");
              }}
              className="writing-prompts-editor__voice"
              data-testid="button-writing-response-voice"
            />
            <Button
              type="button"
              onClick={() => saveResponseMutation.mutate()}
              disabled={!draft.trim() || saveResponseMutation.isPending}
              className="home-capsule-button home-capsule-button--solid writing-prompts-button"
              data-testid="button-save-writing-response"
            >
              {saveResponseMutation.isPending ? "Saving…" : "Save response"}
            </Button>
          </div>
          <div className="writing-prompts-editor__status" aria-live="polite">
            {saveMessage || (hasUnsavedChanges ? "Unsaved changes" : "Your response is saved.")}
          </div>
        </section>
      )}

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

                 <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:flex-row">
                   <Button
                     className="home-capsule-button home-capsule-button--solid writing-prompts-button w-full max-w-xs"
                     onClick={() => openWriter(currentPrompt, latestResponseForPrompt(currentPrompt.id))}
                     data-testid="button-start-writing-response"
                   >
                     <PenLine className="h-4 w-4 mr-1.5" />
                     {latestResponseForPrompt(currentPrompt.id) ? "Continue writing" : "Start writing"}
                   </Button>
                  <Button
                     variant="outline"
                     className="home-capsule-button home-capsule-button--outline writing-prompts-button w-full max-w-xs"
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

      <section className="writing-prompts-responses" aria-labelledby="writing-responses-title">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Your journal</p>
            <h2 id="writing-responses-title" className="font-display text-xl font-semibold">Saved responses</h2>
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {writingResponses.length} saved
          </p>
        </div>
        {writingResponsesLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : writingResponses.length > 0 ? (
          <div className="writing-prompts-response-list">
            {writingResponses.map((response) => {
              const prompt = (prompts ?? []).find((item) => item.id === response.promptId) ?? {
                id: response.promptId,
                prompt: response.prompt,
                category: "general",
                isUsed: false,
              };
              return (
                <article key={response.id} className="writing-prompts-response-row">
                  <div className="min-w-0">
                    <p className="writing-prompts-response-row__prompt">“{response.prompt}”</p>
                    <p className="writing-prompts-response-row__excerpt">
                      {response.response.length > 150 ? `${response.response.slice(0, 147)}…` : response.response}
                    </p>
                    <p className="writing-prompts-response-row__date">
                      Updated {formatResponseDate(response.updatedAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="writing-prompts-button shrink-0"
                    onClick={() => openWriter(prompt, response)}
                    data-testid={`button-reopen-writing-response-${response.id}`}
                  >
                    Reopen
                  </Button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="writing-prompts-response-empty">
            <p className="font-display text-lg">Your saved responses will appear here.</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose any prompt to begin a private entry.</p>
          </div>
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
               aria-label={`Open prompt to write: ${prompt.prompt}`}
               onClick={() => openWriter(prompt, latestResponseForPrompt(prompt.id))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                   openWriter(prompt, latestResponseForPrompt(prompt.id));
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
