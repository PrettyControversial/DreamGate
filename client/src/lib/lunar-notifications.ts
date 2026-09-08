import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { lunarEventSchema, type LunarEvent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const PREFERENCES_KEY = "dreamgate-lunar-notifications-v1";
const SCHEDULED_IDS_KEY = "dreamgate-lunar-notification-ids-v1";
const ACTIVE_USER_KEY = "dreamgate-lunar-notification-active-user-v1";
const DREAM_REMINDER_PREFERENCES_KEY = "dreamgate-daily-reminders-v1";
const DREAM_REMINDER_IDS_KEY = "dreamgate-daily-reminder-ids-v1";

const preferenceKey = (userId: string) => `${PREFERENCES_KEY}:${userId}`;
const scheduledIdsKey = (userId: string) => `${SCHEDULED_IDS_KEY}:${userId}`;
const dreamReminderPreferenceKey = (userId: string) =>
  `${DREAM_REMINDER_PREFERENCES_KEY}:${userId}`;
const dreamReminderIdsKey = (userId: string) =>
  `${DREAM_REMINDER_IDS_KEY}:${userId}`;

export interface LunarNotificationPreferences {
  enabled: boolean;
  newMoons: boolean;
  fullMoons: boolean;
  eclipses: boolean;
}

export const defaultLunarNotificationPreferences: LunarNotificationPreferences = {
  enabled: false,
  newMoons: true,
  fullMoons: true,
  eclipses: true,
};

export interface DreamReminderPreferences {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  timezone: string;
}

export const defaultDreamReminderPreferences: DreamReminderPreferences = {
  morningEnabled: false,
  morningTime: "07:30",
  eveningEnabled: false,
  eveningTime: "21:30",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
};

export function supportsLunarNotifications() {
  return Capacitor.isNativePlatform();
}

export async function loadDreamReminderPreferences(userId: string) {
  const { value } = await Preferences.get({
    key: dreamReminderPreferenceKey(userId),
  });
  if (!value) return defaultDreamReminderPreferences;

  try {
    return {
      ...defaultDreamReminderPreferences,
      ...JSON.parse(value),
    } as DreamReminderPreferences;
  } catch {
    return defaultDreamReminderPreferences;
  }
}

export async function saveDreamReminderPreferences(
  userId: string,
  preferences: DreamReminderPreferences,
) {
  await Preferences.set({
    key: dreamReminderPreferenceKey(userId),
    value: JSON.stringify(preferences),
  });
}

export async function loadLunarNotificationPreferences(userId: string) {
  const { value } = await Preferences.get({ key: preferenceKey(userId) });
  if (!value) return defaultLunarNotificationPreferences;

  try {
    return {
      ...defaultLunarNotificationPreferences,
      ...JSON.parse(value),
    } as LunarNotificationPreferences;
  } catch {
    return defaultLunarNotificationPreferences;
  }
}

export async function saveLunarNotificationPreferences(
  userId: string,
  preferences: LunarNotificationPreferences,
) {
  await Preferences.set({
    key: preferenceKey(userId),
    value: JSON.stringify(preferences),
  });
}

function stableNotificationId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) || 1;
}

function notificationId(userId: string, event: LunarEvent) {
  return stableNotificationId(`${userId}-${event.date}-${event.type}`);
}

function eventDate(event: LunarEvent) {
  return new Date(event.instant);
}

function eventMessage(event: LunarEvent) {
  if (event.type === "solar_eclipse") {
    return {
      title: "Solar eclipse: a threshold moment",
      body: "What is ready to be seen differently? Record tonight’s dreams and notice what asks to begin.",
    };
  }
  if (event.type === "lunar_eclipse") {
    return {
      title: "Lunar eclipse: listen closely",
      body: "What feeling or pattern is ready to be released? Keep your dream journal close tonight.",
    };
  }
  if (event.type === "new_moon") {
    return {
      title: "New moon dream invitation",
      body: "What do you want to plant in the dark? Write one question for your dreams before sleep.",
    };
  }
  return {
    title: "Full moon dream reflection",
    body: "What has come into focus lately? Record your dreams and notice what is asking to be acknowledged.",
  };
}

function shouldSchedule(
  event: LunarEvent,
  preferences: LunarNotificationPreferences,
) {
  if (event.type === "new_moon") return preferences.newMoons;
  if (event.type === "full_moon") return preferences.fullMoons;
  return preferences.eclipses;
}

async function clearScheduledNotifications(userId: string) {
  const key = scheduledIdsKey(userId);
  const { value } = await Preferences.get({ key });
  let ids: number[] = [];
  try {
    ids = value ? JSON.parse(value) : [];
  } catch {
    ids = [];
  }
  if (ids.length > 0) {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  }
  await Preferences.remove({ key });
}

async function clearScheduledDreamReminders(userId: string) {
  const key = dreamReminderIdsKey(userId);
  const { value } = await Preferences.get({ key });
  let ids: number[] = [];
  try {
    ids = value ? JSON.parse(value) : [];
  } catch {
    ids = [];
  }
  if (ids.length > 0) {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  }
  await Preferences.remove({ key });
}

export async function activateLunarNotificationUser(userId: string) {
  const { value: previousUserId } = await Preferences.get({
    key: ACTIVE_USER_KEY,
  });
  if (previousUserId && previousUserId !== userId) {
    await clearScheduledNotifications(previousUserId);
    await clearScheduledDreamReminders(previousUserId);
  }
  await Preferences.set({ key: ACTIVE_USER_KEY, value: userId });
}

