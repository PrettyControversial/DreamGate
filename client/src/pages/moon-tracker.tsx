import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Check, ChevronDown, Eye, Feather, Headphones, Pause, Play, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setMeditationMediaSession } from "@/lib/meditation-media-session";
import type { SleepIntention } from "@shared/schema";
import sensesInitiatedAudio from "@assets/dreamgate_meditations/senses-initiated-lucid-dream.m4a";
import thetaRealmAudio from "@assets/dreamgate_meditations/theta-realm-lucid-dreaming-rehearsal.m4a";
import boxBreathingAudio from "@/assets/box-breathing-for-sleep.m4a";
import nightMapPortal from "@assets/night-map-portal.webp";

const lucidMeditations = [
  {
    id: "reality-check",
    practiceId: "reality-check",
    title: "Reality Check Meditation",
    subtitle: "Track 01 · Senses Initiated Lucid Dream",
    durationLabel: "8:35",
    durationSeconds: 515,
    audioFile: sensesInitiatedAudio,
    guidance: "Use this before sleep when you want to strengthen the habit of checking your surroundings. Let each sense become an honest question, not a test you need to pass.",
  },
  {
    id: "dream-cue",
    practiceId: "mild",
    title: "Lucid Dreaming Rehearsal",
    subtitle: "Track 02 · Theta Realm",
    durationLabel: "8:25",
    durationSeconds: 505,
    audioFile: thetaRealmAudio,
    guidance: "Use this when your body is ready for rest. Rehearse meeting one familiar dream sign with calm attention, then let the scene soften without forcing sleep.",
  },
  {
    id: "box-breathing",
    practiceId: "box-breathing",
    title: "Box Breathing for Sleep",
    subtitle: "Sleep meditation · Headphones recommended",
    durationLabel: "6:40",
    durationSeconds: 400,
    audioFile: boxBreathingAudio,
    guidance: "A slow four-count rhythm to settle the body and make the transition into sleep feel less effortful.",
  },
];

const lucidPractices = [
  {
    id: "reality-check",
    icon: Eye,
    eyebrow: "Lucid dream training",
    title: "Reality Check Meditation · 9 min",
    description: "Build a small habit of checking the moment. The aim is curiosity, so the same question can appear naturally inside a dream.",
    steps: ["Pause and notice three ordinary details around you.", "Ask, “Am I dreaming?” and give yourself time to answer.", "Read a line or study your hands, look away, then check again."],
  },
  {
    id: "mild",
    icon: Sparkles,
    eyebrow: "Guided practice",
    title: "Theta Realm Rehearsal · 8 min",
    description: "Practice recognizing a dream sign without adding pressure. You are teaching attention to stay steady when the scene changes.",
    steps: ["Recall a recent dream or choose one familiar dream sign.", "Picture yourself noticing it, breathing once, and becoming lucid.", "Repeat, “When I dream tonight, I will remember that I am dreaming.”"],
  },
  {
    id: "intention",
    icon: Headphones,
    eyebrow: "Bedtime practice",
    title: "Set a Dream Intention · 2 min",
    description: "Give the dreaming mind one clear instruction to carry across the threshold of sleep. Keep it kind and easy to remember.",
    steps: ["Choose one short intention you can remember easily.", "Write it below before getting into bed.", "Repeat it slowly three times with your eyes closed."],
  },
  {
    id: "box-breathing",
    icon: Headphones,
    eyebrow: "Final sleep preparation",
    title: "Box Breathing for Sleep · 6 min",
    description: "Settle your body before lucid dreaming. A steady four-count rhythm gives your attention one gentle place to rest as sleep begins.",
    steps: ["Get comfortable and let your jaw, shoulders, and hands soften.", "Follow the four-count rhythm without trying to force sleep.", "Let the final breath carry you toward the dream state."],
  },
  {
    id: "recall",
    icon: BookOpen,
    eyebrow: "Morning practice",
    title: "Build Recall · 3 min",
    description: "Lucid dreaming begins with remembering. Keep the first fragments close before the waking world takes over.",
    steps: ["Keep your eyes closed for a few breaths when you wake.", "Follow the last feeling, image, or person back through the dream.", "Write three words before you reach for your phone."],
  },
];

