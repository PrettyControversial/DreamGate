import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  defaultLunarNotificationPreferences, defaultDreamReminderPreferences, activateLunarNotificationUser,
  deactivateLunarNotificationUser, disableLunarNotifications, enableLunarNotifications,
  loadLunarNotificationPreferences, loadDreamReminderPreferences, saveLunarNotificationPreferences,
  supportsLunarNotifications, syncLunarNotifications, syncDreamReminders, updateDreamReminders,
  type DreamReminderPreferences, type LunarNotificationPreferences,
} from "@/lib/lunar-notifications";

const options: Array<{ key: keyof Pick<LunarNotificationPreferences, "newMoons" | "fullMoons" | "eclipses">; label: string }> = [
  { key: "newMoons", label: "New moons" }, { key: "fullMoons", label: "Full moons" }, { key: "eclipses", label: "Eclipses" },
];

export function LunarNotificationSettings() {
  const { toast } = useToast();
  const { user } = useUser();
  const [preferences, setPreferences] = useState(defaultLunarNotificationPreferences);
  const [dreamReminders, setDreamReminders] = useState(defaultDreamReminderPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const isNative = supportsLunarNotifications();

  useEffect(() => {
    if (!user?.id) return;
    void loadLunarNotificationPreferences(user.id).then(setPreferences);
    void loadDreamReminderPreferences(user.id).then(setDreamReminders);
  }, [user?.id]);

  const updatePreference = (key: "newMoons" | "fullMoons" | "eclipses", checked: boolean) => setPreferences((current) => ({ ...current, [key]: checked }));
  const updateDreamReminder = <Key extends keyof DreamReminderPreferences>(key: Key, value: DreamReminderPreferences[Key]) => setDreamReminders((current) => ({ ...current, [key]: value }));
  const selected = preferences.newMoons || preferences.fullMoons || preferences.eclipses;

  const save = async () => {
    setIsSaving(true);
    try {
      const { preferences: enabled, count } = await enableLunarNotifications(user?.id ?? "", preferences);
      setPreferences(enabled);
      toast({ title: "Lunar notifications are on", description: `${count} upcoming moon and eclipse reminders scheduled.` });
    } catch (error) {
      toast({ title: "Notifications unavailable", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };
  const turnOff = async () => {
    setIsSaving(true);
    try {
      if (!user?.id) return;
      await disableLunarNotifications(user.id);
      setPreferences((current) => ({ ...current, enabled: false }));
      toast({ title: "Lunar notifications are off" });
    } finally { setIsSaving(false); }
  };
  const saveDreamReminderSettings = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { preferences: updated, count } = await updateDreamReminders(user.id, dreamReminders);
      setDreamReminders(updated);
      toast({ title: count > 0 ? "Dream reminders are set" : "Dream reminders are off", description: count > 0 ? `${count} daily ${count === 1 ? "reminder" : "reminders"} scheduled in your local time.` : "Morning and evening reminders have been cleared." });
    } catch (error) {
      toast({ title: "Dream reminders unavailable", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-[#0e0c06] bg-transparent dark:border-[#f6f3ec]">
        <CardHeader className="px-4 pb-2 pt-4 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <BellRing className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Daily practice</p>
              <CardTitle className="mt-1 font-display text-xl">Dream journal reminders</CardTitle>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">A gentle cue at waking and before sleep.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5">
          <div className="divide-y divide-current border-y border-current">
            <ReminderRow label="Morning journal" description="Record what remains." time={dreamReminders.morningTime} enabled={dreamReminders.morningEnabled} onTimeChange={(value) => updateDreamReminder("morningTime", value)} onEnabledChange={(value) => updateDreamReminder("morningEnabled", value)} disabled={isSaving} />
            <ReminderRow label="Evening intention" description="Set a thought down for sleep." time={dreamReminders.eveningTime} enabled={dreamReminders.eveningEnabled} onTimeChange={(value) => updateDreamReminder("eveningTime", value)} onEnabledChange={(value) => updateDreamReminder("eveningEnabled", value)} disabled={isSaving} />
          </div>
          {!isNative && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Available in the installed iPhone app.</p>}
          <Button type="button" size="sm" onClick={saveDreamReminderSettings} disabled={isSaving || !isNative || !user?.id} className="home-capsule-button home-capsule-button--solid no-default-hover-elevate no-default-active-elevate mt-4 w-full sm:w-auto">Save dream reminders</Button>
        </CardContent>
      </Card>

      <Card className="border-[#0e0c06] bg-transparent dark:border-[#f6f3ec]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div><h2 className="font-display text-xl">Lunar dream reminders</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Reflect when the moon shifts.</p></div>
          </div>
          <div className="mt-3 divide-y divide-current border-y border-current">
            {options.map((option) => <div key={option.key} className="flex min-w-0 items-center justify-between gap-3 py-2"><p className="min-w-0 text-sm font-medium">{option.label}</p><Button type="button" size="sm" variant={preferences[option.key] ? "default" : "outline"} aria-pressed={preferences[option.key]} onClick={() => updatePreference(option.key, !preferences[option.key])} disabled={isSaving} aria-label={`${preferences[option.key] ? "Disable" : "Enable"} ${option.label.toLowerCase()} notifications`} className={`home-capsule-button no-default-hover-elevate no-default-active-elevate h-11 min-w-[4rem] shrink-0 ${preferences[option.key] ? "home-capsule-button--solid" : "home-capsule-button--outline"}`}>{preferences[option.key] ? "On" : "Off"}</Button></div>)}
          </div>
          {!isNative && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Available in the installed iPhone app.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={save} disabled={isSaving || !selected || !isNative || !user?.id} className="home-capsule-button home-capsule-button--solid no-default-hover-elevate no-default-active-elevate"> {preferences.enabled ? "Update reminders" : "Allow notifications"} </Button>
            {preferences.enabled && <Button type="button" size="sm" variant="outline" onClick={turnOff} disabled={isSaving} className="home-capsule-button home-capsule-button--outline no-default-hover-elevate no-default-active-elevate">Turn off</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReminderRow({ label, description, time, enabled, onTimeChange, onEnabledChange, disabled }: { label: string; description: string; time: string; enabled: boolean; onTimeChange: (value: string) => void; onEnabledChange: (checked: boolean) => void; disabled: boolean }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 py-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.5rem_4rem]"><div className="min-w-0"><p className="text-sm font-semibold">{label}</p><p className="break-words text-xs leading-snug text-muted-foreground">{description}</p></div><Input type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} disabled={disabled} className="home-capsule-input col-span-1 h-11 w-[7.5rem] max-w-full max-[389px]:row-start-2" aria-label={`${label} reminder time`} /><Button type="button" size="sm" variant={enabled ? "default" : "outline"} aria-pressed={enabled} onClick={() => onEnabledChange(!enabled)} disabled={disabled} aria-label={`${enabled ? "Disable" : "Enable"} ${label.toLowerCase()} reminder`} className={`home-capsule-button no-default-hover-elevate no-default-active-elevate h-11 min-w-[4rem] shrink-0 max-[389px]:row-start-2 ${enabled ? "home-capsule-button--solid" : "home-capsule-button--outline"}`}>{enabled ? "On" : "Off"}</Button></div>;
}

export function LunarNotificationSync() {
  const { user } = useUser();
  useEffect(() => {
    if (!supportsLunarNotifications() || !user?.id) return;
    const userId = user.id;
    void activateLunarNotificationUser(userId).then(async () => {
      const preferences = await loadLunarNotificationPreferences(userId);
      if (preferences.enabled) { await saveLunarNotificationPreferences(userId, preferences); await syncLunarNotifications(userId, preferences); }
      const dreamReminders = await loadDreamReminderPreferences(userId);
      if (dreamReminders.morningEnabled || dreamReminders.eveningEnabled) await syncDreamReminders(userId, dreamReminders);
    });
    return () => { void deactivateLunarNotificationUser(userId); };
  }, [user?.id]);
  return null;
}