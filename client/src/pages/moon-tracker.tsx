import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Check, Eye, Feather, Headphones, Heart, Pause, Play, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MoodEntry, SleepIntention } from "@shared/schema";
import sensesInitiatedAudio from "@assets/dreamgate_meditations/senses-initiated-lucid-dream.mp3";
import thetaRealmAudio from "@assets/dreamgate_meditations/theta-realm-lucid-dreaming-rehearsal.mp3";
import nightMapPaperTexture from "@assets/night-map-paper-texture.webp";
import nightMapSymbolCrow from "@assets/night-map-symbol-crow.webp";
import nightMapHeaderRelief from "@assets/night-map-stone-cutout.png";
import nightMapPortal from "@assets/night-map-portal.webp";
import nightMapIvy from "@assets/night-map-ivy.webp";
import nightMapStoneSteps from "@assets/night-map-stone-steps.webp";

const moodOptions = [
  { value: 1, label: "Exhausted" },
  { value: 2, label: "Tired" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Rested" },
  { value: 5, label: "Energized" },
];

const lucidMeditations = [
  {
    id: "reality-check",
    practiceId: "reality-check",
    title: "Reality Check Meditation",
    subtitle: "Senses Initiated Lucid Dream",
    durationLabel: "8:35",
    durationSeconds: 515,
    audioFile: sensesInitiatedAudio,
    guidance: "Move slowly through each sense and practice noticing what changes when attention returns.",
  },
  {
    id: "dream-cue",
    practiceId: "mild",
    title: "Lucid Dreaming Rehearsal",
    subtitle: "Theta Realm",
    durationLabel: "8:25",
    durationSeconds: 505,
    audioFile: thetaRealmAudio,
    guidance: "Rehearse recognizing a familiar dream sign while your body settles toward sleep.",
  },
];

const lucidPractices = [
  {
    id: "reality-check",
    icon: Eye,
    eyebrow: "Guided practice · 9 min",
    title: "Reality Check Meditation",
    description: "Use your senses to question the moment gently, so the habit can follow you into a dream.",
    steps: ["Pause and notice three details around you.", "Ask: “Am I dreaming?” without rushing the answer.", "Read a line of text or look at your hands, then look away and back."],
  },
  {
    id: "mild",
    icon: Sparkles,
    eyebrow: "Guided practice · 8 min",
    title: "Theta Realm Rehearsal",
    description: "Rehearse a quiet intention to recognize the dream when it begins to shift.",
    steps: ["Remember a recent dream or imagine a familiar dream sign.", "Picture yourself noticing it and becoming calm and lucid.", "Repeat: “When I dream tonight, I will remember that I am dreaming.”"],
  },
  {
    id: "recall",
    icon: BookOpen,
    eyebrow: "Morning practice · 3 min",
    title: "Build recall",
    description: "Lucid dreaming begins with remembering. Capture fragments before the waking world takes over.",
    steps: ["Keep your eyes closed for a few breaths when you wake.", "Follow the last feeling, image, or person back through the dream.", "Write three words before you reach for your phone."],
  },
  {
    id: "intention",
    icon: Headphones,
    eyebrow: "Bedtime practice · 2 min",
    title: "Set a Dream Intention",
    description: "Give the dreaming mind one clear instruction to carry across the threshold of sleep.",
    steps: ["Choose one short intention you can remember easily.", "Write it below before getting into bed.", "Repeat it slowly three times with your eyes closed."],
  },
];

export default function MoonTracker() {
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [dailyIntention, setDailyIntention] = useState("");
  const [moodSaved, setMoodSaved] = useState(false);
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [activeMeditationId, setActiveMeditationId] = useState<string | null>(null);
  const [nightMeditationPlaying, setNightMeditationPlaying] = useState(false);
  const [nightMeditationCurrentTime, setNightMeditationCurrentTime] = useState(0);
  const [nightMeditationDuration, setNightMeditationDuration] = useState(0);
  const [ritualComplete, setRitualComplete] = useState(false);
  const nightMeditationRef = useRef<HTMLAudioElement | null>(null);
  const { data: recentMoods } = useQuery<MoodEntry[]>({ queryKey: ["/api/moods"] });
  const { data: recentIntentions } = useQuery<SleepIntention[]>({ queryKey: ["/api/intentions"] });

  const moodMutation = useMutation({
    mutationFn: (mood: number) => apiRequest("POST", "/api/moods", { mood }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      setMoodSaved(true);
      window.setTimeout(() => setMoodSaved(false), 2200);
    },
  });
  const intentionMutation = useMutation({
    mutationFn: (intention: string) => apiRequest("POST", "/api/intentions", { intention }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intentions"] });
      setIntentionSaved(true);
      setDailyIntention("");
      window.setTimeout(() => setIntentionSaved(false), 2200);
    },
  });

  useEffect(() => {
    return () => {
      nightMeditationRef.current?.pause();
    };
  }, []);

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
        current.includes(track.practiceId) ? current : [...current, track.practiceId],
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
    setCompletedPractices((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main
      className="night-map-page min-h-[calc(100dvh-4rem)] overflow-hidden"
      style={{ backgroundImage: `url(${nightMapPaperTexture})` }}
      data-testid="night-map-page"
    >
      <header className="night-map-arrival night-map-arrival--compact">
        <div className="night-map-arrival__copy">
          <div className="night-map-arrival__card">
            <div className="night-map-arrival__card-copy">
              <h1>The Descent</h1>
              <p className="night-map-deck">
                A nightly checklist for training awareness, preparing for lucid dreams, and crossing gently into sleep.
              </p>
              <a href="#night-ritual" className="night-map-text-link">Begin the descent <span aria-hidden="true">↓</span></a>
            </div>
            <div className="night-map-arrival__mirror" aria-hidden="true">
              <img src={nightMapPortal} alt="" />
            </div>
          </div>
        </div>
      </header>

      <div className="night-map-content">
        <nav className="night-map-section-nav" aria-label="The Descent sections">
          <a href="#night-ritual">01 <span>Descent</span></a>
          <a href="#night-practices">02 <span>Practice</span></a>
          <a href="#night-meditation">03 <span>Sound</span></a>
          <a href="#night-reflection">04 <span>Reflect</span></a>
          <a href="#night-sleep">05 <span>Sleep</span></a>
        </nav>

        <section id="night-ritual" className="night-map-compact-section" aria-labelledby="night-map-ritual-title">
          <div className="night-map-compact-heading">
            <div><p className="night-map-kicker">01 / Arrival</p><h2 id="night-map-ritual-title">Leave the day at the door.</h2><svg className="night-map-squiggle" viewBox="0 0 112 12" role="img" aria-label=""><path d="M2 7.5C10 1 17 11 25 6.5S40 2 48 7s15 5 23 0 15-4 22 0 12 3 17-2" /></svg></div>
             <div className="night-map-ritual-heading__aside">
               <img className="night-map-ritual-heading__bird" src={nightMapSymbolCrow} alt="" aria-hidden="true" />
               <span className="night-map-progress">{completedPractices.length}/{lucidPractices.length} complete</span>
             </div>
          </div>
          <ol className="night-map-ritual-steps">
            <li><span>01</span><div><h3>Settle</h3><p>Put the day somewhere outside yourself.</p></div></li>
            <li><span>02</span><div><h3>Notice</h3><p>Remember what is still moving through you.</p></div></li>
            <li><span>03</span><div><h3>Enter</h3><p>Let your attention soften toward sleep.</p></div></li>
          </ol>
        </section>

        <section id="night-practices" className="night-map-compact-section night-map-practices-compact" aria-labelledby="night-map-practices-title">
          <div className="night-map-compact-heading">
            <div><p className="night-map-kicker">02 / Lucid dream training</p><h2 id="night-map-practices-title">Lucid Dream Checklist</h2></div>
            <span className="night-map-progress">{completedPractices.length}/{lucidPractices.length} complete</span>
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
                  <p className="night-map-checklist-eyebrow">{practice.eyebrow}</p>
                  <h3>{practice.title}</h3>
                  <p className="night-map-checklist-description">{practice.description}</p>
                  <ol>
                    {practice.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  {(practice.id === "reality-check" || practice.id === "mild") && (
                    <a href="#night-meditation" className="night-map-checklist-link">Open meditation <span aria-hidden="true">↓</span></a>
                  )}
                  {practice.id === "intention" && (
                    <a href="#night-reflection" className="night-map-checklist-link">Set intention <span aria-hidden="true">↓</span></a>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section id="night-meditation" className="night-map-meditation-compact" data-testid="night-meditation" aria-labelledby="night-map-meditation-title">
          <div className="night-map-object-stage night-map-object-stage--relief" aria-hidden="true">
            <img src={nightMapHeaderRelief} alt="" />
          </div>
          <div className="night-map-object-stage night-map-object-stage--ivy" aria-hidden="true">
            <img src={nightMapIvy} alt="" />
          </div>
          <div className="night-map-meditation-compact__heading"><p className="night-map-kicker">03 / Meditation</p><h2 id="night-map-meditation-title">Lucid dream meditations</h2><span>Headphones recommended</span></div>
          <div className="night-map-meditation-list">
            {lucidMeditations.map((track) => {
              const isActive = activeMeditationId === track.id;
              return (
                <article className="night-map-meditation-track" key={track.id}>
                  <div className="night-map-meditation-track__heading">
                    <div><p>{track.subtitle}</p><h3>{track.title}</h3></div>
                    <span>{track.durationLabel}</span>
                  </div>
                  <div className="night-map-audio-player">
                    <button type="button" onClick={() => toggleNightMeditation(track)} className="night-map-audio-player__play" data-testid={`button-night-meditation-${track.id}`} aria-label={isActive && nightMeditationPlaying ? `Pause ${track.title}` : `Play ${track.title}`}>{isActive && nightMeditationPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
                    <div className="night-map-audio-player__track">
                      <div className="night-map-audio-player__times"><span>{isActive ? formatAudioTime(nightMeditationCurrentTime) : "0:00"}</span><span>{track.durationLabel}</span></div>
                      <input type="range" min="0" max={isActive ? nightMeditationDuration || track.durationSeconds : track.durationSeconds} step="0.1" value={isActive ? Math.min(nightMeditationCurrentTime, nightMeditationDuration || track.durationSeconds) : 0} onChange={(event) => { if (!isActive) return; const nextTime = Number(event.target.value); setNightMeditationCurrentTime(nextTime); if (nightMeditationRef.current) nightMeditationRef.current.currentTime = nextTime; }} aria-label={`${track.title} progress`} />
                    </div>
                  </div>
                  <p className="night-map-meditation-track__guidance">{track.guidance}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="night-reflection" className="night-map-reflection" aria-labelledby="night-map-reflection-title">
          <div className="night-map-compact-heading"><div><p className="night-map-kicker">04 / Reflection</p><h2 id="night-map-reflection-title">Arrive as you are.</h2></div></div>
          <div className="night-map-reflection__grid">
            <div>
              <div className="night-map-reflection__label"><Heart aria-hidden="true" /><span>How does the body feel?</span></div>
              <div className="night-map-moods">{moodOptions.map((option) => <button key={option.value} type="button" onClick={() => { setSelectedMood(option.value); moodMutation.mutate(option.value); }} className={selectedMood === option.value ? "is-selected" : ""} aria-pressed={selectedMood === option.value} data-testid={`button-mood-${option.value}`}>{option.label}</button>)}</div>
              {moodSaved && <p className="night-map-saved"><Check aria-hidden="true" /> Saved for tonight.</p>}
              {recentMoods?.length ? <p className="night-map-previous">Last check-in: {moodOptions.find((option) => option.value === recentMoods[0].mood)?.label ?? "Noted"}.</p> : null}
            </div>
            <div>
              <div className="night-map-reflection__label"><Feather aria-hidden="true" /><span>Tonight&apos;s intention</span></div>
              <Textarea value={dailyIntention} onChange={(event) => setDailyIntention(event.target.value)} placeholder="I want to remember..." className="night-map-intention" data-testid="textarea-daily-intention" />
              <div className="night-map-intention__actions"><button type="button" onClick={() => dailyIntention.trim() && intentionMutation.mutate(dailyIntention.trim())} disabled={!dailyIntention.trim() || intentionMutation.isPending} className="night-map-text-button" data-testid="button-save-intention">Save intention</button>{intentionSaved && <span className="night-map-saved"><Check aria-hidden="true" /> Saved</span>}</div>
              {recentIntentions?.length ? <p className="night-map-previous">Last intention: “{recentIntentions[0].intention}”</p> : null}
            </div>
          </div>
        </section>

        <section id="night-sleep" className="night-map-complete">
          <div className="night-map-object-stage night-map-object-stage--steps" aria-hidden="true">
            <img src={nightMapStoneSteps} alt="" />
          </div>
          <div className="night-map-complete__heading">
            <p className="night-map-kicker">05 / Sleep</p>
            <h2>{ritualComplete ? "The night is yours." : "Let the day become a dream."}</h2>
          </div>
          <button type="button" onClick={() => { setCompletedPractices(lucidPractices.map((practice) => practice.id)); setRitualComplete(true); }} className="night-map-complete__button" data-testid="button-complete-ritual">{ritualComplete ? "Ritual complete" : "Complete Tonight's Ritual"} <span aria-hidden="true">→</span></button>
        </section>
      </div>
    </main>
  );
}