import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Check, Headphones, Pause, Play, RotateCcw, Sparkles, Wind } from "lucide-react";
import { trackDiscoverToolCompleted, trackEvent } from "@/lib/analytics";

import dreamSymbolAudio from "@assets/dreamgate_meditations/meeting-the-dream-symbol.mp3";
import shadowSelfAudio from "@assets/dreamgate_meditations/meeting-the-shadow-self.mp3";
import deepReturnAudio from "@assets/dreamgate_meditations/the-deep-return.mp3";

type JourneyStepId = "guide" | "shadow" | "symbol" | "breath";

interface JourneyStep {
  id: JourneyStepId;
  eyebrow: string;
  title: string;
  description: string;
  audioFile?: string;
  audioLabel?: string;
  duration?: string;
}

interface JourneyState {
  completed: Record<JourneyStepId, boolean>;
  reflections: Record<"guide" | "shadow" | "symbol", string>;
}

const journeySteps: JourneyStep[] = [
  {
    id: "guide",
    eyebrow: "Meditation · eyes closed",
    title: "Meet Your Guide",
    description:
      "Picture a doorway. Something is waiting on the other side of it — a person, an animal, a shape, or a voice. Do not decide what it is in advance; let it arrive. Ask it one question and notice what it shows you.",
    audioFile: deepReturnAudio,
    audioLabel: "The Deep Return",
    duration: "6:00",
  },
  {
    id: "shadow",
    eyebrow: "Meditation · eyes closed",
    title: "Meet Your Shadow Self",
    description:
      "Let the figure in your dreams come closer instead of pushing it back. Ask what it is protecting, or what it needs from you. You do not have to like the answer; just receive it.",
    audioFile: shadowSelfAudio,
    audioLabel: "Meeting the Shadow Self",
    duration: "5:00",
  },
  {
    id: "symbol",
    eyebrow: "Meditation · eyes closed",
    title: "Sit With a Symbol",
    description:
      "Bring to mind an image that has followed you across more than one dream. Let it grow clearer without reaching for it. Notice its texture, color, and whether it changes as you look. Do not interpret it yet.",
    audioFile: dreamSymbolAudio,
    audioLabel: "Meeting the Dream Symbol",
    duration: "9:10",
  },
  {
    id: "breath",
    eyebrow: "Box breathing · 4 rounds",
    title: "Settle the Breath",
    description:
      "Inhale for four. Hold for four. Exhale for four. Hold for four. Let the shape guide the pace.",
  },
];

const emptyJourneyState: JourneyState = {
  completed: { guide: false, shadow: false, symbol: false, breath: false },
  reflections: { guide: "", shadow: "", symbol: "" },
};

