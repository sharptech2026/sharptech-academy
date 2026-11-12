import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseId } from "@/lib/curriculum";
import { todayKey, yesterdayKey } from "@/lib/dates";
import { checkAchievements, getNewAchievements, type AchievementId } from "@/lib/achievements";
import { generateCertificate, saveCertificate, hasCertificate } from "@/lib/certificates";
import { markChallengeCompleted, getDailyChallenge } from "@/lib/daily-challenges";
import { getCourse, courseLessons } from "@/lib/curriculum";
import {
  getProgress,
  upsertProgress,
  getCertificates,
  saveCertificate as saveCertServer,
  getDailyChallenges,
  markDailyChallenge,
  resetProgressServer,
} from "@/routes/api/progress";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export type LessonRecord = {
  correct: number;
  total: number;
  perfect: boolean;
};

export type ThemeId = "claro" | "noite" | "papel";

type ServerProgress = {
  name: string;
  onboarded: boolean;
  courseId: CourseId;
  xp: number;
  dailyXp: number;
  dailyDate: string;
  goal: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  hearts: number;
  heartsDate: string;
  sound: boolean;
  theme: ThemeId;
  practiced: Record<string, boolean>;
  completed: Record<string, LessonRecord>;
  mistakes: string[];
  answered: number;
  correctAnswers: number;
  activeDays: string[];
  pendingTrain: boolean;
  unlockedAchievements: AchievementId[];
  lastAchievementCheck: Record<string, boolean>;
};

type State = {
  name: string;
  onboarded: boolean;
  courseId: CourseId;
  xp: number;
  dailyXp: number;
  dailyDate: string;
  goal: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  hearts: number;
  heartsDate: string;
  sound: boolean;
  theme: ThemeId;
  practiced: Record<string, boolean>;
  completed: Record<string, LessonRecord>;
  mistakes: string[];
  answered: number;
  correctAnswers: number;
  activeDays: string[];
  pendingTrain: boolean;
  unlockedAchievements: AchievementId[];
  lastAchievementCheck: Record<string, boolean>;
  // Auth integration
  isAuthenticated: boolean;
  syncing: boolean;
  setAuthState: (authenticated: boolean) => void;
  rollDay: () => void;
  finishOnboarding: (name: string, courseId: CourseId) => void;
  setCourse: (courseId: CourseId) => void;
  setName: (name: string) => void;
  setGoal: (goal: number) => void;
  toggleSound: () => void;
  setTheme: (theme: ThemeId) => void;
  markPractice: (lessonId: string) => number;
  recordAnswer: (key: string, ok: boolean, costHeart: boolean) => void;
  completeLesson: (lessonId: string, correct: number, total: number) => Promise<number>;
  finishTrain: (correct: number) => number;
  requestTrain: () => void;
  consumeTrain: () => void;
  resetProgress: () => Promise<void>;
  checkAndUnlockAchievements: () => AchievementId[];
  completeDailyChallenge: () => Promise<{ xp: number; bonus: boolean } | null>;
  // Server sync
  syncFromServer: () => Promise<void>;
  syncToServer: (partial?: Partial<State>) => Promise<void>;
};

const initial = {
  name: "",
  onboarded: false,
  courseId: "js" as CourseId,
  xp: 0,
  dailyXp: 0,
  dailyDate: "",
  goal: 40,
  streak: 0,
  bestStreak: 0,
  lastActive: null as string | null,
  hearts: 5,
  heartsDate: "",
  sound: true,
  theme: "claro" as ThemeId,
  practiced: {} as Record<string, boolean>,
  completed: {} as Record<string, LessonRecord>,
  mistakes: [] as string[],
  answered: 0,
  correctAnswers: 0,
  activeDays: [] as string[],
  pendingTrain: false,
  unlockedAchievements: [] as AchievementId[],
  lastAchievementCheck: {} as Record<string, boolean>,
  isAuthenticated: false,
  syncing: false,
};

function withActivity(
  state: Pick<State, "streak" | "bestStreak" | "lastActive" | "activeDays" | "dailyXp" | "dailyDate" | "xp">,
  gained: number,
) {
  const today = todayKey();
  let streak = state.streak;
  let lastActive = state.lastActive;
  let bestStreak = state.bestStreak;
  const activeDays = state.activeDays.slice();
  if (lastActive !== today) {
    streak = lastActive === yesterdayKey() ? streak + 1 : 1;
    lastActive = today;
    bestStreak = Math.max(bestStreak, streak);
    if (!activeDays.includes(today)) activeDays.push(today);
  }
  return {
    xp: state.xp + gained,
    dailyXp: state.dailyDate === today ? state.dailyXp + gained : gained,
    dailyDate: today,
    streak,
    bestStreak,
    lastActive,
    activeDays: activeDays.slice(-60),
  };
}

