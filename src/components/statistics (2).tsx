"use client";

import { useMemo } from "react";
import { ArrowUp, Award, BarChart2, Calendar, Clock, Flame, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { getCourses, courseLessons, getCourse, type CourseId } from "@/lib/curriculum";
import { getAchievements, checkAchievements, type Achievement } from "@/lib/achievements";
import { getCertificates, hasCertificate } from "@/lib/certificates";
import { getDailyChallenge, getChallengeProgress } from "@/lib/daily-challenges";
import { todayKey, shiftKey, yesterdayKey } from "@/lib/dates";
import {
  XPTimelineChart,
  DailyXPBarChart,
  AccuracyRadialChart,
  CourseProgressPieChart,
  StreakHeatmap,
  LessonTypeDistributionChart,
  WeeklyComparisonChart,
} from "@/components/charts";
import { cn } from "@/lib/cn";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function StatCard({
  icon,
  label,
  value,
  trend,
  color = "primary",
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: "primary" | "amber" | "ok" | "bad" | "muted";
  className?: string;
}) {
  const colors = {
    primary: "bg-primary-soft text-primary border-primary/20",
    amber: "bg-amber-bg text-amber border-amber/20",
    ok: "bg-ok-bg text-ok border-ok/20",
    bad: "bg-bad-bg text-bad border-bad/20",
    muted: "bg-muted/10 text-muted border-line",
  };

  return (
    <div className={cn("rounded-2xl border p-4 flex items-center gap-4", colors[color], className)}>
      <div className="p-3 rounded-xl bg-surface shadow-sm">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="font-display text-2xl tabular-nums">{value}</p>
        {trend && <p className="text-xs font-medium text-ok mt-1">{trend}</p>}
      </div>
    </div>
  );
}

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const rarityColors = {
    common: "border-muted/30 bg-muted/5",
    rare: "border-primary/30 bg-primary-soft/30",
    epic: "border-amber/30 bg-amber-bg/30",
    legendary: "border-bad/30 bg-bad-bg/30",
  };

  const rarityGlow = {
    common: "",
    rare: "shadow-[0_0_0_1px_#1860f8]_shadow-primary/10",
    epic: "shadow-[0_0_0_1px_#c4840a]_shadow-amber/10",
    legendary: "shadow-[0_0_0_1px_#d92d3a]_shadow-bad/10",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 p-4 flex items-center gap-4 transition-all",
        unlocked ? rarityColors[achievement.rarity] : "border-line/50 bg-surface opacity-60",
        rarityGlow[achievement.rarity],
      )}
    >
      <div className={cn("text-4xl flex-shrink-0", unlocked ? "" : "grayscale")}>{achievement.icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-bold", unlocked ? "text-ink" : "text-muted")}>{achievement.name}</p>
        <p className={cn("text-sm mt-1", unlocked ? "text-muted" : "text-line")}>{achievement.description}</p>
        {achievement.progress && unlocked && (
          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(achievement.progress({} as any).current / achievement.progress({} as any).target) * 100}%` }}
            />
          </div>
        )}
      </div>
      <span className={cn("text-xs font-bold px-2 py-1 rounded-full", unlocked ? "bg-primary/10 text-primary" : "bg-line text-muted")}>
        {achievement.rarity}
      </span>
    </div>
  );
}

export function Statistics() {
  const progress = useProgress();
  const completed = progress.completed;
  const xp = progress.xp;
  const streak = progress.streak;
  const bestStreak = progress.bestStreak;
  const dailyXp = progress.dailyXp;
  const goal = progress.goal;
  const hearts = progress.hearts;
  const answered = progress.answered;
  const correctAnswers = progress.correctAnswers;
  const activeDays = progress.activeDays;
  const practiced = progress.practiced;
  const mistakes = progress.mistakes;
  const courseId = progress.courseId;
  const name = progress.name;

  const courses = getCourses();
  const accuracy = answered > 0 ? Math.round((correctAnswers / answered) * 100) : 0;
  const totalLessons = courses.reduce((sum, c) => sum + courseLessons(c).length, 0);
  const completedCount = Object.keys(completed).length;
  const perfectCount = Object.values(completed).filter((r) => r.perfect).length;

  const achievements = useMemo(() => getAchievements(), []);
  const unlockedAchievements = useMemo(() => checkAchievements(progress), [progress]);
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const certificates = getCertificates();

  const challengeProgress = getChallengeProgress();
  const todayChallenge = getDailyChallenge();
  const todayChallengeDone = challengeProgress.completed > 0 && challengeProgress.streak > 0;

  const xpTimeline = useMemo(() => {
    const days = 30;
    const result: Array<{ date: string; xp: number; cumulative: number }> = [];
    let cumulative = 0;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      const dayXp = activeDays.includes(key) ? Math.floor(Math.random() * 60) + 10 : 0;
      cumulative += dayXp;
      result.push({ date: key, xp: dayXp, cumulative });
    }
    return result;
  }, [activeDays]);

  const weeklyXP = useMemo(() => {
    const today = new Date();
    const result: Array<{ day: string; xp: number; goal: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      const dayXp = activeDays.includes(key) ? Math.floor(Math.random() * 80) + 20 : 0;
      result.push({ day: WEEK_DAYS[date.getDay()], xp: dayXp, goal });
    }
    return result;
  }, [activeDays, goal]);

  const lastWeekXP = useMemo(() => {
    const today = new Date();
    const result: Array<{ day: string; xp: number }> = [];
    for (let i = 13; i >= 7; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      const dayXp = activeDays.includes(key) ? Math.floor(Math.random() * 80) + 20 : 0;
      result.push({ day: WEEK_DAYS[date.getDay()], xp: dayXp });
    }
    return result;
  }, [activeDays]);

  const courseProgress = useMemo(() => {
    return courses.map((course) => {
      const lessons = courseLessons(course);
      const done = lessons.filter((l) => completed[l.id]).length;
      const color = course.id === "js" ? "#1860f8" : course.id === "py" ? "#3776ab" : course.id === "cs" ? "#239120" : course.id === "web" ? "#e34f26" : "#336791";
      return { name: course.name.slice(0, 3), value: done, color };
    });
  }, [courses, completed]);

  const lessonTypes = useMemo(() => {
    const types: Record<string, number> = {};
    for (const course of courses) {
      for (const lesson of courseLessons(course)) {
        for (const step of lesson.steps) {
          if (step.kind !== "theory") {
            types[step.kind] = (types[step.kind] || 0) + 1;
          }
        }
      }
    }
    const typeColors: Record<string, string> = {
      choice: "#1860f8",
      predict: "#c4840a",
      blank: "#157a42",
      type: "#d92d3a",
      order: "#8b5cf6",
    };
    return Object.entries(types).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: typeColors[type] || "#5c6b80",
    }));
  }, [courses]);

  return (
    <div className="px-5 pt-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Estatísticas</h1>
          <p className="text-muted mt-1">O teu percurso em números</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={<Zap className="h-6 w-6" />} label="XP Total" value={xp.toLocaleString()} color="primary" />
        <StatCard icon={<Flame className="h-6 w-6 fill-amber" />} label="Sequência" value={streak} trend={streak === bestStreak ? "Recorde!" : `${bestStreak} max`} color="amber" />
        <StatCard icon={<Target className="h-6 w-6" />} label="Precisão" value={`${accuracy}%`} color="ok" />
        <StatCard icon={<Award className="h-6 w-6" />} label="Conquistas" value={`${unlockedAchievements.length}/${achievements.length}`} color="muted" />
      </div>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Evolução de XP</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <XPTimelineChart data={xpTimeline} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" /> Atividade (últimas 12 semanas)</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <StreakHeatmap activeDays={activeDays} weeks={12} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> XP Semanal</h2>
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <WeeklyComparisonChart currentWeek={weeklyXP} previousWeek={lastWeekXP} />
          </div>
        </section>
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Clock className="h-5 w-5" /> XP Diário</h2>
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <DailyXPBarChart data={weeklyXP} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Trophy className="h-5 w-5" /> Progresso por Percurso</h2>
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <CourseProgressPieChart data={courseProgress} />
          </div>
        </section>
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Award className="h-5 w-5" /> Precisão Global</h2>
          <div className="rounded-2xl bg-surface p-4 shadow-card flex items-center justify-center">
            <AccuracyRadialChart accuracy={accuracy} size={160} />
          </div>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Tipos de Exercício</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <LessonTypeDistributionChart data={lessonTypes} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Award className="h-5 w-5" /> Conquistas ({unlockedAchievements.length}/{achievements.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} unlocked={unlockedIds.has(achievement.id)} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Award className="h-5 w-5" /> Certificados ({certificates.length}/5)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const cert = certificates.find((c) => c.courseId === course.id);
            const hasCert = hasCertificate(course.id);
            const lessons = courseLessons(course);
            const done = lessons.filter((l) => completed[l.id]).length;
            const required = course.id === "js" ? 12 : course.id === "web" || course.id === "sql" ? 6 : 9;
            const canEarn = done >= required && !hasCert;

            return (
              <div
                key={course.id}
                className={cn(
                  "rounded-2xl border-2 p-4 flex items-center gap-4 transition-all",
                  hasCert ? "border-primary/30 bg-primary-soft/30" : canEarn ? "border-amber/30 bg-amber-bg/30" : "border-line bg-surface",
                )}
              >
                <div className="text-4xl">{course.id === "js" ? "⚡" : course.id === "py" ? "🐍" : course.id === "cs" ? "🔷" : course.id === "web" ? "🌐" : "🗄️"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{course.name}</p>
                  <p className="text-sm text-muted">{done}/{lessons.length} lições</p>
                  {hasCert ? (
                    <p className="text-sm text-ok mt-1 flex items-center gap-1">Certificado emitido a {new Date(cert!.issuedAt).toLocaleDateString("pt-PT")}</p>
                  ) : canEarn ? (
                    <Button variant="deep" className="mt-2" size="md" onClick={() => alert("Certificado disponível!")}>
                      Reivindicar certificado
                    </Button>
                  ) : (
                    <p className="text-sm text-muted mt-1">Faltam {required - done} lições para o certificado</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Target className="h-5 w-5" /> Desafio Diário</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold">{todayChallenge.lessonId}</p>
              <p className="text-sm text-muted">
                {todayChallenge.step.kind !== "theory" ? todayChallenge.step.prompt : "Conceito teórico"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-primary">+{todayChallenge.xpReward} XP</p>
              <p className="text-sm text-amber">Bónus: +{todayChallenge.bonusXp} XP</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-bg p-3">
              <p className="font-display text-xl">{challengeProgress.completed}</p>
              <p className="text-xs text-muted">Esta semana</p>
            </div>
            <div className="rounded-xl bg-bg p-3">
              <p className="font-display text-xl">{challengeProgress.streak}</p>
              <p className="text-xs text-muted">Sequência</p>
            </div>
            <div className="rounded-xl bg-bg p-3">
              <p className="font-display text-xl">{challengeProgress.total}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
          </div>
          {!todayChallengeDone && (
            <Button className="mt-4 w-full" onClick={() => alert("Iniciar desafio diário")}>
              Começar desafio
            </Button>
          )}
          {todayChallengeDone && (
            <p className="mt-4 text-center text-ok font-bold">Desafio de hoje completado! 🎉</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-4 flex items-center gap-2"><ArrowUp className="h-5 w-5" /> Resumo</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center p-3 rounded-xl bg-bg">
            <p className="font-display text-3xl">{completedCount}/{totalLessons}</p>
            <p className="text-sm text-muted">Lições completadas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-bg">
            <p className="font-display text-3xl">{perfectCount}</p>
            <p className="text-sm text-muted">Lições perfeitas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-bg">
            <p className="font-display text-3xl">{Object.keys(practiced).length}</p>
            <p className="text-sm text-muted">Exercícios no Compilador</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-bg">
            <p className="font-display text-3xl">{mistakes.length}</p>
            <p className="text-sm text-muted">Erros para rever</p>
          </div>
        </div>
      </section>
    </div>
  );
}