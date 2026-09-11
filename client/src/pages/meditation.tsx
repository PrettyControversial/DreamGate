import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Check, Headphones, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { trackDiscoverToolCompleted, trackEvent } from "@/lib/analytics";
import { setMeditationMediaSession } from "@/lib/meditation-media-session";

import dreamSymbolAudio from "@assets/dreamgate_meditations/meeting-the-dream-symbol.mp3";
import shadowSelfAudio from "@assets/dreamgate_meditations/meeting-the-shadow-self.mp3";
import guideAudio from "@assets/dreamgate_meditations/meeting-your-guide.mp3";
import groundingBoxAudio from "@assets/dreamgate_meditations/the-grounding-box.mp3";
import meditationSymbolRelief from "@assets/meditation-symbol-relief.webp";

type JourneyStepId = "guide" | "shadow" | "symbol" | "breath";
type ReflectionStepId = Exclude<JourneyStepId, "breath">;

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
  reflections: Record<ReflectionStepId, string>;
}

const journeySteps: JourneyStep[] = [
  {
    id: "guide",
    eyebrow: "Meditation · eyes closed",
    title: "Meet Your Guide",
    description:
      "Picture a doorway. Something is waiting on the other side: a person, an animal, a shape, or a voice. Do not decide what it is in advance. Let it arrive. Ask it one question and notice what it shows you.",
    audioFile: guideAudio,
    audioLabel: "Meeting Your Guide",
    duration: "11:40",
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
    audioFile: groundingBoxAudio,
    audioLabel: "The Grounding Box",
    duration: "8:00",
  },
];

const emptyJourneyState: JourneyState = {
  completed: { guide: false, shadow: false, symbol: false, breath: false },
  reflections: { guide: "", shadow: "", symbol: "" },
};

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
  const [reflectionDrafts, setReflectionDrafts] = useState(emptyJourneyState.reflections);
  const [savedReflectionId, setSavedReflectionId] = useState<ReflectionStepId | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const savedNoteTimerRef = useRef<number | null>(null);
  const storageKey = `dreamgate:dream-journey:${user?.id ?? "guest"}:${journeyDate()}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<JourneyState>;
        const nextJourneyState = {
          completed: { ...emptyJourneyState.completed, ...parsed.completed },
          reflections: { ...emptyJourneyState.reflections, ...parsed.reflections },
        };
        setJourneyState(nextJourneyState);
        setReflectionDrafts(nextJourneyState.reflections);
      } else {
        setJourneyState(emptyJourneyState);
        setReflectionDrafts(emptyJourneyState.reflections);
      }
    } catch {
      setJourneyState(emptyJourneyState);
      setReflectionDrafts(emptyJourneyState.reflections);
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
      if (savedNoteTimerRef.current) window.clearTimeout(savedNoteTimerRef.current);
    };
  }, []);

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
    setMeditationMediaSession(step.audioLabel ?? step.title);
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

  const saveJourneyNote = (id: ReflectionStepId) => {
    setJourneyState((current) => ({
      ...current,
      reflections: { ...current.reflections, [id]: reflectionDrafts[id].trim() },
    }));
    setSavedReflectionId(id);
    if (savedNoteTimerRef.current) window.clearTimeout(savedNoteTimerRef.current);
    savedNoteTimerRef.current = window.setTimeout(() => setSavedReflectionId(null), 2200);
  };

  const startNewJourney = () => {
    if (!window.confirm("Clear this journey and start fresh?")) return;
    stopAudio();
    setJourneyState(emptyJourneyState);
    setReflectionDrafts(emptyJourneyState.reflections);
    setSavedReflectionId(null);
  };

  return (
    <main className="meditation-page dream-journey-page min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="meditation-header meditation-header--object dream-journey-header">
          <div className="meditation-header__copy space-y-3">
            <p className="meditation-kicker text-xs uppercase tracking-[0.28em]">Guided Journey</p>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">Dream Journey</h1>
            <p className="meditation-muted max-w-xl text-sm leading-relaxed">
              A gentle practice for the space between waking and sleep. Meet a guide, sit with a shadow,
              welcome a symbol, and settle the breath.
            </p>
            <p className="dream-journey-headphones text-sm font-medium">
              <Headphones aria-hidden="true" className="mr-2 inline-block h-4 w-4" />
              Headphones are recommended for maximum benefit.
            </p>
          </div>
          <img
            className="meditation-header__object"
            src={meditationSymbolRelief}
            alt=""
            aria-hidden="true"
          />
        </header>

        <section className="dream-journey-path" aria-label="Dream Journey steps">
          {journeySteps.map((step) => {
            const completed = journeyState.completed[step.id];
            const isActiveAudio = activeAudioId === step.id;

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
                        className="dream-journey-play home-capsule-button home-capsule-button--solid no-default-hover-elevate no-default-active-elevate"
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

                {step.id !== "breath" && (
                  <div className="dream-journey-reflection">
                    <label htmlFor={`journey-reflection-${step.id}`}>Journey Note</label>
                    <input
                      id={`journey-reflection-${step.id}`}
                      type="text"
                      value={reflectionDrafts[step.id]}
                      onChange={(event) => {
                        setReflectionDrafts((current) => ({
                          ...current,
                          [step.id]: event.target.value,
                        }));
                        if (savedReflectionId === step.id) setSavedReflectionId(null);
                      }}
                      placeholder={
                        step.id === "guide"
                          ? "Who or what showed up?"
                          : step.id === "shadow"
                            ? "What did it need, or protect?"
                            : "The symbol you keep returning to."
                      }
                    />
                    <div className="dream-journey-reflection__actions">
                      <button
                        type="button"
                        className="dream-journey-note-save home-capsule-button home-capsule-button--outline no-default-hover-elevate no-default-active-elevate"
                        onClick={() => saveJourneyNote(step.id)}
                        disabled={
                          !reflectionDrafts[step.id].trim() ||
                          reflectionDrafts[step.id].trim() === journeyState.reflections[step.id]
                        }
                        data-testid={`button-save-journey-note-${step.id}`}
                      >
                        Save Journey Note
                      </button>
                      {savedReflectionId === step.id && (
                        <span className="dream-journey-note-saved">
                          <Check aria-hidden="true" />
                          Journey note saved
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <div className="dream-journey-footer">
          <p className="dream-journey-save-note">
            <Sparkles aria-hidden="true" />
            Completed steps and saved journey notes are kept for today.
          </p>
          <button
            type="button"
            className="dream-journey-reset home-capsule-button home-capsule-button--outline no-default-hover-elevate no-default-active-elevate"
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