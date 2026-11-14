import type { CourseId } from "@/lib/curriculum";

export type AchievementId =
  | "first-lesson"
  | "first-perfect"
  | "streak-3"
  | "streak-7"
  | "streak-14"
  | "streak-30"
  | "streak-60"
  | "streak-100"
  | "xp-100"
  | "xp-500"
  | "xp-1000"
  | "xp-2500"
  | "xp-5000"
  | "xp-10000"
  | "course-js"
  | "course-py"
  | "course-cs"
  | "course-web"
  | "course-sql"
  | "all-courses"
  | "early-bird"
  | "night-owl"
  | "weekend-warrior"
  | "compiler-master"
  | "trainer"
  | "perfectionist"
  | "comeback"
  | "polyglot";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "xp" | "course" | "special" | "habit";
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (state: AchievementState) => boolean;
  progress?: (state: AchievementState) => { current: number; target: number };
}

export interface AchievementState {
  completed: Record<string, { correct: number; total: number; perfect: boolean }>;
  streak: number;
  bestStreak: number;
  xp: number;
  dailyXp: number;
  dailyDate: string;
  activeDays: string[];
  hearts: number;
  mistakes: string[];
  answered: number;
  correctAnswers: number;
  courseId: CourseId;
  practiced: Record<string, boolean>;
  lastActive: string | null;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    name: "Primeiro Passo",
    description: "Completa a tua primeira lição",
    icon: "🎯",
    category: "special",
    rarity: "common",
    check: (s) => Object.keys(s.completed).length >= 1,
  },
  {
    id: "first-perfect",
    name: "Perfeccionista",
    description: "Fecha uma lição sem erros",
    icon: "⭐",
    category: "special",
    rarity: "common",
    check: (s) => Object.values(s.completed).some((r) => r.perfect),
  },
  {
    id: "streak-3",
    name: "Em Chamas",
    description: "Mantém uma sequência de 3 dias",
    icon: "🔥",
    category: "streak",
    rarity: "common",
    check: (s) => s.streak >= 3,
    progress: (s) => ({ current: Math.min(s.streak, 3), target: 3 }),
  },
  {
    id: "streak-7",
    name: "Semana de Ferro",
    description: "7 dias seguidos a programar",
    icon: "🔥",
    category: "streak",
    rarity: "rare",
    check: (s) => s.streak >= 7,
    progress: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
  },
  {
    id: "streak-14",
    name: "Duas Semanas",
    description: "14 dias sem falhar",
    icon: "🔥",
    category: "streak",
    rarity: "rare",
    check: (s) => s.streak >= 14,
    progress: (s) => ({ current: Math.min(s.streak, 14), target: 14 }),
  },
  {
    id: "streak-30",
    name: "Mês Completo",
    description: "30 dias de sequência",
    icon: "🔥",
    category: "streak",
    rarity: "epic",
    check: (s) => s.streak >= 30,
    progress: (s) => ({ current: Math.min(s.streak, 30), target: 30 }),
  },
  {
    id: "streak-60",
    name: "Dois Meses",
    description: "60 dias a programar todos os dias",
    icon: "🔥",
    category: "streak",
    rarity: "epic",
    check: (s) => s.streak >= 60,
    progress: (s) => ({ current: Math.min(s.streak, 60), target: 60 }),
  },
  {
    id: "streak-100",
    name: "Centenário",
    description: "100 dias de sequência ininterrupta",
    icon: "🏆",
    category: "streak",
    rarity: "legendary",
    check: (s) => s.streak >= 100,
    progress: (s) => ({ current: Math.min(s.streak, 100), target: 100 }),
  },
  {
    id: "xp-100",
    name: "Iniciante",
    description: "Acumula 100 XP",
    icon: "⚡",
    category: "xp",
    rarity: "common",
    check: (s) => s.xp >= 100,
    progress: (s) => ({ current: Math.min(s.xp, 100), target: 100 }),
  },
  {
    id: "xp-500",
    name: "Aprendiz",
    description: "500 XP conquistados",
    icon: "⚡",
    category: "xp",
    rarity: "common",
    check: (s) => s.xp >= 500,
    progress: (s) => ({ current: Math.min(s.xp, 500), target: 500 }),
  },
  {
    id: "xp-1000",
    name: "Programador",
    description: "1.000 XP",
    icon: "⚡",
    category: "xp",
    rarity: "rare",
    check: (s) => s.xp >= 1000,
    progress: (s) => ({ current: Math.min(s.xp, 1000), target: 1000 }),
  },
  {
    id: "xp-2500",
    name: "Desenvolvedor",
    description: "2.500 XP",
    icon: "⚡",
    category: "xp",
    rarity: "rare",
    check: (s) => s.xp >= 2500,
    progress: (s) => ({ current: Math.min(s.xp, 2500), target: 2500 }),
  },
  {
    id: "xp-5000",
    name: "Senior",
    description: "5.000 XP",
    icon: "⚡",
    category: "xp",
    rarity: "epic",
    check: (s) => s.xp >= 5000,
    progress: (s) => ({ current: Math.min(s.xp, 5000), target: 5000 }),
  },
  {
    id: "xp-10000",
    name: "Mestre",
    description: "10.000 XP — lenda viva",
    icon: "👑",
    category: "xp",
    rarity: "legendary",
    check: (s) => s.xp >= 10000,
    progress: (s) => ({ current: Math.min(s.xp, 10000), target: 10000 }),
  },
  {
    id: "course-js",
    name: "JavaScript Ninja",
    description: "Completa todo o curso de JavaScript",
    icon: "🟨",
    category: "course",
    rarity: "rare",
    check: (s) => {
      const jsLessons = Object.keys(s.completed).filter((k) => k.startsWith("js-"));
      return jsLessons.length >= 12;
    },
  },
  {
    id: "course-py",
    name: "Pythonista",
    description: "Completa todo o curso de Python",
    icon: "🐍",
    category: "course",
    rarity: "rare",
    check: (s) => {
      const pyLessons = Object.keys(s.completed).filter((k) => k.startsWith("py-"));
      return pyLessons.length >= 9;
    },
  },
  {
    id: "course-cs",
    name: "C# Sharp",
    description: "Completa todo o curso de C#",
    icon: "🔷",
    category: "course",
    rarity: "rare",
    check: (s) => {
      const csLessons = Object.keys(s.completed).filter((k) => k.startsWith("cs-"));
      return csLessons.length >= 9;
    },
  },
  {
    id: "course-web",
    name: "Web Weaver",
    description: "Completa todo o curso de HTML e CSS",
    icon: "🌐",
    category: "course",
    rarity: "rare",
    check: (s) => {
      const webLessons = Object.keys(s.completed).filter((k) => k.startsWith("web-"));
      return webLessons.length >= 6;
    },
  },
  {
    id: "course-sql",
    name: "Data Detective",
    description: "Completa todo o curso de SQL",
    icon: "🗄️",
    category: "course",
    rarity: "rare",
    check: (s) => {
      const sqlLessons = Object.keys(s.completed).filter((k) => k.startsWith("sql-"));
      return sqlLessons.length >= 6;
    },
  },
  {
    id: "all-courses",
    name: "Poliglota Completo",
    description: "Termina os 5 percursos",
    icon: "🌍",
    category: "course",
    rarity: "legendary",
    check: (s) => {
      const courses = ["js", "py", "cs", "web", "sql"];
      return courses.every((cid) => {
        const lessons = Object.keys(s.completed).filter((k) => k.startsWith(`${cid}-`));
        const required = cid === "js" ? 12 : cid === "web" || cid === "sql" ? 6 : 9;
        return lessons.length >= required;
      });
    },
  },
  {
    id: "early-bird",
    name: "Madrugador",
    description: "Programa antes das 8h da manhã",
    icon: "🌅",
    category: "habit",
    rarity: "rare",
    check: (s) => {
      const today = new Date();
      return today.getHours() < 8 && s.dailyXp > 0;
    },
  },
  {
    id: "night-owl",
    name: "Coruja Noturna",
    description: "Programa depois da meia-noite",
    icon: "🦉",
    category: "habit",
    rarity: "rare",
    check: (s) => {
      const today = new Date();
      return today.getHours() >= 23 && s.dailyXp > 0;
    },
  },
  {
    id: "weekend-warrior",
    name: "Guerreiro de Fim de Semana",
    description: "Ganha XP num sábado e num domingo",
    icon: "⚔️",
    category: "habit",
    rarity: "epic",
    check: (s) => {
      const days = s.activeDays.map((d) => new Date(d).getDay());
      return days.includes(6) && days.includes(0);
    },
  },
  {
    id: "compiler-master",
    name: "Mestre do Compilador",
    description: "Resolve 20 exercícios no Compilador",
    icon: "⚙️",
    category: "special",
    rarity: "epic",
    check: (s) => Object.keys(s.practiced).length >= 20,
    progress: (s) => ({ current: Math.min(Object.keys(s.practiced).length, 20), target: 20 }),
  },
  {
    id: "trainer",
    name: "Treinador",
    description: "Completa 50 sessões de treino",
    icon: "💪",
    category: "special",
    rarity: "epic",
    check: (s) => s.answered >= 50,
    progress: (s) => ({ current: Math.min(s.answered, 50), target: 50 }),
  },
  {
    id: "perfectionist",
    name: "Zero Erros",
    description: "10 lições perfeitas seguidas",
    icon: "💎",
    category: "special",
    rarity: "legendary",
    check: (s) => {
      const lessons = Object.values(s.completed);
      let streak = 0;
      for (const lesson of lessons) {
        if (lesson.perfect) streak++;
        else streak = 0;
        if (streak >= 10) return true;
      }
      return false;
    },
  },
  {
    id: "comeback",
    name: "Volta por Cima",
    description: "Recupera uma sequência perdida e chega a 7 dias",
    icon: "🔄",
    category: "streak",
    rarity: "epic",
    check: (s) => s.bestStreak >= 7 && s.streak < s.bestStreak,
  },
  {
    id: "polyglot",
    name: "Poliglota",
    description: "Faz lições em 3 linguagens diferentes num dia",
    icon: "🗣️",
    category: "habit",
    rarity: "epic",
    check: (s) => {
      const today = new Date().toISOString().split("T")[0];
      const todayLessons = Object.entries(s.completed).filter(([, v]) => {
        return v.correct > 0;
      });
      const langs = new Set(todayLessons.map(([k]) => k.split("-")[0]));
      return langs.size >= 3;
    },
  },
];

export function getAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

export function getAchievement(id: AchievementId): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function checkAchievements(state: AchievementState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(state));
}

export function getNewAchievements(
  oldUnlockedIds: Record<string, boolean> | string[] | Set<string>,
  newState: AchievementState,
): Achievement[] {
  const oldUnlocked = new Set(
    Array.isArray(oldUnlockedIds)
      ? oldUnlockedIds
      : oldUnlockedIds instanceof Set
      ? [...oldUnlockedIds]
      : Object.keys(oldUnlockedIds).filter((k) => oldUnlockedIds[k]),
  );
  const newUnlocked = checkAchievements(newState).filter((a) => !oldUnlocked.has(a.id));
  return newUnlocked;
}

export function getRarityColor(rarity: Achievement["rarity"]): string {
  switch (rarity) {
    case "common":
      return "text-muted";
    case "rare":
      return "text-primary";
    case "epic":
      return "text-amber";
    case "legendary":
      return "text-bad";
  }
}

export function getRarityGlow(rarity: Achievement["rarity"]): string {
  switch (rarity) {
    case "common":
      return "bg-muted/20";
    case "rare":
      return "bg-primary-soft";
    case "epic":
      return "bg-amber-bg";
    case "legendary":
      return "bg-bad-bg";
  }
}