"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  Check,
  Database,
  Dumbbell,
  Flame,
  Globe,
  Hash,
  Heart,
  Lock,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Pencil,
  RotateCcw,
  Settings,
  SquareTerminal,
  Star,
  Terminal,
  UserPlus,
  UserRound,
  Users,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import bolt from "@/assets/bolt.png";
import { Compiler } from "@/components/compiler";
import { Player } from "@/components/player";
import { SettingsPanel, useApplyTheme } from "@/components/settings";
import { Statistics } from "@/components/statistics";
import SocialPage from "@/components/social";
import { Button } from "@/components/ui/button";
import {
  courseLessons,
  currentLesson,
  getCourse,
  getCourses,
  isUnlocked,
  lessonTotal,
  sampleTrain,
  type Course,
  type CourseId,
  type Drill,
  type Lesson,
} from "@/lib/curriculum";
import { cn } from "@/lib/cn";
import { practiceFor } from "@/lib/practice";
import { shiftKey } from "@/lib/dates";
import { useProgress, useStoreHydrated, useAuthSync } from "@/lib/progress";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useTranslation, localeNames, localeFlags, type Locale } from "@/lib/i18n";

const ICONS = {
  js: Zap,
  py: Terminal,
  cs: Hash,
  web: Globe,
  sql: Database,
} as const;

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function Academy() {
  useApplyTheme();
  const ready = useStoreHydrated();
  const onboarded = useProgress((state) => state.onboarded);
  const pendingTrain = useProgress((state) => state.pendingTrain);
  const courseId = useProgress((state) => state.courseId);
  const isAuth = useProgress((state) => state.isAuthenticated);
  const settings = useProgress((state) => state);
  const [tab, setTab] = useState<"learn" | "compile" | "train" | "profile" | "settings" | "stats" | "social">("learn");
  const [training, setTraining] = useState<Drill[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [locale, setLocale] = useState<Locale>("pt");
  const t = useTranslation(locale);
  const toggleUserMenu = () => setUserMenuOpen((prev) => !prev);
  const navigate = useNavigate({ from: "/" });
  const navigateTo = (path: string) => navigate({ to: path });

  // Auth sync hook - handles session hydration and periodic sync
  useAuthSync();

  useEffect(() => {
    if (!ready) return;
    useProgress.getState().rollDay();
  }, [ready]);

  useEffect(() => {
    if (!ready || !pendingTrain) return;
    const state = useProgress.getState();
    state.consumeTrain();
    const drills = sampleTrain(state.courseId, state.completed, state.mistakes);
    if (drills.length > 0) setTraining(drills);
    setTab("train");
  }, [pendingTrain, ready]);

  if (!onboarded) return <Onboarding />;

  if (training) {
    return (
      <Player
        title="Treino rápido"
        drills={training}
        costHeart={false}
        onExit={() => setTraining(null)}
        onComplete={(stats) => useProgress.getState().finishTrain(stats.correct)}
      />
    );
  }

  // Show sign-in page if not authenticated and auth is enabled
  // The SignedIn gate will render nothing while isPending
  return (
    <SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <div className="min-h-dvh bg-bg">
        <div className="mx-auto min-h-dvh max-w-lg pb-36">
          <TopBar
            userMenuOpen={userMenuOpen}
            setUserMenuOpen={setUserMenuOpen}
            toggleUserMenu={toggleUserMenu}
            langMenuOpen={langMenuOpen}
            setLangMenuOpen={setLangMenuOpen}
            locale={locale}
            setLocale={setLocale}
            isAuth={isAuth}
            navigate={navigateTo}
            t={t}
          />
          {tab === "learn" ? <Learn note={note} onNote={setNote} onCompile={() => setTab("compile")} /> : null}
          {tab === "compile" ? <Compiler /> : null}
          {tab === "train" ? <TrainHome onStart={setTraining} /> : null}
          {tab === "profile" ? <Profile /> : null}
          {tab === "settings" ? <SettingsPanel /> : null}
          {tab === "stats" ? <Statistics /> : null}
          {tab === "social" ? <SocialPage /> : null}
        </div>
        {tab === "learn" ? <ContinueBar courseId={courseId} onTrain={setTraining} /> : null}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface">
          <div className="mx-auto flex max-w-lg">
            <NavButton active={tab === "learn"} label={t("navLearn")} onClick={() => setTab("learn")}>
              <Map className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "compile"} label={t("navCompile")} onClick={() => setTab("compile")}>
              <SquareTerminal className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "train"} label={t("navTrain")} onClick={() => setTab("train")}>
              <Dumbbell className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "stats"} label={t("navStats")} onClick={() => setTab("stats")}>
              <BarChart2 className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "social"} label="Social" onClick={() => setTab("social")}>
              <Users className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "profile"} label={t("navProfile")} onClick={() => setTab("profile")}>
              <UserRound className="h-5 w-5" />
            </NavButton>
            <NavButton active={tab === "settings"} label={t("navSettings")} onClick={() => setTab("settings")}>
              <Settings className="h-5 w-5" />
            </NavButton>
          </div>
        </nav>
        {userMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/30"
            onClick={() => setUserMenuOpen(false)}
            aria-hidden
          />
        )}
        {langMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/30"
            onClick={() => setLangMenuOpen(false)}
            aria-hidden
          />
        )}
      </div>
    </SignedIn>
  );
}

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold",
        active ? "text-primary" : "text-muted",
      )}
    >
      {children}
      {label}
    </button>
  );
}