function getPersistedState() {
  try {
    const stored = localStorage.getItem("sharptech-academy-v1");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state;
    }
  } catch {}
  return null;
}

export const useProgress = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setAuthState: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
      rollDay: () => {
        const state = get();
        const today = todayKey();
        const patch: Partial<State> = {};
        if (state.heartsDate !== today) {
          patch.hearts = 5;
          patch.heartsDate = today;
        }
        if (state.dailyDate !== today) {
          patch.dailyXp = 0;
          patch.dailyDate = today;
        }
        if (state.lastActive && state.lastActive < yesterdayKey() && state.streak !== 0) {
          patch.streak = 0;
        }
        if (Object.keys(patch).length > 0) set(patch);
      },
      finishOnboarding: (name, courseId) => set({ name: name.trim(), courseId, onboarded: true }),
      setCourse: (courseId) => set({ courseId }),
      setName: (name) => set({ name: name.trim() }),
      setGoal: (goal) => set({ goal }),
      toggleSound: () => set({ sound: !get().sound }),
      setTheme: (theme) => set({ theme }),
      markPractice: (lessonId) => {
        const state = get();
        if (state.practiced[lessonId]) return 0;
        const gained = 12;
        set({
          ...withActivity(state, gained),
          practiced: { ...state.practiced, [lessonId]: true },
        });
        return gained;
      },
      recordAnswer: (key, ok, costHeart) => {
        const state = get();
        const mistakes = state.mistakes.filter((item) => item !== key);
        if (!ok) mistakes.unshift(key);
        set({
          answered: state.answered + 1,
          correctAnswers: state.correctAnswers + (ok ? 1 : 0),
          hearts: costHeart && !ok ? Math.max(0, state.hearts - 1) : state.hearts,
          mistakes: mistakes.slice(0, 40),
        });
      },
      completeLesson: async (lessonId, correct, total) => {
        const state = get();
        const perfect = total > 0 && correct === total;
        const prev = state.completed[lessonId];
        const gained = prev ? correct * 3 : correct * 10 + (perfect ? 15 : 0);
        const newState = {
          ...withActivity(state, gained),
          hearts: Math.min(5, state.hearts + 1),
          completed: {
            ...state.completed,
            [lessonId]: {
              correct: Math.max(prev?.correct ?? 0, correct),
              total,
              perfect: Boolean(prev?.perfect) || perfect,
            },
          },
        };
        set(newState);

        const course = getCourse(state.courseId);
        if (course) {
          const lessons = courseLessons(course);
          const done = lessons.filter((l) => newState.completed[l.id]).length;
          const required = course.id === "js" ? 12 : course.id === "web" || course.id === "sql" ? 6 : 9;
          if (done >= required && !hasCertificate(course.id)) {
            const cert = generateCertificate(course.id, state.name, {
              xp: newState.xp,
              completed: newState.completed,
              streak: newState.streak,
            });
            saveCertificate(cert);
          }
        }

        setTimeout(() => {
          useProgress.getState().checkAndUnlockAchievements();
        }, 0);

        // Sync to server if authenticated
        if (state.isAuthenticated) {
          get().syncToServer(newState);
        }

        return gained;
      },
      finishTrain: (correct) => {
        const state = get();
        const gained = correct * 6;
        const today = todayKey();
        set({
          ...withActivity(state, gained),
          hearts: 5,
          heartsDate: today,
        });
        return gained;
      },
      requestTrain: () => set({ pendingTrain: true }),
      consumeTrain: () => set({ pendingTrain: false }),
      resetProgress: async () => {
        const state = get();
        set({
          ...initial,
          name: state.name,
          courseId: state.courseId,
          sound: state.sound,
          theme: state.theme,
          onboarded: true,
          unlockedAchievements: [],
          lastAchievementCheck: {},
        });
        if (state.isAuthenticated) {
          try {
            await resetProgressServer();
          } catch (e) {
            console.error("Failed to reset server progress:", e);
          }
        }
      },
      checkAndUnlockAchievements: () => {
        const state = get();
        const achievementState = {
          completed: state.completed,
          streak: state.streak,
          bestStreak: state.bestStreak,
          xp: state.xp,
          dailyXp: state.dailyXp,
          dailyDate: state.dailyDate,
          activeDays: state.activeDays,
          hearts: state.hearts,
          mistakes: state.mistakes,
          answered: state.answered,
          correctAnswers: state.correctAnswers,
          courseId: state.courseId,
          practiced: state.practiced,
          lastActive: state.lastActive,
        };
        const newAchievements = getNewAchievements(state.lastAchievementCheck, achievementState);
        if (newAchievements.length > 0) {
          const newIds = newAchievements.map((a) => a.id);
          set({
            unlockedAchievements: [...state.unlockedAchievements, ...newIds],
            lastAchievementCheck: { ...state.lastAchievementCheck, ...Object.fromEntries(newIds.map((id) => [id, true])) },
          });
          return newIds;
        }
        return [];
      },
      completeDailyChallenge: async () => {
        const state = get();
        const challenge = getDailyChallenge();
        const completed = JSON.parse(localStorage.getItem("sharptech-daily-challenges") || "[]");
        if (completed.includes(challenge.id)) return null;

        markChallengeCompleted(challenge.id);
        const bonus = true;
        const gained = challenge.xpReward + (bonus ? challenge.bonusXp : 0);

        const today = todayKey();
        const newActiveDays = state.activeDays.includes(today) ? state.activeDays : [...state.activeDays, today];
        const streak = state.lastActive === yesterdayKey() ? state.streak + 1 : 1;
        const bestStreak = Math.max(state.bestStreak, streak);

        const newState = {
          xp: state.xp + gained,
          dailyXp: state.dailyDate === today ? state.dailyXp + gained : gained,
          dailyDate: today,
          streak,
          bestStreak,
          lastActive: today,
          activeDays: newActiveDays.slice(-60),
          hearts: Math.min(5, state.hearts + 1),
        };
        set(newState);

        // Sync to server if authenticated
        if (state.isAuthenticated) {
          get().syncToServer(newState);
          try {
            await markDailyChallenge({ challengeId: challenge.id, xpEarned: gained, bonus } as unknown as Parameters<typeof markDailyChallenge>[0]);
          } catch (e) {
            console.error("Failed to mark daily challenge on server:", e);
          }
        }

        return { xp: gained, bonus };
      },
      syncFromServer: async () => {
        const state = get();
        if (!state.isAuthenticated || state.syncing) return;
        set({ syncing: true });
        try {
          const serverProgress = (await getProgress()) as ServerProgress | null;
          if (serverProgress) {
            set({
              name: serverProgress.name,
              onboarded: serverProgress.onboarded,
              courseId: serverProgress.courseId,
              xp: serverProgress.xp,
              dailyXp: serverProgress.dailyXp,
              dailyDate: serverProgress.dailyDate,
              goal: serverProgress.goal,
              streak: serverProgress.streak,
              bestStreak: serverProgress.bestStreak,
              lastActive: serverProgress.lastActive,
              hearts: serverProgress.hearts,
              heartsDate: serverProgress.heartsDate,
              sound: serverProgress.sound,
              theme: serverProgress.theme,
              practiced: serverProgress.practiced,
              completed: serverProgress.completed,
              mistakes: serverProgress.mistakes,
              answered: serverProgress.answered,
              correctAnswers: serverProgress.correctAnswers,
              activeDays: serverProgress.activeDays,
              pendingTrain: serverProgress.pendingTrain,
              unlockedAchievements: serverProgress.unlockedAchievements,
              lastAchievementCheck: serverProgress.lastAchievementCheck,
            });
          }
        } catch (e) {
          console.error("Failed to sync from server:", e);
        } finally {
          set({ syncing: false });
        }
      },
      syncToServer: async (partial) => {
        const state = get();
        if (!state.isAuthenticated || state.syncing) return;
        try {
          const data = partial || {
            name: state.name,
            courseId: state.courseId,
            xp: state.xp,
            dailyXp: state.dailyXp,
            dailyDate: state.dailyDate,
            goal: state.goal,
            streak: state.streak,
            bestStreak: state.bestStreak,
            lastActive: state.lastActive,
            hearts: state.hearts,
            heartsDate: state.heartsDate,
            sound: state.sound,
            theme: state.theme,
            practiced: state.practiced,
            completed: state.completed,
            mistakes: state.mistakes,
            answered: state.answered,
            correctAnswers: state.correctAnswers,
            activeDays: state.activeDays,
            pendingTrain: state.pendingTrain,
            unlockedAchievements: state.unlockedAchievements,
            lastAchievementCheck: state.lastAchievementCheck,
          };
          await upsertProgress(data as Parameters<typeof upsertProgress>[0]);
        } catch (e) {
          console.error("Failed to sync to server:", e);
        }
      },
    }),
    { name: "sharptech-academy-v1" },
  ),
);

// Hook to manage auth sync
export function useAuthSync() {
  const { user, isPending } = useCurrentUserState();
  const { isAuthenticated, syncFromServer, syncToServer, setAuthState } = useProgress();

  useEffect(() => {
    if (isPending) return;

    const authenticated = !!user && !user.isDevFallback;

    if (authenticated !== isAuthenticated) {
      setAuthState(authenticated);
      if (authenticated) {
        syncFromServer();
      }
    }
  }, [user, isPending, isAuthenticated, setAuthState, syncFromServer]);

  // Periodic sync when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      syncToServer();
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, syncToServer]);
}

export function useStoreHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (useProgress.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return useProgress.persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}