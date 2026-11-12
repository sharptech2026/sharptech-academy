import type { CourseId, Step, Drill } from "@/lib/curriculum";
import { getCourse, courseLessons } from "@/lib/curriculum";

export interface DailyChallenge {
  id: string;
  date: string;
  courseId: CourseId;
  lessonId: string;
  stepIndex: number;
  step: Step;
  xpReward: number;
  bonusCondition?: string;
  bonusXp: number;
}

const CHALLENGE_TEMPLATES: Array<{
  courseId: CourseId;
  lessonIds: string[];
  stepKinds: Step["kind"][];
  xpReward: number;
  bonusCondition: string;
  bonusXp: number;
}> = [
  {
    courseId: "js",
    lessonIds: ["js-1", "js-2", "js-3", "js-4", "js-5", "js-6"],
    stepKinds: ["choice", "predict", "blank", "type"],
    xpReward: 25,
    bonusCondition: "Responde sem erros",
    bonusXp: 15,
  },
  {
    courseId: "py",
    lessonIds: ["py-1", "py-2", "py-3", "py-4", "py-5", "py-6"],
    stepKinds: ["choice", "predict", "blank", "type"],
    xpReward: 25,
    bonusCondition: "Responde sem erros",
    bonusXp: 15,
  },
  {
    courseId: "cs",
    lessonIds: ["cs-1", "cs-2", "cs-3", "cs-4", "cs-5", "cs-6"],
    stepKinds: ["choice", "predict", "blank", "type"],
    xpReward: 25,
    bonusCondition: "Responde sem erros",
    bonusXp: 15,
  },
  {
    courseId: "web",
    lessonIds: ["web-1", "web-2", "web-3", "web-4"],
    stepKinds: ["choice", "predict", "blank", "type", "order"],
    xpReward: 25,
    bonusCondition: "Responde sem erros",
    bonusXp: 15,
  },
  {
    courseId: "sql",
    lessonIds: ["sql-1", "sql-2", "sql-3", "sql-4"],
    stepKinds: ["choice", "predict", "blank", "type", "order"],
    xpReward: 25,
    bonusCondition: "Responde sem erros",
    bonusXp: 15,
  },
];

function seededRandom(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickRandom<T>(array: T[], rand: () => number): T {
  return array[Math.floor(rand() * array.length)];
}

export function getDailyChallenge(date: Date = new Date()): DailyChallenge {
  const dateStr = date.toISOString().split("T")[0];
  const rand = seededRandom(dateStr);

  const template = pickRandom(CHALLENGE_TEMPLATES, rand);
  const course = getCourse(template.courseId);
  if (!course) throw new Error("Course not found");

  const availableLessons = courseLessons(course).filter((l) => template.lessonIds.includes(l.id));
  if (availableLessons.length === 0) throw new Error("No lessons available");

  const lesson = pickRandom(availableLessons, rand);
  const validSteps = lesson.steps.filter((s, idx) => template.stepKinds.includes(s.kind) && s.kind !== "theory");
  if (validSteps.length === 0) throw new Error("No valid steps");

  const pickedStep = pickRandom(validSteps, rand);
  const stepIndex = lesson.steps.findIndex((s) => s === pickedStep);
  const step = lesson.steps[stepIndex];

  return {
    id: `challenge-${dateStr}-${template.courseId}-${lesson.id}-${stepIndex}`,
    date: dateStr,
    courseId: template.courseId,
    lessonId: lesson.id,
    stepIndex,
    step,
    xpReward: template.xpReward,
    bonusCondition: template.bonusCondition,
    bonusXp: template.bonusXp,
  };
}

export function getWeeklyChallenges(): DailyChallenge[] {
  const challenges: DailyChallenge[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    challenges.push(getDailyChallenge(date));
  }
  return challenges.reverse();
}

export function isChallengeCompleted(challengeId: string): boolean {
  const completed = getCompletedChallenges();
  return completed.includes(challengeId);
}

export function markChallengeCompleted(challengeId: string) {
  const completed = getCompletedChallenges();
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    localStorage.setItem("sharptech-daily-challenges", JSON.stringify(completed));
  }
}

export function getCompletedChallenges(): string[] {
  try {
    return JSON.parse(localStorage.getItem("sharptech-daily-challenges") || "[]");
  } catch {
    return [];
  }
}

export function getChallengeProgress(): { completed: number; total: number; streak: number } {
  const completed = getCompletedChallenges();
  const weekly = getWeeklyChallenges();
  const weeklyCompleted = weekly.filter((c) => completed.includes(c.id)).length;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const challenge = getDailyChallenge(date);
    if (completed.includes(challenge.id)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { completed: weeklyCompleted, total: 7, streak };
}

export function createChallengeDrill(challenge: DailyChallenge): Drill {
  return {
    key: challenge.id,
    lessonId: challenge.lessonId,
    courseId: challenge.courseId,
    step: challenge.step,
  };
}