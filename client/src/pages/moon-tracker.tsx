import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Check, ChevronDown, Eye, Feather, Headphones, Heart, Pause, Play, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setMeditationMediaSession } from "@/lib/meditation-media-session";
import type { MoodEntry, SleepIntention } from "@shared/schema";
import sensesInitiatedAudio from "@assets/dreamgate_meditations/senses-initiated-lucid-dream.mp3";
import thetaRealmAudio from "@assets/dreamgate_meditations/theta-realm-lucid-dreaming-rehearsal.mp3";
import descentBotanical from "@assets/descent-botanical.png";
import descentMoon from "@assets/descent-moon.jpg";
import nightMapPortal from "@assets/night-map-portal.webp";

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
];

const lucidPractices = [
  {
    id: "reality-check",
    icon: Eye,
    eyebrow: "Guided practice · 9 min",
    title: "Reality Check Meditation",
    description: "Build a small habit of checking the moment. The aim is curiosity, so the same question can appear naturally inside a dream.",
    steps: ["Pause and notice three ordinary details around you.", "Ask, “Am I dreaming?” and give yourself time to answer.", "Read a line or study your hands, look away, then check again."],
  },
  {
    id: "mild",
    icon: Sparkles,
    eyebrow: "Guided practice · 8 min",
    title: "Theta Realm Rehearsal",
    description: "Practice recognizing a dream sign without adding pressure. You are teaching attention to stay steady when the scene changes.",
    steps: ["Recall a recent dream or choose one familiar dream sign.", "Picture yourself noticing it, breathing once, and becoming lucid.", "Repeat, “When I dream tonight, I will remember that I am dreaming.”"],
  },
  {
    id: "recall",
    icon: BookOpen,
    eyebrow: "Morning practice · 3 min",
    title: "Build recall",
    description: "Lucid dreaming begins with remembering. Keep the first fragments close before the waking world takes over.",
    steps: ["Keep your eyes closed for a few breaths when you wake.", "Follow the last feeling, image, or person back through the dream.", "Write three words before you reach for your phone."],
  },
  {
    id: "intention",
    icon: Headphones,
    eyebrow: "Bedtime practice · 2 min",
    title: "Set a Dream Intention",
    description: "Give the dreaming mind one clear instruction to carry across the threshold of sleep. Keep it kind and easy to remember.",
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
  const [openPracticeId, setOpenPracticeId] = useState<string | null>("reality-check");
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

  const continueDescent = () => {
    const next = lucidPractices.find((practice) => !completedPractices.includes(practice.id));
    if (next) {
      setOpenPracticeId(next.id);
      document.getElementById(`descent-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setRitualComplete(true);
  };

  return (
    <main className="descent-page" data-testid="night-map-page">
      <header className="descent-hero">
        <img className="descent-hero__image" src={nightMapPortal} alt="A moss-covered portal opening onto a dream landscape" />
        <div className="descent-hero__veil" />
        <div className="descent-hero__copy">
          <p className="descent-brand">DreamGate</p>
          <h1>The Descent</h1>
          <p>A nightly checklist for training awareness, preparing for lucid dreams, and crossing gently into sleep.</p>
        </div>
      </header>

      <section className="descent-journey" aria-label="Lucid dream practices">
        <div className="descent-atmosphere" aria-hidden="true">
          <img className="descent-atmosphere__moon" src={descentMoon} alt="" />
          <img className="descent-atmosphere__plant" src={descentBotanical} alt="" />
        </div>
        <div className="descent-progress">
          <span>{completedPractices.length} of {lucidPractices.length} complete</span>
          <div aria-hidden="true">{lucidPractices.map((practice) => <i key={practice.id} className={completedPractices.includes(practice.id) ? "is-complete" : ""} />)}</div>
        </div>

        <div className="descent-practices">
          {lucidPractices.map((practice, index) => {
            const PracticeIcon = practice.icon;
            const isComplete = completedPractices.includes(practice.id);
            const isOpen = openPracticeId === practice.id;
            const meditation = lucidMeditations.find((track) => track.practiceId === practice.id);
            const isActive = meditation && activeMeditationId === meditation.id;
            return (
              <article id={`descent-${practice.id}`} className={`descent-practice${isOpen ? " is-open" : ""}${isComplete ? " is-complete" : ""}`} key={practice.id}>
                <span className="descent-practice__node" aria-hidden="true">{isComplete && <Check />}</span>
                <button className="descent-practice__summary" type="button" onClick={() => setOpenPracticeId(isOpen ? null : practice.id)} aria-expanded={isOpen}>
                  <span className="descent-practice__number">0{index + 1}</span>
                  <PracticeIcon aria-hidden="true" />
                  <span className="descent-practice__title"><small>{practice.eyebrow}</small><strong>{practice.title}</strong></span>
                  <ChevronDown className="descent-practice__chevron" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="descent-practice__body">
                    <p>{practice.description}</p>
                    {meditation && (
                      <div className="descent-audio">
                        <button type="button" onClick={() => toggleNightMeditation(meditation)} className="descent-audio__play" data-testid={`button-night-meditation-${meditation.id}`} aria-label={isActive && nightMeditationPlaying ? `Pause ${meditation.title}` : `Play ${meditation.title}`}>
                          {isActive && nightMeditationPlaying ? <Pause /> : <Play />}
                        </button>
                        <div className="descent-audio__track">
                          <input type="range" min="0" max={isActive ? nightMeditationDuration || meditation.durationSeconds : meditation.durationSeconds} step="0.1" value={isActive ? Math.min(nightMeditationCurrentTime, nightMeditationDuration || meditation.durationSeconds) : 0} onChange={(event) => { if (!isActive) return; const nextTime = Number(event.target.value); setNightMeditationCurrentTime(nextTime); if (nightMeditationRef.current) nightMeditationRef.current.currentTime = nextTime; }} aria-label={`${meditation.title} progress`} />
                          <span><b>{isActive ? formatAudioTime(nightMeditationCurrentTime) : "0:00"}</b><b>{meditation.durationLabel}</b></span>
                        </div>
                      </div>
                    )}
                    <ol>{practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                    {practice.id === "recall" && (
                      <div className="descent-reflection">
                        <span><Heart /> How does the body feel?</span>
                        <div className="descent-moods">{moodOptions.map((option) => <button key={option.value} type="button" onClick={() => { setSelectedMood(option.value); moodMutation.mutate(option.value); }} className={selectedMood === option.value ? "is-selected" : ""}>{option.label}</button>)}</div>
                        {moodSaved && <em><Check /> Saved for tonight</em>}
                      </div>
                    )}
                    {practice.id === "intention" && (
                      <div className="descent-reflection">
                        <span><Feather /> Tonight&apos;s intention</span>
                        <Textarea value={dailyIntention} onChange={(event) => setDailyIntention(event.target.value)} placeholder="I want to remember..." className="descent-intention" data-testid="textarea-daily-intention" />
                        <button type="button" onClick={() => dailyIntention.trim() && intentionMutation.mutate(dailyIntention.trim())} disabled={!dailyIntention.trim() || intentionMutation.isPending} className="descent-save" data-testid="button-save-intention">{intentionSaved ? "Saved" : "Save intention"}</button>
                      </div>
                    )}
                    <button type="button" className="descent-complete" onClick={() => togglePractice(practice.id)} data-testid={`button-practice-${practice.id}`}>
                      <span>{isComplete && <Check />}</span>{isComplete ? "Completed" : "Mark as complete"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <button type="button" className="descent-continue" onClick={continueDescent} data-testid="button-complete-ritual">
          {completedPractices.length === lucidPractices.length ? (ritualComplete ? "The night is yours" : "Complete the Descent") : "Continue the Descent"}<span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}
