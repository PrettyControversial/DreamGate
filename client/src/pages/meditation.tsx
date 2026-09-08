import { useEffect, useRef, useState } from "react";
import { Heart, Moon, Pause, Play, Sparkles, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  trackDiscoverToolCompleted,
  trackEvent,
} from "@/lib/analytics";

import aMeditationAudio from "@assets/dreamgate_meditations/a-meditation.mp3";
import meditation432HzAudio from "@assets/dreamgate_meditations/432hz-meditation.mp3";
import yogaMeditationAudio from "@assets/dreamgate_meditations/yoga-meditation-nature.mp3";
import sleepMeditationAudio from "@assets/dreamgate_meditations/sleep-meditation.mp3";
import guidedVoiceAudio from "@assets/ES_Voice_Marie-2026-01-18T163001Z_1768755822792.mp3";
import soundBowlsAudio from "@assets/ES_Tibet_Meditation_-_Bjorn_Alva_1768633816883.mp3";
import meditationSymbolRelief from "@assets/meditation-symbol-relief.webp";

interface MeditationTrack {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioFile?: string;
  icon: typeof Moon;
}

const meditations: MeditationTrack[] = [
  {
    id: "a-meditation",
    title: "A Meditation",
    description: "A spacious practice for returning to your breath and inner stillness.",
    duration: "7:49",
    audioFile: aMeditationAudio,
    icon: Heart,
  },
  {
    id: "432hz-meditation",
    title: "432 Hz Meditation",
    description: "A resonant meditation designed to settle the body and quiet the mind.",
    duration: "5:09",
    audioFile: meditation432HzAudio,
    icon: Sparkles,
  },
  {
    id: "yoga-meditation",
    title: "Meditation 2",
    description: "Nature-led calm for mindful movement, restorative breath, and rest.",
    duration: "3:58",
    audioFile: yogaMeditationAudio,
    icon: Waves,
  },
  {
    id: "sleep-meditation",
    title: "Sleep Meditation",
    description: "A gentle descent into quiet, release, and restful sleep.",
    duration: "2:48",
    audioFile: sleepMeditationAudio,
    icon: Moon,
  },
  {
    id: "sound-bowls",
    title: "Sound Bowls",
    description: "Slow, resonant tones for grounding and settling into stillness.",
    duration: "1:12",
    audioFile: soundBowlsAudio,
    icon: Waves,
  },
  {
    id: "guided-voice",
    title: "Guided Voice",
    description: "A warm spoken meditation to help you soften into the present moment.",
    duration: "2:25",
    audioFile: guidedVoiceAudio,
    icon: Sparkles,
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

    if (!meditation.audioFile) return;

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