const breathPhases = ["Inhale", "Hold", "Exhale", "Hold"] as const;
const journeyDate = () => new Date().toISOString().slice(0, 10);

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function Meditation() {
  const { user } = useUser();
  const [journeyState, setJourneyState] = useState<JourneyState>(emptyJourneyState);
  const [activeAudioId, setActiveAudioId] = useState<JourneyStepId | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathIndex, setBreathIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const storageKey = `dreamgate:dream-journey:${user?.id ?? "guest"}:${journeyDate()}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<JourneyState>;
        setJourneyState({
          completed: { ...emptyJourneyState.completed, ...parsed.completed },
          reflections: { ...emptyJourneyState.reflections, ...parsed.reflections },
        });
      } else {
        setJourneyState(emptyJourneyState);
      }
    } catch {
      setJourneyState(emptyJourneyState);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(journeyState));
    } catch {
      // Storage can be unavailable in private browsing; the journey still works in memory.
    }
  }, [journeyState, storageKey]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!breathRunning) return;
    const timer = window.setTimeout(() => {
      if (breathIndex >= 15) {
        setBreathRunning(false);
        markStepComplete("breath", true);
      } else {
        setBreathIndex((current) => current + 1);
      }
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [breathIndex, breathRunning]);

  const markStepComplete = (id: JourneyStepId, completed: boolean) => {
    setJourneyState((current) => ({
      ...current,
      completed: { ...current.completed, [id]: completed },
    }));
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setActiveAudioId(null);
    setIsAudioPlaying(false);
    setAudioTime(0);
    setAudioDuration(0);
  };

  const toggleAudio = (step: JourneyStep) => {
    if (!step.audioFile) return;
    if (activeAudioId === step.id && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    stopAudio();
    const audio = new Audio(step.audioFile);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => setAudioDuration(audio.duration);
    audio.ontimeupdate = () => setAudioTime(audio.currentTime);
    audio.onplay = () => {
      setIsAudioPlaying(true);
      trackEvent("meditation_started", { meditation_id: step.id, tool_id: "meditation" });
    };
    audio.onpause = () => setIsAudioPlaying(false);
    audio.onended = () => {
      markStepComplete(step.id, true);
      trackEvent("meditation_completed", { meditation_id: step.id, tool_id: "meditation" });
      trackDiscoverToolCompleted(["meditation", "meditation-101"], "meditation_completed");
      setActiveAudioId(null);
      setIsAudioPlaying(false);
      setAudioTime(0);
      audioRef.current = null;
    };
    audio.onerror = () => stopAudio();
    audioRef.current = audio;
    setActiveAudioId(step.id);
    void audio.play().catch(() => stopAudio());
  };

  const seekAudio = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setAudioTime(value);
  };

  const startBreathing = () => {
    if (breathRunning) {
      setBreathRunning(false);
      return;
    }
    if (journeyState.completed.breath) setBreathIndex(0);
    setBreathRunning(true);
    markStepComplete("breath", false);
  };

  const startNewJourney = () => {
    if (!window.confirm("Clear this journey and start fresh?")) return;
    stopAudio();
    setBreathRunning(false);
    setBreathIndex(0);
    setJourneyState(emptyJourneyState);
  };

  const currentBreathPhase = breathRunning
    ? breathPhases[breathIndex % breathPhases.length]
    : journeyState.completed.breath
      ? "Complete"
      : "Ready";
  const currentBreathRound = Math.min(4, Math.floor(breathIndex / 4) + 1);

  return (
    <main className="meditation-page dream-journey-page min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="meditation-header dream-journey-header space-y-3">
          <p className="meditation-kicker text-xs uppercase tracking-[0.28em]">Guided Journey</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Dream Journey</h1>
          <p className="meditation-muted max-w-xl text-sm leading-relaxed">
            A short practice for the space between waking and sleep — a guide, a shadow, a symbol,
            and a way to settle the breath.
          </p>
          <p className="dream-journey-headphones text-sm font-medium">
            <Headphones aria-hidden="true" className="mr-2 inline-block h-4 w-4" />
            Headphones are recommended for maximum benefit.
          </p>
        </header>

        <section className="dream-journey-path" aria-label="Dream Journey steps">
          {journeySteps.map((step) => {
            const completed = journeyState.completed[step.id];
            const isActiveAudio = activeAudioId === step.id;
            const isBreathStep = step.id === "breath";

            return (
              <article
                key={step.id}
                className={`dream-journey-step${completed ? " is-complete" : ""}`}
                data-testid={`journey-step-${step.id}`}
              >
                <button
                  type="button"
                  className="dream-journey-marker"
                  onClick={() => markStepComplete(step.id, !completed)}
                  aria-pressed={completed}
                  aria-label={`${completed ? "Mark" : "Complete"} ${step.title}`}
                >
                  {completed ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
                </button>

                <p className="dream-journey-eyebrow">{step.eyebrow}</p>
                <h2 className="dream-journey-step-title">{step.title}</h2>
                <p className="dream-journey-description">{step.description}</p>

                {step.audioFile && (
                  <div className="dream-journey-audio">
                    <div className="dream-journey-audio__header">
                      <span>{step.audioLabel}</span>
                      <span>{step.duration}</span>
                    </div>
                    <div className="dream-journey-audio__controls">
                      <button
                        type="button"
                        className="dream-journey-play"
                        onClick={() => toggleAudio(step)}
                        aria-label={`${isActiveAudio && isAudioPlaying ? "Pause" : "Play"} ${step.title}`}
                        data-testid={`button-journey-audio-${step.id}`}
                      >
                        {isActiveAudio && isAudioPlaying ? (
                          <Pause aria-hidden="true" />
                        ) : (
                          <Play aria-hidden="true" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max={isActiveAudio ? audioDuration || 1 : 1}
                        step="0.1"
                        value={isActiveAudio ? Math.min(audioTime, audioDuration || 1) : 0}
                        onChange={(event) => seekAudio(Number(event.target.value))}
                        aria-label={`${step.title} progress`}
                        className="dream-journey-audio__range"
                      />
                      <span className="dream-journey-audio__time">
                        {isActiveAudio ? formatAudioTime(audioTime) : "0:00"}
                      </span>
                    </div>
                  </div>
                )}

                {isBreathStep && (
                  <div className="dream-journey-breath">
                    <div
                      className={`dream-journey-breath__shape${
                        breathRunning && breathIndex % 4 < 2 ? " is-expanded" : ""
                      }`}
                    >
                      <span>{currentBreathPhase}</span>
                    </div>
                    <p className="dream-journey-breath__count">
                      {breathRunning ? `Round ${currentBreathRound} of 4` : "4 rounds"}
                    </p>
                    <button
                      type="button"
                      className="dream-journey-secondary-button"
                      onClick={startBreathing}
                      data-testid="button-begin-breathing"
                    >
                      <Wind aria-hidden="true" />
                      {breathRunning ? "Pause" : journeyState.completed.breath ? "Begin again" : "Begin"}
                    </button>
                  </div>
                )}

                {step.id !== "breath" && (
                  <div className="dream-journey-reflection">
                    <label htmlFor={`journey-reflection-${step.id}`}>Reflection</label>
                    <input
                      id={`journey-reflection-${step.id}`}
                      type="text"
                      value={journeyState.reflections[step.id]}
                      onChange={(event) =>
                        setJourneyState((current) => ({
                          ...current,
                          reflections: {
                            ...current.reflections,
                            [step.id]: event.target.value,
                          },
                        }))
                      }
                      placeholder={
                        step.id === "guide"
                          ? "Who or what showed up?"
                          : step.id === "shadow"
                            ? "What did it need, or protect?"
                            : "The symbol you keep returning to."
                      }
                    />
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <div className="dream-journey-footer">
          <p className="dream-journey-save-note">
            <Sparkles aria-hidden="true" />
            Your reflections and completed steps are saved for today.
          </p>
          <button
            type="button"
            className="dream-journey-reset"
            onClick={startNewJourney}
            data-testid="button-start-new-journey"
          >
            <RotateCcw aria-hidden="true" />
            Start a New Journey
          </button>
        </div>
      </div>
    </main>
  );
}