export default function MoonTracker() {
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);
  const [openPracticeId, setOpenPracticeId] = useState("reality-check");
  const [dreamRecall, setDreamRecall] = useState("");
  const [dailyIntention, setDailyIntention] = useState("");
  const [savedIntentionId, setSavedIntentionId] = useState<string | null>(null);
  const [savedIntention, setSavedIntention] = useState("");
  const [intentionHydrated, setIntentionHydrated] = useState(false);
  const [intentionSaveState, setIntentionSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [activeMeditationId, setActiveMeditationId] = useState<string | null>(null);
  const [nightMeditationPlaying, setNightMeditationPlaying] = useState(false);
  const [nightMeditationCurrentTime, setNightMeditationCurrentTime] = useState(0);
  const [nightMeditationDuration, setNightMeditationDuration] = useState(0);
  const [ritualComplete, setRitualComplete] = useState(false);
  const [ritualSaveError, setRitualSaveError] = useState<string | null>(null);
  const [activeDescentStep, setActiveDescentStep] = useState("night-practices");
  const nightMeditationRef = useRef<HTMLAudioElement | null>(null);
  const { data: recentIntentions } = useQuery<SleepIntention[]>({ queryKey: ["/api/intentions"] });

  const intentionMutation = useMutation({
    mutationFn: async ({ id, intention }: { id: string | null; intention: string }) => {
      const response = await apiRequest(
        id ? "PATCH" : "POST",
        id ? `/api/intentions/${id}` : "/api/intentions",
        { intention },
      );
      return (await response.json()) as SleepIntention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intentions"] });
    },
  });

  useEffect(() => {
    return () => {
      nightMeditationRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const sections = ["night-practices", "night-meditation", "night-reflection", "night-sleep"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleEntry?.target instanceof HTMLElement) {
          setActiveDescentStep(visibleEntry.target.id);
        }
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (intentionHydrated || recentIntentions === undefined) return;

    const latestIntention = recentIntentions[0];
    setDailyIntention(latestIntention?.intention ?? "");
    setSavedIntentionId(latestIntention?.id ?? null);
    setSavedIntention(latestIntention?.intention ?? "");
    setIntentionHydrated(true);
  }, [intentionHydrated, recentIntentions]);

  const focusDescentStep = (stepId: string) => {
    setActiveDescentStep(stepId);
    document.getElementById(stepId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleNightMeditation = (track: (typeof lucidMeditations)[number]) => {
    const activeAudio = nightMeditationRef.current;
    if (activeAudio && activeMeditationId === track.id) {
      if (nightMeditationPlaying) {
        activeAudio.pause();
        setNightMeditationPlaying(false);
      } else {
        void activeAudio.play().then(() => setNightMeditationPlaying(true)).catch(() => setNightMeditationPlaying(false));
      }
      return;
    }

    activeAudio?.pause();
    setNightMeditationCurrentTime(0);
    setNightMeditationDuration(track.durationSeconds);

    const audio = new Audio(track.audioFile);
    setMeditationMediaSession(track.title);
    audio.preload = "metadata";
    audio.ontimeupdate = () => setNightMeditationCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () =>
      setNightMeditationDuration(
        Number.isFinite(audio.duration) ? audio.duration : track.durationSeconds,
      );
    audio.onplay = () => setNightMeditationPlaying(true);
    audio.onpause = () => setNightMeditationPlaying(false);
    audio.onended = () => {
      nightMeditationRef.current = null;
      setActiveMeditationId(null);
      setNightMeditationPlaying(false);
      setNightMeditationCurrentTime(0);
      setCompletedPractices((current) =>
        track.practiceId === "box-breathing" || current.includes(track.practiceId)
          ? current
          : [...current, track.practiceId],
      );
    };
    audio.onerror = () => {
      nightMeditationRef.current = null;
      setActiveMeditationId(null);
      setNightMeditationPlaying(false);
    };
    nightMeditationRef.current = audio;
    setActiveMeditationId(track.id);
    setNightMeditationPlaying(true);
    void audio.play().catch(() => {
      nightMeditationRef.current = null;
      setActiveMeditationId(null);
      setNightMeditationPlaying(false);
    });
  };

  const formatAudioTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const togglePractice = (id: string) => {
    setRitualComplete(false);
    setRitualSaveError(null);
    setCompletedPractices((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const saveIntention = async () => {
    const intention = dailyIntention.trim();
    if (!intention || intentionMutation.isPending || intention === savedIntention) return;

    setIntentionSaveState("idle");
    try {
      const saved = await intentionMutation.mutateAsync({ id: savedIntentionId, intention });
      setSavedIntentionId(saved.id);
      setSavedIntention(saved.intention);
      setDailyIntention(saved.intention);
      setIntentionSaveState("saved");
    } catch {
      setIntentionSaveState("error");
    }
  };

  const completeTonightRitual = async () => {
    if (ritualComplete || intentionMutation.isPending) return;

    const intention = dailyIntention.trim();
    const completedPracticeIds = lucidPractices.map((practice) => practice.id);
    setRitualSaveError(null);
    setCompletedPractices(completedPracticeIds);

    try {
      if (intention && intention !== savedIntention) {
        const saved = await intentionMutation.mutateAsync({ id: savedIntentionId, intention });
        setSavedIntentionId(saved.id);
        setSavedIntention(saved.intention);
        setDailyIntention(saved.intention);
      }
      setIntentionSaveState(intention ? "saved" : "idle");
      setRitualComplete(true);
    } catch {
      setIntentionSaveState("error");
      setRitualSaveError("We couldn't save tonight's ritual. Please try again.");
    }
  };

  const descentStepComplete = {
    "night-practices": completedPractices.length === lucidPractices.length,
    "night-meditation": completedPractices.some((id) =>
      lucidMeditations.some((meditation) => meditation.practiceId === id),
    ),
    "night-reflection": dailyIntention.trim().length > 0,
    "night-sleep": ritualComplete,
  };

  return (
    <main
      className="night-map-page min-h-screen px-4 py-8 md:px-8 md:py-10"
      data-testid="night-map-page"
    >
      <div className="mx-auto max-w-3xl">
        <header className="meditation-header meditation-header--object dream-journey-header night-map-journey-header">
          <div className="meditation-header__copy space-y-3">
            <div className="dream-journey-heading-row">
              <div className="dream-journey-heading-copy">
                <p className="meditation-kicker text-xs uppercase tracking-[0.28em]">Nightly Ritual</p>
                <h1 className="font-display text-4xl tracking-tight md:text-5xl">The Descent</h1>
              </div>
            </div>
            <p className="meditation-muted max-w-xl text-sm leading-relaxed">
              A nightly checklist for training awareness, preparing for lucid dreams, and crossing gently into sleep.
            </p>
            <p className="dream-journey-headphones text-sm font-medium">
              <Headphones aria-hidden="true" className="mr-2 inline-block h-4 w-4" />
              Headphones are recommended.
            </p>
            <a href="#night-practices" className="night-map-text-link">Begin the descent <span aria-hidden="true">↓</span></a>
          </div>
          <div className="night-map-arrival__mirror" aria-hidden="true">
            <img src={nightMapPortal} alt="" />
          </div>
        </header>

        <div className="night-map-content">
        <div className="dream-journey-path night-map-journey-path" aria-label="The Descent steps">
        <section id="night-practices" className="dream-journey-step night-map-step night-map-compact-section night-map-practices-compact" aria-labelledby="night-map-practices-title">
          <button
            type="button"
            className={`dream-journey-marker${descentStepComplete["night-practices"] ? " is-complete" : ""}${activeDescentStep === "night-practices" ? " is-active" : ""}`}
            onClick={() => focusDescentStep("night-practices")}
            aria-current={activeDescentStep === "night-practices" ? "step" : undefined}
            aria-pressed={descentStepComplete["night-practices"]}
            aria-label={`${descentStepComplete["night-practices"] ? "Completed" : "Open"} practice step`}
          >
            {descentStepComplete["night-practices"] ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
          </button>
          <div className="night-map-step__content">
          <div className="night-map-compact-heading">
            <div><p className="night-map-kicker">01 / Lucid dream training</p><h2 id="night-map-practices-title">Lucid Dream Checklist</h2></div>
            <span className="night-map-progress">{completedPractices.length}/{lucidPractices.length} complete</span>
          </div>
          <div className="night-map-progress-track" aria-label={`${completedPractices.length} of ${lucidPractices.length} practices complete`}>
            {lucidPractices.map((practice) => <span key={practice.id} className={completedPractices.includes(practice.id) ? "is-complete" : ""} />)}
          </div>
          <p className="night-map-checklist-intro">Reality checks, intention, meditation, and recall work together. Complete what supports you tonight.</p>
          <div className="night-map-lucid-checklist" role="list">
            {lucidPractices.map((practice, index) => {
              const PracticeIcon = practice.icon;
              const isComplete = completedPractices.includes(practice.id);
              return (
                <article
                  key={practice.id}
                  className={`night-map-checklist-card${isComplete ? " is-complete" : ""}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button, input, textarea, a")) return;
                    togglePractice(practice.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    if ((event.target as HTMLElement).closest("button, input, textarea, a")) return;
                    event.preventDefault();
                    togglePractice(practice.id);
                  }}
                  aria-label={`${isComplete ? "Completed" : "Complete"} ${practice.title}`}
                >
                  <button
                    type="button"
                    className="night-map-checklist-toggle"
                    onClick={() => togglePractice(practice.id)}
                    aria-pressed={isComplete}
                    aria-label={`${isComplete ? "Uncheck" : "Complete"} ${practice.title}`}
                    data-testid={`button-practice-${practice.id}`}
                  >
                    {isComplete && <Check aria-hidden="true" />}
                  </button>
                  <p className="night-map-checklist-number">0{index + 1}</p>
                  <PracticeIcon className="night-map-checklist-icon" aria-hidden="true" />
                   <button
                     type="button"
                     className="night-map-practice-expand"
                     onClick={() => setOpenPracticeId((current) => current === practice.id ? "" : practice.id)}
                     aria-expanded={openPracticeId === practice.id}
                     aria-label={`${openPracticeId === practice.id ? "Collapse" : "Expand"} ${practice.title}`}
                   >
                     <ChevronDown aria-hidden="true" />
                   </button>
                  <p className="night-map-checklist-eyebrow">{practice.eyebrow}</p>
                  <h3>{practice.title}</h3>
                   {openPracticeId === practice.id && (
                     <div className="night-map-practice-body">
                       <p className="night-map-checklist-description">{practice.description}</p>
                       <ol>
                         {practice.steps.map((step) => <li key={step}>{step}</li>)}
                       </ol>
                      {(() => {
                     const meditation = lucidMeditations.find((track) => track.practiceId === practice.id);
                     if (!meditation) return null;
                     const isActive = activeMeditationId === meditation.id;
                     return (
                       <div className="night-map-checklist-meditation">
                         <div className="night-map-checklist-meditation__label"><Headphones aria-hidden="true" /><span>Belongs to this practice</span></div>
                         <div className="night-map-meditation-track__heading">
                           <div><p>{meditation.subtitle}</p><h4>{meditation.title}</h4></div>
                           <span>{meditation.durationLabel}</span>
                         </div>
                         <div className="night-map-audio-player">
                           <button type="button" onClick={() => toggleNightMeditation(meditation)} className="night-map-audio-player__play" data-testid={`button-night-meditation-${meditation.id}`} aria-label={isActive && nightMeditationPlaying ? `Pause ${meditation.title}` : `Play ${meditation.title}`}>
                             {isActive && nightMeditationPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                           </button>
                           <div className="night-map-audio-player__track">
                             <div className="night-map-audio-player__times"><span>{isActive ? formatAudioTime(nightMeditationCurrentTime) : "0:00"}</span><span>{meditation.durationLabel}</span></div>
                             <input type="range" min="0" max={isActive ? nightMeditationDuration || meditation.durationSeconds : meditation.durationSeconds} step="0.1" value={isActive ? Math.min(nightMeditationCurrentTime, nightMeditationDuration || meditation.durationSeconds) : 0} onChange={(event) => { if (!isActive) return; const nextTime = Number(event.target.value); setNightMeditationCurrentTime(nextTime); if (nightMeditationRef.current) nightMeditationRef.current.currentTime = nextTime; }} aria-label={`${meditation.title} progress`} />
                           </div>
                         </div>
                         <p className="night-map-meditation-track__guidance">{meditation.guidance}</p>
                       </div>
                     );
                      })()}
                     {practice.id === "intention" && (
                       <a href="#night-reflection" className="night-map-checklist-link">Set intention <span aria-hidden="true">↓</span></a>
                     )}
                     {practice.id === "recall" && (
                       <div className="night-map-recall">
                         <label htmlFor="night-recall">Three things that come to mind when you wake</label>
                         <Textarea
                           id="night-recall"
                           value={dreamRecall}
                           onChange={(event) => setDreamRecall(event.target.value)}
                           placeholder={"1. A feeling, image, or person\n2. A detail from the dream\n3. What stayed with me"}
                           className="night-map-recall__textarea"
                           data-testid="textarea-dream-recall"
                         />
                       </div>
                     )}
                     <button
                       type="button"
                       className="night-map-mark-complete"
                       onClick={() => togglePractice(practice.id)}
                       aria-pressed={isComplete}
                     >
                       <span aria-hidden="true">{isComplete ? "✓" : "○"}</span>
                       {isComplete ? "Completed" : "Mark as complete"}
                     </button>
                     </div>
                   )}
                </article>
              );
            })}
          </div>
           <nav className="night-map-step-nav" aria-label="Practice step navigation">
             <a href="#night-meditation" onClick={() => setActiveDescentStep("night-meditation")}>Continue the Descent <span aria-hidden="true">→</span></a>
           </nav>
          </div>
        </section>

         <section id="night-meditation" className="dream-journey-step night-map-step night-map-meditation-compact" data-testid="night-meditation" aria-labelledby="night-map-meditation-title">
           <button
             type="button"
             className={`dream-journey-marker${descentStepComplete["night-meditation"] ? " is-complete" : ""}${activeDescentStep === "night-meditation" ? " is-active" : ""}`}
             onClick={() => focusDescentStep("night-meditation")}
             aria-current={activeDescentStep === "night-meditation" ? "step" : undefined}
             aria-pressed={descentStepComplete["night-meditation"]}
             aria-label={`${descentStepComplete["night-meditation"] ? "Completed" : "Open"} sound step`}
           >
             {descentStepComplete["night-meditation"] ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
           </button>
           <div className="night-map-step__content">
          <div className="night-map-meditation-compact__heading"><p className="night-map-kicker">02 / Sound</p><h2 id="night-map-meditation-title">Choose one path into sleep.</h2><span>One meditation is enough for tonight.</span></div>
          <p className="night-map-sound-note">Use Reality Check to sharpen your awareness of the present moment. Use Theta Realm to rehearse recognizing a dream sign as your body settles. Each recording now lives with the practice it supports, so you can read, listen, and continue without losing your place.</p>
           <nav className="night-map-step-nav" aria-label="Sound step navigation">
             <a href="#night-practices" onClick={() => setActiveDescentStep("night-practices")}><span aria-hidden="true">←</span> Previous</a>
             <a href="#night-reflection" onClick={() => setActiveDescentStep("night-reflection")}>Continue <span aria-hidden="true">→</span></a>
           </nav>
           </div>
        </section>

         <section id="night-reflection" className="dream-journey-step night-map-step night-map-reflection" aria-labelledby="night-map-reflection-title">
           <button
             type="button"
             className={`dream-journey-marker${descentStepComplete["night-reflection"] ? " is-complete" : ""}${activeDescentStep === "night-reflection" ? " is-active" : ""}`}
             onClick={() => focusDescentStep("night-reflection")}
             aria-current={activeDescentStep === "night-reflection" ? "step" : undefined}
             aria-pressed={descentStepComplete["night-reflection"]}
             aria-label={`${descentStepComplete["night-reflection"] ? "Completed" : "Open"} reflection step`}
           >
             {descentStepComplete["night-reflection"] ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
           </button>
           <div className="night-map-step__content">
          <div className="night-map-compact-heading"><div><p className="night-map-kicker">03 / Reflection</p><h2 id="night-map-reflection-title">Arrive as you are.</h2></div></div>
           <div className="dream-journey-reflection night-map-journey-note">
             <label htmlFor="night-intention">
               <Feather aria-hidden="true" />
               <span>Tonight&apos;s Intention</span>
             </label>
             <Textarea
               id="night-intention"
               value={dailyIntention}
               onChange={(event) => {
                 setDailyIntention(event.target.value);
                 setRitualComplete(false);
                 setRitualSaveError(null);
                 setIntentionSaveState("idle");
               }}
               placeholder="Write your intention for tonight…"
               className="night-map-intention"
               data-testid="textarea-daily-intention"
             />
             <div className="dream-journey-reflection__actions">
               <button
                 type="button"
                 className="dream-journey-note-save"
                 onClick={() => void saveIntention()}
                 disabled={
                   !dailyIntention.trim() ||
                   dailyIntention.trim() === savedIntention ||
                   intentionMutation.isPending
                 }
                 data-testid="button-save-journey-note-intention"
               >
                 {intentionMutation.isPending ? "Saving…" : "Save Journey Note"}
               </button>
               {intentionSaveState === "saved" && (
                 <span className="dream-journey-note-saved">
                   <Check aria-hidden="true" />
                   Journey note saved
                 </span>
               )}
               {intentionSaveState === "error" && (
                 <span className="night-map-save-error" role="alert">
                   We couldn&apos;t save your note. Please try again.
                 </span>
               )}
             </div>
           </div>
           <nav className="night-map-step-nav" aria-label="Reflection step navigation">
             <a href="#night-meditation" onClick={() => setActiveDescentStep("night-meditation")}><span aria-hidden="true">←</span> Previous</a>
             <a href="#night-sleep" onClick={() => setActiveDescentStep("night-sleep")}>Continue <span aria-hidden="true">→</span></a>
           </nav>
           </div>
        </section>

         <section id="night-sleep" className="dream-journey-step night-map-step night-map-complete">
           <button
             type="button"
             className={`dream-journey-marker${descentStepComplete["night-sleep"] ? " is-complete" : ""}${activeDescentStep === "night-sleep" ? " is-active" : ""}`}
             onClick={() => focusDescentStep("night-sleep")}
             aria-current={activeDescentStep === "night-sleep" ? "step" : undefined}
             aria-pressed={descentStepComplete["night-sleep"]}
             aria-label={`${descentStepComplete["night-sleep"] ? "Completed" : "Open"} sleep step`}
           >
             {descentStepComplete["night-sleep"] ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
           </button>
           <div className="night-map-step__content">
          <div className="night-map-complete__heading">
            <p className="night-map-kicker">04 / Sleep</p>
            <h2>{ritualComplete ? "The night is yours." : "Let the day become a dream."}</h2>
          </div>
          <button type="button" onClick={() => void completeTonightRitual()} disabled={ritualComplete || intentionMutation.isPending} className="night-map-complete__button" data-testid="button-complete-ritual">
            {ritualComplete ? "Ritual complete" : intentionMutation.isPending ? "Saving Tonight's Ritual" : "Complete Tonight's Ritual"} <span aria-hidden="true">→</span>
          </button>
          {ritualSaveError && <p className="night-map-save-error" role="alert">{ritualSaveError}</p>}
           <nav className="night-map-step-nav" aria-label="Sleep step navigation">
             <a href="#night-reflection" onClick={() => setActiveDescentStep("night-reflection")}><span aria-hidden="true">←</span> Previous</a>
           </nav>
           </div>
        </section>
         </div>
         <div className="dream-journey-footer night-map-journey-footer">
           <p className="dream-journey-save-note"><Sparkles aria-hidden="true" /> Your Descent progress stays available while you continue tonight.</p>
         </div>
        </div>
      </div>
    </main>
  );
}