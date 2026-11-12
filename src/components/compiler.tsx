import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { courseLessons, getCourse, getCourses, type CourseId } from "@/lib/curriculum";
import { cn } from "@/lib/cn";
import { practiceFor, practicePassed, scratch, type Practice } from "@/lib/practice";
import { useProgress } from "@/lib/progress";
import { runUserCode, type RunResult } from "@/lib/run";

export function Compiler() {
  const courseId = useProgress((state) => state.courseId);
  const setCourse = useProgress((state) => state.setCourse);
  const completed = useProgress((state) => state.completed);
  const practiced = useProgress((state) => state.practiced);
  const course = getCourse(courseId) ?? getCourses()[0];
  const lessons = courseLessons(course);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [code, setCode] = useState(scratch[course.id]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<"idle" | "ok" | "bad">("idle");
  const [gained, setGained] = useState(0);

  const practice = lessonId ? practiceFor(lessonId) : null;
  const tasks = useMemo(
    () =>
      lessons.map((lesson) => ({
        lesson,
        practice: practiceFor(lesson.id),
        open: Boolean(completed[lesson.id]),
        done: Boolean(practiced[lesson.id]),
      })),
    [lessons, completed, practiced],
  );
  const openTasks = tasks.filter((item) => item.practice && item.open);
  const locked = tasks.length - openTasks.length;

  function loadCourse(next: CourseId) {
    setCourse(next);
    setLessonId(null);
    setCode(scratch[next]);
    setResult(null);
    setVerdict("idle");
    setGained(0);
  }

  function loadPractice(item: Practice) {
    setLessonId(item.lessonId);
    setCode(item.starter);
    setResult(null);
    setVerdict("idle");
    setGained(0);
  }

  async function run() {
    setBusy(true);
    setVerdict("idle");
    setGained(0);
    const next = await runUserCode(course.id, code);
    setResult(next);
    if (practice && practicePassed(practice, next)) {
      setVerdict("ok");
      setGained(useProgress.getState().markPractice(practice.lessonId));
    } else if (practice) {
      setVerdict("bad");
    }
    setBusy(false);
  }

  return (
    <section className="px-5 pt-4">
      <h1 className="font-display text-3xl">Compilador</h1>
      <p className="mt-2 text-muted">
        Corre código a sério. Cada lição terminada abre um exercício. {locked > 0 ? `${locked} ainda fechados.` : "Estão todos abertos."}
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {getCourses().map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => loadCourse(item.id)}
            className={cn(
              "press h-10 shrink-0 rounded-full px-4 text-sm font-bold",
              item.id === course.id ? "bg-primary text-on-primary" : "border-2 border-line bg-surface",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>

      {course.id === "sql" ? (
        <p className="mt-3 rounded-2xl bg-primary-soft px-4 py-3 text-sm text-ink">
          Tabelas: alunos (id, nome, xp, curso_id) e cursos (id, titulo). Ana 40 Web, Bruno 10 Web, Clara 25 Dados.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => {
            setLessonId(null);
            setCode(scratch[course.id]);
            setResult(null);
            setVerdict("idle");
          }}
          className={cn(
            "press rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold",
            lessonId === null ? "border-primary bg-primary-soft" : "border-line bg-surface",
          )}
        >
          Consola livre
        </button>
        {openTasks.map(({ lesson, practice: item, done }) =>
          item ? (
            <button
              key={lesson.id}
              type="button"
              onClick={() => loadPractice(item)}
              className={cn(
                "press flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left",
                lessonId === lesson.id ? "border-primary bg-primary-soft" : "border-line bg-surface",
              )}
            >
              {done ? <Check className="h-4 w-4 shrink-0 text-ok" /> : null}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{lesson.title}</span>
                <span className="block text-xs text-muted">Exercício da lição</span>
              </span>
            </button>
          ) : null,
        )}
      </div>

      {practice ? <p className="mt-4 text-base font-semibold">{practice.prompt}</p> : <p className="mt-4 text-sm text-muted">Escreve à vontade. Nada disto é corrigido.</p>}

      <textarea
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
          setVerdict("idle");
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Código"
        className="mt-3 min-h-48 w-full rounded-2xl border-2 border-line bg-surface p-4 font-mono text-sm outline-none focus:border-primary"
      />
      <Button className="mt-3" disabled={busy || code.trim().length === 0} onClick={() => void run()}>
        {busy ? "A correr..." : practice ? "Correr e verificar" : "Correr"}
      </Button>

      {verdict === "ok" ? (
        <p className="mt-3 rounded-2xl bg-ok-bg px-4 py-3 text-sm font-bold text-ok">
          Exercício certo.{gained ? ` +${gained} XP.` : " Já tinhas fechado este."}
        </p>
      ) : null}
      {verdict === "bad" ? (
        <p className="mt-3 rounded-2xl bg-bad-bg px-4 py-3 text-sm font-semibold text-bad">
          Ainda não bate certo com o pedido. A saída está em baixo.
        </p>
      ) : null}

      {result ? (
        <div className="mt-3">
          {result.error ? <p className="mb-2 text-sm font-semibold text-bad">{result.error}</p> : null}
          <pre className="overflow-x-auto rounded-2xl bg-console p-4 font-mono text-sm whitespace-pre-wrap text-console-ink">
            {result.output || (result.error ? "" : "Sem saída.")}
          </pre>
          {result.html ? (
            <iframe title="Pré-visualização" sandbox="" srcDoc={result.html} className="mt-3 h-56 w-full rounded-2xl border-2 border-line bg-surface" />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
