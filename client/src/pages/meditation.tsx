import { useEffect, useRef, useState } from "react";
import { Heart, Moon, Pause, Play, Sparkles, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  trackDiscoverToolCompleted,
  trackEvent,
} from "@/lib/analytics";

import dreamSymbolAudio from "@assets/dreamgate_meditations/meeting-the-dream-symbol.mp3";
import shadowSelfAudio from "@assets/dreamgate_meditations/meeting-the-shadow-self.mp3";
import guideAudio from "@assets/dreamgate_meditations/meeting-your-guide.mp3";
import meditationSymbolRelief from "@assets/meditation-symbol-relief.webp";

interface MeditationTrack {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioFile: string;
  icon: typeof Moon;
}

const meditations: MeditationTrack[] = [
  {
    id: "meeting-the-dream-symbol",
    title: "Meeting the Dream Symbol",
    description: "A guided journey for listening to the symbols that visit your dreams.",
    duration: "9:10",
    audioFile: dreamSymbolAudio,
    icon: Heart,
  },
  {
    id: "meeting-the-shadow-self",
    title: "Meeting the Shadow Self",
    description: "A gentle practice for meeting hidden feelings with curiosity and care.",
    duration: "5:00",
    audioFile: shadowSelfAudio,
    icon: Sparkles,
  },
  {
    id: "meeting-your-guide",
    title: "Meeting Your Guide",
    description: "A guided meditation for connecting with your inner wisdom and intuition.",
    duration: "10:00",
    audioFile: guideAudio,
    icon: Waves,
  },
];

export default function Meditation() {
  const [activeMeditationId, setActiveMeditationId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopMeditation();
    };
  }, []);

  const stopMeditation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setActiveMeditationId(null);
  };

  const toggleMeditation = (meditation: MeditationTrack) => {
    if (activeMeditationId === meditation.id) {
      stopMeditation();
      return;
    }

    stopMeditation();

    const audio = new Audio(meditation.audioFile);
    audio.preload = "metadata";
    audio.onended = () => {
      trackEvent("meditation_completed", {
        meditation_id: meditation.id,
        tool_id: "meditation",
      });
      trackDiscoverToolCompleted(
        ["meditation", "meditation-101"],
        "meditation_completed",
      );
      audioRef.current = null;
      setActiveMeditationId(null);
    };
    audio.onerror = () => {
      audioRef.current = null;
      setActiveMeditationId(null);
    };
    audioRef.current = audio;
    setActiveMeditationId(meditation.id);

    void audio
      .play()
      .then(() => {
        if (audioRef.current === audio) {
          trackEvent("meditation_started", {
            meditation_id: meditation.id,
            tool_id: "meditation",
          });
        }
      })
      .catch(() => {
        audioRef.current = null;
        setActiveMeditationId(null);
      });
  };

  return (
    <div className="meditation-page min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="meditation-header meditation-header--object space-y-2">
          <div className="meditation-header__copy">
            <p className="meditation-kicker text-xs uppercase tracking-[0.28em]">
              Rest & Restore
            </p>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">
              Daily Meditation
            </h1>
            <p className="meditation-muted text-sm">
              Choose a practice and make room for what is beneath the noise.
            </p>
          </div>
          <img
            className="meditation-header__object"
            src={meditationSymbolRelief}
            alt=""
            aria-hidden="true"
          />
        </header>

        <section className="space-y-5" aria-labelledby="meditation-library-title">
          <div className="meditation-section-heading flex items-center gap-3">
            <Moon className="h-4 w-4" />
            <h2
              id="meditation-library-title"
              className="font-display text-xl font-semibold"
            >
              Meditation Library
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {meditations.map((meditation) => {
              const Icon = meditation.icon;
              const isActive = activeMeditationId === meditation.id;

              return (
                <Card
                  key={meditation.id}
                  className="meditation-text-panel overflow-hidden"
                  data-testid={`card-meditation-${meditation.id}`}
                >
                  <CardContent className="flex h-full items-stretch p-0">
                    <div className="meditation-panel-icon flex w-16 shrink-0 items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-display text-lg font-semibold">
                            {meditation.title}
                          </h3>
                          <span className="meditation-duration shrink-0 text-xs">
                            {meditation.duration}
                          </span>
                        </div>
                        <p className="meditation-muted text-sm leading-relaxed">
                          {meditation.description}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`home-capsule-button meditation-bubble-button mt-auto ${
                          isActive
                            ? "home-capsule-button--solid"
                            : "home-capsule-button--outline"
                        }`}
                        aria-pressed={isActive}
                        onClick={() => toggleMeditation(meditation)}
                        data-testid={`button-meditation-${meditation.id}`}
                      >
                        {isActive ? (
                          <Pause className="mr-2 h-4 w-4" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {isActive ? "Pause Meditation" : "Begin Meditation"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}