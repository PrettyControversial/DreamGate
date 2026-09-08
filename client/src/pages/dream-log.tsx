import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Dream, type CelestialData } from "@shared/schema";
import { X, Plus, ArrowRight, Send, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  trackDiscoverToolCompleted,
  trackDreamSaved,
} from "@/lib/analytics";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function DreamLog() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!params.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [dreamContent, setDreamContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSavedDreamId, setLastSavedDreamId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: dreams } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  const { data: celestial } = useQuery<CelestialData>({
    queryKey: ["/api/celestial"],
  });

  const { data: existingDream, isLoading: dreamLoading } = useQuery<Dream>({
    queryKey: ["/api/dreams", params.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingDream) {
      setDreamContent(existingDream.content);
      setIsExpanded(true);
    }
  }, [existingDream]);

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const title = content.split(/[.!?\n]/)[0].slice(0, 50) || "Untitled Dream";
      const response = await apiRequest("POST", "/api/dreams", {
        title,
        content,
        moonPhase: celestial?.moonPhase,
        emotions: [],
        themes: [],
        symbols: [],
      });
      return response.json();
    },
    onSuccess: (data) => {
      trackDreamSaved("dream_log", data.isFirstDream);
      trackDiscoverToolCompleted(["prompts"], "dream_saved");
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams/stats"] });
      toast({
        title: "Dream logged!",
        description: "Your dream has been saved.",
      });
      setLastSavedDreamId(data.id);
      setDreamContent("");
      setIsExpanded(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      const title = content.split(/[.!?\n]/)[0].slice(0, 50) || "Untitled Dream";
      const response = await apiRequest("PATCH", `/api/dreams/${params.id}`, {
        title,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams", params.id] });
      toast({
        title: "Dream updated!",
        description: "Your changes have been saved.",
      });
      setLocation("/user-portal");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice recording is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      setIsExpanded(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDreamContent(prev => {
        const base = prev.endsWith(" ") || prev === "" ? prev : prev + " ";
        return base + transcript;
      });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice recording.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = () => {
    if (!dreamContent.trim()) {
      toast({
        title: "Empty dream",
        description: "Please write or record something about your dream.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      updateMutation.mutate(dreamContent);
    } else {
      createMutation.mutate(dreamContent);
    }
  };

  const filteredDreams = dreams?.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isEditing && dreamLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading dream...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 px-4 md:px-6 py-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-semibold text-foreground mb-2">Dream Log</h1>
          <p className="text-muted-foreground">Capture and track your dreams</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="relative mb-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2 px-4 py-3 rounded-full border border-border bg-card shadow-sm">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base bg-transparent placeholder:text-muted-foreground focus-visible:border-primary"
              data-testid="input-search-dreams"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                data-testid="button-clear-search"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {lastSavedDreamId && (
          <Card className="mb-4 border-border bg-card max-w-4xl mx-auto w-full">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Dream saved!</p>
                  <p className="text-sm text-muted-foreground">Ready to decode the meaning?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/decoder/${lastSavedDreamId}`}>
                  <Button 
                    size="sm"
                    className="gap-2"
                    data-testid="button-decode-saved-dream"
                  >
                    <Sparkles className="h-4 w-4" />
                    Decode This Dream
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastSavedDreamId(null)}
                  data-testid="button-dismiss-decode"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredDreams.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                No dreams found, pull down to refresh...
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto w-full">
              {filteredDreams.map((dream) => (
                <Link key={dream.id} href={`/log/${dream.id}`}>
                  <Card className="hover-elevate cursor-pointer overflow-visible border-border bg-card" data-testid={`card-dream-${dream.id}`}>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold truncate text-foreground" data-testid={`text-dream-title-${dream.id}`}>
                        {dream.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {dream.content}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {formatDate(dream.date)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 pb-6">
        <div className="max-w-4xl mx-auto w-full">
          {isExpanded && (
            <div className="mb-4 relative">
              <Textarea
                ref={textareaRef}
                value={dreamContent}
                onChange={(e) => setDreamContent(e.target.value)}
                placeholder="Describe your dream..."
                className="min-h-[120px] resize-none pr-12 text-base bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary"
                data-testid="textarea-dream-content"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => {
                  setIsExpanded(false);
                  setDreamContent("");
                }}
                data-testid="button-close-expand"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-type-dream"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Type dream</span>
            </button>

            <div className="flex-1 flex justify-center">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecording 
                    ? "bg-destructive hover:bg-destructive/90 animate-pulse scale-110" 
                    : "bg-destructive hover:bg-destructive/90"
                }`}
                data-testid="button-record-voice"
              >
                {isRecording ? (
                  <div className="w-6 h-6 rounded-sm bg-white" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-destructive/80 border-4 border-white" />
                )}
              </button>
            </div>

            {(isExpanded || dreamContent) && (
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !dreamContent.trim()}
                size="icon"
                className="rounded-full"
                data-testid="button-save-dream"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isRecording && (
            <p className="text-center text-sm text-muted-foreground mt-3 animate-pulse">
              Listening... Speak about your dream
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
