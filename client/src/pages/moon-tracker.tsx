import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Check, CheckCircle2, Eye, Feather, Heart, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MoodEntry, SleepIntention } from "@shared/schema";
import nightMeditationAudio from "@assets/dreamgate_meditations/432hz-meditation.mp3";
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

const lucidPractices = [
  {
    id: "reality-check",
    icon: Eye,
    eyebrow: "Daytime practice · 2 min",
    title: "Reality checks",
    description: "Teach your attention to question the moment gently, so the habit can follow you into a dream.",
    steps: ["Pause and notice three details around you.", "Ask: “Am I dreaming?” without rushing the answer.", "Read a line of text or look at your hands, then look away and back."],
  },
  {
    id: "mild",
    icon: Sparkles,
    eyebrow: "Bedtime practice · 5 min",
    title: "Set the dream cue",
    description: "Use a quiet intention to recognize the dream when it begins to shift.",
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
];

export default function MoonTracker() {
  const [activePractice, setActivePractice] = useState(lucidPractices[0].id);
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [dailyIntention, setDailyIntention] = useState("");
  const [moodSaved, setMoodSaved] = useState(false);
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [nightMeditationPlaying, setNightMeditationPlaying] = useState(false);
  const [nightMeditationCurrentTime, setNightMeditationCurrentTime] = useState(0);
  const [nightMeditationDuration, setNightMeditationDuration] = useState(309);
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

  const toggleNightMeditation = () => {
    const activeAudio = nightMeditationRef.current;
    if (activeAudio) {
      if (nightMeditationPlaying) {
        activeAudio.pause();
        setNightMeditationPlaying(false);
      } else {
        void activeAudio.play().then(() => setNightMeditationPlaying(true)).catch(() => setNightMeditationPlaying(false));
      }
      return;
    }

    const audio = new Audio(nightMeditationAudio);
    audio.preload = "metadata";
    audio.ontimeupdate = () => setNightMeditationCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => setNightMeditationDuration(Number.isFinite(audio.duration) ? audio.duration : 309);
    audio.onended = () => {
      nightMeditationRef.current = null;
      setNightMeditationPlaying(false);
      setNightMeditationCurrentTime(0);
    };
    audio.onerror = () => {
      nightMeditationRef.current = null;
      setNightMeditationPlaying(false);
    };
    nightMeditationRef.current = audio;
    setNightMeditationPlaying(true);
    void audio.play().catch(() => {
      nightMeditationRef.current = null;
      setNightMeditationPlaying(false);
    });
  };

  const formatAudioTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const selectedPractice = lucidPractices.find((practice) => practice.id === activePractice) ?? lucidPractices[0];
  const practiceIndex = lucidPractices.findIndex((practice) => practice.id === selectedPractice.id);
  const SelectedPracticeIcon = selectedPractice.icon;
  const togglePractice = (id: string) =>
    setCompletedPractices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

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
              <h1>Turn inward.<br />The dream is waiting.</h1>
              <p className="night-map-deck">
                A quiet place to settle, remember, and cross gently into sleep.
              </p>
              <a href="#night-ritual" className="night-map-text-link">Begin tonight&apos;s ritual <span aria-hidden="true">↓</span></a>
            </div>
            <div className="night-map-arrival__mirror" aria-hidden="true">
              <img src={nightMapPortal} alt="" />
            </div>
          </div>
        </div>
      </header>

      <div className="night-map-content">
        <nav className="night-map-section-nav" aria-label="Night Map sections">
          <a href="#night-ritual">01 <span>Descent</span></a>
          <a href="#night-practices">02 <span>Practice</span></a>
          <a href="#night-meditation">03 <span>Sound</span></a>
          <a href="#night-reflection">04 <span>Reflect</span></a>
          <a href="#night-sleep">05 <span>Sleep</span></a>
        </nav>

        <section id="night-ritual" className="night-map-compact-section" aria-labelledby="night-map-ritual-title">
          <div className="night-map-compact-heading">
            <div><p className="night-map-kicker">01 / The descent</p><h2 id="night-map-ritual-title">Leave the day at the door.</h2><svg className="night-map-squiggle" viewBox="0 0 112 12" role="img" aria-label=""><path d="M2 7.5C10 1 17 11 25 6.5S40 2 48 7s15 5 23 0 15-4 22 0 12 3 17-2" /></svg></div>
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
            <div><p className="night-map-kicker">02 / Night practices</p><h2 id="night-map-practices-title">Choose one to begin.</h2></div>
            <span className="night-map-progress">No pressure, just repetition.</span>
          </div>
          <div className="night-map-practice-index-column">
            <nav className="night-map-practice-index" aria-label="Choose a night practice">
              {lucidPractices.map((practice, index) => {
                const isActive = selectedPractice.id === practice.id;
                const isComplete = completedPractices.includes(practice.id);
                return (
                  <button key={practice.id} type="button" onClick={() => setActivePractice(practice.id)} className={isActive ? "is-active" : ""} aria-pressed={isActive} data-testid={`button-practice-${practice.id}`}>
                    <span>0{index + 1}</span><strong>{practice.title}</strong>{isComplete && <CheckCircle2 aria-label="Completed" />}
                  </button>
                );
              })}
            </nav>
          </div>
          <article className="night-map-practice-detail">
            <div className="night-map-practice-detail__title"><SelectedPracticeIcon aria-hidden="true" /><div><p>{selectedPractice.eyebrow}</p><h3>{selectedPractice.title}</h3></div></div>
            <p className="night-map-practice-detail__description">{selectedPractice.description}</p>
            <ol>{selectedPractice.steps.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}</ol>
            <button type="button" onClick={() => togglePractice(selectedPractice.id)} className="night-map-text-button" data-testid="button-complete-practice"><Check aria-hidden="true" />{completedPractices.includes(selectedPractice.id) ? "Practice complete" : "Mark as practiced"}</button>
            <p className="night-map-practice-detail__count">Practice {practiceIndex + 1} of {lucidPractices.length}</p>
          </article>
        </section>

        <section id="night-meditation" className="night-map-meditation-compact" data-testid="night-meditation" aria-labelledby="night-map-meditation-title">
          <div className="night-map-object-stage night-map-object-stage--relief" aria-hidden="true">
            <img src={nightMapHeaderRelief} alt="" />
          </div>
          <div className="night-map-object-stage night-map-object-stage--ivy" aria-hidden="true">
            <img src={nightMapIvy} alt="" />
          </div>
          <div className="night-map-meditation-compact__heading"><p className="night-map-kicker">03 / Sound healing</p><h2 id="night-map-meditation-title">Dream meditation</h2><span>5 min · 432 Hz</span></div>
          <div className="night-map-audio-player">
            <button type="button" onClick={toggleNightMeditation} className="night-map-audio-player__play" data-testid="button-night-meditation" aria-label={nightMeditationPlaying ? "Pause meditation" : "Play meditation"}>{nightMeditationPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
            <div className="night-map-audio-player__track">
              <div className="night-map-audio-player__times"><span>{formatAudioTime(nightMeditationCurrentTime)}</span><span>{formatAudioTime(nightMeditationDuration)}</span></div>
              <input type="range" min="0" max={nightMeditationDuration || 309} step="0.1" value={Math.min(nightMeditationCurrentTime, nightMeditationDuration)} onChange={(event) => { const nextTime = Number(event.target.value); setNightMeditationCurrentTime(nextTime); if (nightMeditationRef.current) nightMeditationRef.current.currentTime = nextTime; }} aria-label="Meditation progress" />
            </div>
          </div>
          <details className="night-map-details"><summary>What to listen for</summary><p>Let your weight settle, soften the edges of the day, and keep one small thread of awareness as you rest.</p></details>
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