export async function deactivateLunarNotificationUser(userId: string) {
  await clearScheduledNotifications(userId);
  await clearScheduledDreamReminders(userId);
  const { value: activeUserId } = await Preferences.get({
    key: ACTIVE_USER_KEY,
  });
  if (activeUserId === userId) {
    await Preferences.remove({ key: ACTIVE_USER_KEY });
  }
}

function parseReminderTime(value: string) {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw new Error("Choose a valid reminder time.");
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export async function syncDreamReminders(
  userId: string,
  preferences?: DreamReminderPreferences,
) {
  const selected =
    preferences ?? (await loadDreamReminderPreferences(userId));
  if (!supportsLunarNotifications()) return 0;

  await clearScheduledDreamReminders(userId);
  if (!selected.morningEnabled && !selected.eveningEnabled) return 0;

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return 0;

  const notifications = [];
  if (selected.morningEnabled) {
    const { hour, minute } = parseReminderTime(selected.morningTime);
    notifications.push({
      id: stableNotificationId(`${userId}-morning-dream-journal`),
      title: "What did you dream?",
      body: "Take a quiet moment to record what remains from last night.",
      schedule: {
        on: { hour, minute },
        allowWhileIdle: true,
      },
      sound: "default",
      extra: { reminder: "morning_dream_journal", route: "/decoder" },
    });
  }
  if (selected.eveningEnabled) {
    const { hour, minute } = parseReminderTime(selected.eveningTime);
    notifications.push({
      id: stableNotificationId(`${userId}-evening-sleep-intention`),
      title: "Set an intention for sleep",
      body: "Choose one question or feeling to carry gently into your dreams.",
      schedule: {
        on: { hour, minute },
        allowWhileIdle: true,
      },
      sound: "default",
      extra: { reminder: "evening_sleep_intention", route: "/night-map" },
    });
  }

  await LocalNotifications.schedule({ notifications });
  await Preferences.set({
    key: dreamReminderIdsKey(userId),
    value: JSON.stringify(notifications.map(({ id }) => id)),
  });
  return notifications.length;
}

export async function updateDreamReminders(
  userId: string,
  preferences: DreamReminderPreferences,
) {
  if (!supportsLunarNotifications()) {
    throw new Error("Dream reminders are available in the installed mobile app.");
  }

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  const updated = { ...preferences, timezone };
  const hasEnabledReminder =
    updated.morningEnabled || updated.eveningEnabled;

  if (hasEnabledReminder) {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") {
      throw new Error(
        "Notification permission is off. Enable notifications in your iPhone settings and try again.",
      );
    }
  }

  await activateLunarNotificationUser(userId);
  await saveDreamReminderPreferences(userId, updated);
  const count = await syncDreamReminders(userId, updated);
  return { preferences: updated, count };
}

export async function disableLunarNotifications(userId: string) {
  await clearScheduledNotifications(userId);
  await saveLunarNotificationPreferences(userId, {
    ...(await loadLunarNotificationPreferences(userId)),
    enabled: false,
  });
}

export async function syncLunarNotifications(
  userId: string,
  preferences?: LunarNotificationPreferences,
) {
  const selected =
    preferences ?? (await loadLunarNotificationPreferences(userId));
  if (!supportsLunarNotifications() || !selected.enabled) return 0;

  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() + 1];
  const responses = await Promise.all(
    years.map((year) => apiRequest("GET", `/api/lunar-events?year=${year}`)),
  );
  const payloads: unknown[] = await Promise.all(
    responses.map((response) => response.json()),
  );
  const events = payloads.flatMap((payload) => {
    const parsed = lunarEventSchema.array().safeParse(payload);
    if (!parsed.success) {
      throw new Error("The lunar event service returned an unreadable response.");
    }
    return parsed.data;
  });

  const uniqueEvents = Array.from(
    new Map(events.map((event) => [`${event.date}-${event.type}`, event])).values(),
  );
  const enabledEvents = uniqueEvents
    .filter((event) => shouldSchedule(event, selected))
    .filter((event) => eventDate(event) > now);
  const eclipseDates = new Set(
    enabledEvents
      .filter(
        (event) =>
          event.type === "solar_eclipse" || event.type === "lunar_eclipse",
      )
      .map((event) => event.date),
  );
  const upcoming = enabledEvents
    .filter(
      (event) =>
        !(
          (event.type === "new_moon" || event.type === "full_moon") &&
          eclipseDates.has(event.date)
        ),
    )
    .map((event) => ({ event, at: eventDate(event) }))
    .filter(({ at }) => Number.isFinite(at.getTime()))
    .sort((left, right) => left.at.getTime() - right.at.getTime())
    .slice(0, 60);

  await clearScheduledNotifications(userId);
  if (upcoming.length === 0) return 0;

  const notifications = upcoming.map(({ event, at }) => ({
    id: notificationId(userId, event),
    ...eventMessage(event),
    schedule: { at, allowWhileIdle: true },
    sound: "default",
    extra: { lunarEvent: event.type, date: event.date },
  }));

  await LocalNotifications.schedule({ notifications });
  await Preferences.set({
    key: scheduledIdsKey(userId),
    value: JSON.stringify(notifications.map(({ id }) => id)),
  });
  return notifications.length;
}

export async function enableLunarNotifications(
  userId: string,
  preferences: LunarNotificationPreferences,
) {
  if (!supportsLunarNotifications()) {
    throw new Error("Lunar notifications are available in the installed mobile app.");
  }

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const enabledPreferences = { ...preferences, enabled: true };
  await activateLunarNotificationUser(userId);
  await saveLunarNotificationPreferences(userId, enabledPreferences);
  const count = await syncLunarNotifications(userId, enabledPreferences);
  return { preferences: enabledPreferences, count };
}