function TopBar({
  userMenuOpen,
  setUserMenuOpen,
  toggleUserMenu,
  langMenuOpen,
  setLangMenuOpen,
  locale,
  setLocale,
  isAuth,
  navigate,
  t,
}: {
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  toggleUserMenu: () => void;
  langMenuOpen: boolean;
  setLangMenuOpen: (open: boolean) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  isAuth: boolean;
  navigate: (path: string) => void;
  t: ReturnType<typeof useTranslation>;
}) {
  const name = useProgress((state) => state.name);
  const streak = useProgress((state) => state.streak);
  const hearts = useProgress((state) => state.hearts);
  const dailyXp = useProgress((state) => state.dailyXp);
  const goal = useProgress((state) => state.goal);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur">
        <img src={bolt} alt="" className="h-11 w-11" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl leading-none">{t("hello", { name })}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {t("dailyGoal", { current: Math.min(dailyXp, goal), goal })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="press grid h-10 w-10 place-items-center rounded-full bg-surface text-ink"
              aria-label="Idioma"
              aria-expanded={langMenuOpen}
            >
              <span className="text-lg">{localeFlags[locale]}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl bg-surface border border-line shadow-card p-1 z-40">
                {(["pt", "en", "fr"] as Locale[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { setLocale(l); setLangMenuOpen(false); }}
                    className={`press w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${locale === l ? "bg-primary-soft text-primary" : "text-ink"}`}
                  >
                    <span>{localeFlags[l]}</span>
                    <span>{localeNames[l]}</span>
                    {locale === l && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="flex items-center gap-1 font-bold text-amber tabular-nums">
            <Flame className="h-5 w-5 fill-amber" aria-hidden />
            {streak}
          </p>
          <p className="flex items-center gap-1 font-bold text-bad tabular-nums">
            <Heart className="h-5 w-5 fill-bad" aria-hidden />
            {hearts}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={toggleUserMenu}
              className="press grid h-10 w-10 place-items-center rounded-full bg-surface text-ink"
              aria-label="Menu do utilizador"
              aria-expanded={userMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-surface border border-line shadow-card p-2 z-40">
                <UserButton />
                <div className="h-px bg-line my-2" />
                <p className="px-2 py-1 text-xs text-muted">SharpTech Academy</p>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function Learn({
  note,
  onNote,
  onCompile,
}: {
  note: string | null;
  onNote: (value: string | null) => void;
  onCompile: () => void;
}) {
  const courseId = useProgress((state) => state.courseId);
  const setCourse = useProgress((state) => state.setCourse);
  const completed = useProgress((state) => state.completed);
  const practiced = useProgress((state) => state.practiced);
  const course = getCourse(courseId) ?? getCourses()[0];
  const list = courseLessons(course);
  const done = list.filter((lesson) => completed[lesson.id]).length;
  const pendingPractice = list.filter((lesson) => completed[lesson.id] && practiceFor(lesson.id) && !practiced[lesson.id]).length;

  const rows = useMemo(() => {
    const built: Array<{ kind: "unit"; title: string; blurb: string; index: number } | { kind: "lesson"; lesson: Lesson; index: number }> = [];
    let count = 0;
    course.units.forEach((unit, unitIndex) => {
      built.push({ kind: "unit", title: unit.title, blurb: unit.blurb, index: unitIndex });
      unit.lessons.forEach((lesson) => {
        built.push({ kind: "lesson", lesson, index: count });
        count += 1;
      });
    });
    return built;
  }, [course]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {getCourses().map((item) => {
          const Icon = ICONS[item.id];
          const active = item.id === course.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCourse(item.id)}
              className={cn(
                "press inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold",
                active ? "bg-primary text-on-primary" : "border-2 border-line bg-surface text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.name}
            </button>
          );
        })}
      </div>
      <p className="px-5 pt-2 text-sm text-muted">
        {done} de {list.length} lições · {course.tagline}
      </p>
      {note ? <p className="mx-5 mt-3 rounded-2xl bg-amber-bg px-4 py-3 text-sm font-semibold">{note}</p> : null}
      {pendingPractice > 0 ? (
        <button type="button" onClick={onCompile} className="press mx-5 mt-3 block rounded-2xl bg-primary-soft px-4 py-3 text-left text-sm font-bold text-primary">
          {pendingPractice === 1 ? "1 exercício à espera no Compilador" : `${pendingPractice} exercícios à espera no Compilador`}
        </button>
      ) : null}
      <div className="relative mt-2 px-2">
        <div className="absolute top-28 bottom-8 left-1/2 w-1 -translate-x-1/2 bg-line" aria-hidden />
        {rows.map((row) =>
          row.kind === "unit" ? (
            <UnitBanner key={row.title} index={row.index} title={row.title} blurb={row.blurb} />
          ) : (
            <LessonNode
              key={row.lesson.id}
              course={course}
              lesson={row.lesson}
              index={row.index}
              onLocked={() => {
                onNote("Completa a lição anterior para abrir esta.");
                window.setTimeout(() => onNote(null), 2200);
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}

function UnitBanner({ index, title, blurb }: { index: number; title: string; blurb: string }) {
  return (
    <section className={cn("mx-3 mt-4 rounded-3xl px-5 py-4 text-on-primary", index % 2 === 0 ? "bg-primary" : "bg-primary-deep")}>
      <p className="text-xs font-bold tracking-wide">Unidade {index + 1}</p>
      <h2 className="font-display mt-1 text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-on-primary/80">{blurb}</p>
    </section>
  );
}

function LessonNode({
  course,
  lesson,
  index,
  onLocked,
}: {
  course: Course;
  lesson: Lesson;
  index: number;
  onLocked: () => void;
}) {
  const completed = useProgress((state) => state.completed);
  const record = completed[lesson.id];
  const unlocked = isUnlocked(course, lesson.id, completed);
  const current = currentLesson(course, completed);
  const isCurrent = current?.id === lesson.id;
  const side = index % 2 === 0;

  const bubble = (
    <span
      className={cn(
        "relative grid h-16 w-16 place-items-center rounded-full border-2",
        record && "border-primary bg-primary text-on-primary",
        isCurrent && "border-primary bg-surface text-primary pulse-ring",
        !record && !isCurrent && "border-line bg-surface text-muted",
      )}
    >
      {record ? <Check className="h-7 w-7" /> : isCurrent ? <Zap className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
      {record?.perfect ? (
        <Star className="absolute -top-1 -right-1 h-5 w-5 fill-amber text-amber" aria-label="Perfeita" />
      ) : null}
    </span>
  );

  return (
    <div className={cn("relative flex py-3", side ? "justify-start pl-6" : "justify-end pr-6")}>
      <div className="flex w-40 flex-col items-center gap-2">
        {unlocked ? (
          <Link
            to="/lesson/$courseId/$lessonId"
            params={{ courseId: course.id, lessonId: lesson.id }}
            className="press flex flex-col items-center gap-2"
          >
            {bubble}
            <p className="text-center text-sm font-semibold leading-tight text-ink">{lesson.title}</p>
          </Link>
        ) : (
          <button type="button" className="press flex flex-col items-center gap-2" onClick={onLocked} aria-label={`${lesson.title}, bloqueada`}>
            {bubble}
            <p className="text-center text-sm font-semibold leading-tight text-muted">{lesson.title}</p>
          </button>
        )}
      </div>
    </div>
  );
}

function ContinueBar({
  courseId,
  onTrain,
}: {
  courseId: CourseId;
  onTrain: (drills: Drill[]) => void;
}) {
  const completed = useProgress((state) => state.completed);
  const mistakes = useProgress((state) => state.mistakes);
  const course = getCourse(courseId);
  if (!course) return null;
  const next = currentLesson(course, completed);
  if (!next) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-20 px-4 pb-3">
        <div className="mx-auto max-w-lg">
          <Button
            onClick={() => {
              const drills = sampleTrain(course.id, completed, mistakes);
              if (drills.length) onTrain(drills);
            }}
          >
            Percurso feito · treinar
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-x-0 bottom-16 z-20 px-4 pb-3">
      <div className="mx-auto max-w-lg">
        <Link
          to="/lesson/$courseId/$lessonId"
          params={{ courseId: course.id, lessonId: next.id }}
          className="press flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-5 text-lg font-bold text-on-primary"
        >
          <span className="truncate">Continuar · {next.title}</span>
        </Link>
      </div>
    </div>
  );
}

function TrainHome({ onStart }: { onStart: (drills: Drill[]) => void }) {
  const courseId = useProgress((state) => state.courseId);
  const completed = useProgress((state) => state.completed);
  const mistakes = useProgress((state) => state.mistakes);
  const course = getCourse(courseId);
  const lessonIds = new Set(course ? courseLessons(course).map((lesson) => lesson.id) : []);
  const due = mistakes.filter((key) => lessonIds.has(key.split("#")[0] ?? "")).length;
  return (
    <section className="px-5 pt-4">
      <h1 className="font-display text-4xl">Treino</h1>
      <p className="mt-3 text-lg text-muted">
        Cinco perguntas, sem perder vidas. No fim, as vidas voltam ao máximo. Os erros recentes aparecem primeiro.
      </p>
      <div className="mt-6 rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-sm font-bold text-primary">{course?.name}</p>
        <p className="mt-2 font-display text-3xl">{due > 0 ? `${due} para rever` : "Mistura livre"}</p>
        <p className="mt-2 text-sm text-muted">Cada resposta certa vale 6 XP e conta para a sequência do dia.</p>
        <Button
          className="mt-5"
          onClick={() => {
            if (!course) return;
            const drills = sampleTrain(course.id, completed, mistakes);
            if (drills.length) onStart(drills);
          }}
        >
          Começar treino
        </Button>
      </div>
    </section>
  );
}

function Profile() {
  const name = useProgress((state) => state.name);
  const xp = useProgress((state) => state.xp);
  const streak = useProgress((state) => state.streak);
  const bestStreak = useProgress((state) => state.bestStreak);
  const goal = useProgress((state) => state.goal);
  const completed = useProgress((state) => state.completed);
  const answered = useProgress((state) => state.answered);
  const correctAnswers = useProgress((state) => state.correctAnswers);
  const activeDays = useProgress((state) => state.activeDays);
  const setGoal = useProgress((state) => state.setGoal);
  const setName = useProgress((state) => state.setName);
  const setCourse = useProgress((state) => state.setCourse);
  const courseId = useProgress((state) => state.courseId);
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const accuracy = answered ? Math.round((correctAnswers / answered) * 100) : null;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { key: shiftKey(6 - index), label: WEEK[date.getDay()] ?? "" };
  });

  return (
    <section className="px-5 pt-4">
      <div className="flex items-center gap-4">
        <img src={bolt} alt="" className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (draft.trim()) setName(draft);
                setEditing(false);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 18))}
                className="h-12 w-full rounded-2xl border-2 border-primary bg-surface px-3 text-lg font-bold outline-none"
                aria-label="O teu nome"
              />
            </form>
          ) : (
            <h1 className="truncate font-display text-3xl">{name}</h1>
          )}
          <p className="text-sm text-muted">SharpTech Academy</p>
        </div>
        <button
          type="button"
          className="press grid h-11 w-11 place-items-center rounded-full bg-surface text-ink"
          aria-label={editing ? "Guardar nome" : "Editar nome"}
          onClick={() => {
            if (editing && draft.trim()) setName(draft);
            setEditing((value) => !value);
          }}
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Mini label="XP" value={String(xp)} />
        <Mini label="Sequência" value={String(streak)} />
        <Mini label="Recorde" value={String(bestStreak)} />
      </div>

      <div className="mt-4 rounded-3xl bg-surface p-4 shadow-card">
        <p className="text-sm font-bold">Últimos 7 dias</p>
        <div className="mt-3 flex justify-between">
          {days.map((day) => {
            const on = activeDays.includes(day.key);
            return (
              <div key={day.key} className="flex flex-col items-center gap-2">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full text-xs font-bold", on ? "bg-primary text-on-primary" : "bg-bg text-muted")}>
                  {day.label.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs text-muted">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-surface p-4 shadow-card">
        <p className="text-sm font-bold">Meta diária</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[20, 40, 80].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGoal(value)}
              className={cn(
                "press h-12 rounded-2xl text-sm font-bold",
                goal === value ? "bg-primary text-on-primary" : "bg-bg text-ink",
              )}
            >
              {value} XP
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Precisão {accuracy === null ? "ainda sem respostas" : `${accuracy}%`} · {Object.keys(completed).length} de {lessonTotal} lições
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {getCourses().map((course) => {
          const total = courseLessons(course).length;
          const count = courseLessons(course).filter((lesson) => completed[lesson.id]).length;
          const Icon = ICONS[course.id];
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setCourse(course.id)}
              className={cn(
                "press rounded-3xl border-2 bg-surface p-4 text-left",
                courseId === course.id ? "border-primary" : "border-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{course.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {count}/{total}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="press mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-3xl text-sm font-bold text-bad"
      >
        <RotateCcw className="h-4 w-4" />
        Recomeçar progresso
      </button>

      {confirm ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-4 sm:place-items-center" role="dialog" aria-modal aria-labelledby="reset-title">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-5 shadow-card">
            <h2 id="reset-title" className="font-display text-2xl">
              Apagar o progresso?
            </h2>
            <p className="mt-2 text-muted">XP, sequência, vidas e lições feitas voltam ao início. O nome fica.</p>
            <Button
              className="mt-5"
              variant="deep"
              onClick={() => {
                useProgress.getState().resetProgress();
                setConfirm(false);
              }}
            >
              Apagar
            </Button>
            <Button className="mt-3" variant="surface" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 text-center shadow-card">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function Onboarding() {
  const finish = useProgress((state) => state.finishOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState<CourseId>("js");

  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-8">
        {step === 0 ? (
          <div>
            <img src={bolt} alt="" className="h-20 w-20" />
            <p className="mt-5 text-sm font-bold tracking-wide text-primary">SharpTech Academy</p>
            <h1 className="font-display mt-2 text-4xl">Programar em lições curtas.</h1>
            <ul className="mt-5 grid gap-3 text-base">
              <li className="rounded-2xl bg-surface px-4 py-4 shadow-card">Um conceito de cada vez, como uma lição de línguas.</li>
              <li className="rounded-2xl bg-surface px-4 py-4 shadow-card">Verificas na hora e vês porque é que a resposta está certa.</li>
              <li className="rounded-2xl bg-surface px-4 py-4 shadow-card">Vidas, sequência e XP para voltares amanhã.</li>
            </ul>
          </div>
        ) : null}
        {step === 1 ? (
          <div>
            <h1 className="font-display text-4xl">Como te tratamos?</h1>
            <p className="mt-3 text-muted">Só fica neste dispositivo.</p>
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 18))}
              placeholder="O teu nome"
              className="mt-6 h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg outline-none focus:border-primary"
              aria-label="Nome"
            />
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <h1 className="font-display text-4xl">Por onde começas?</h1>
            <p className="mt-3 text-muted">Podes mudar de percurso quando quiseres.</p>
            <div className="mt-5 grid gap-3 pb-4">
              {getCourses().map((course) => {
                const Icon = ICONS[course.id];
                const active = course.id === courseId;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setCourseId(course.id)}
                    className={cn(
                      "press flex items-center gap-3 rounded-3xl border-2 bg-surface px-4 py-4 text-left",
                      active ? "border-primary" : "border-line",
                    )}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block font-bold">{course.name}</span>
                      <span className="block text-sm text-muted">{course.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="px-5 pt-3 pb-5">
        {step === 0 ? <Button onClick={() => setStep(1)}>Começar</Button> : null}
        {step === 1 ? (
          <Button disabled={!name.trim()} onClick={() => setStep(2)}>
            Continuar
          </Button>
        ) : null}
        {step === 2 ? <Button onClick={() => finish(name, courseId)}>Entrar na academy</Button> : null}
      </div>
    </main>
  );
}
