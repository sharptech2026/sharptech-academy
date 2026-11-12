import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Lightbulb, X } from "lucide-react";
import bolt from "@/assets/bolt.png";
import { Button } from "@/components/ui/button";
import type { Drill, Step } from "@/lib/curriculum";
import { cn } from "@/lib/cn";
import { typeMatches } from "@/lib/grade";
import { playTone } from "@/lib/sound";
import { useProgress } from "@/lib/progress";

type Phase = "play" | "empty" | "done";
type Status = "idle" | "ok" | "bad";

const PRAISE = ["Boa!", "Afiado!", "É isso!", "Certo!"];
const NUDGE = ["Ainda não", "Quase", "Repara nisto"];

function isCorrect(step: Step, input: { pick: number | null; text: string; built: number[] }) {
  if (step.kind === "theory") return true;
  if (step.kind === "choice" || step.kind === "predict" || step.kind === "blank") {
    return input.pick === step.answer;
  }
  if (step.kind === "type") {
    return typeMatches(input.text, step.answer, step.accept, step.semi ?? "strip");
  }
  if (step.kind === "order") {
    return input.built.length === step.lines.length && input.built.every((value, line) => value === line);
  }
  return false;
}

function hashSeed(value: string) {
  let seed = 1;
  for (let i = 0; i < value.length; i += 1) seed = (seed * 33 + value.charCodeAt(i)) % 2147483647;
  return seed || 1;
}

function shuffled(count: number, seed: number) {
  const items = Array.from({ length: count }, (_, index) => index);
  let state = seed;
  const rand = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
  if (items.every((value, index) => value === index) && count > 1) {
    const swap = items[0];
    items[0] = items[1];
    items[1] = swap;
  }
  return items;
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-ink text-on-primary shadow-card">
      {label ? (
        <p className="border-b border-on-primary/15 px-4 py-2 text-xs font-semibold tracking-wide text-on-primary/70">
          {label}
        </p>
      ) : null}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Player({
  title,
  drills,
  costHeart,
  onExit,
  onComplete,
}: {
  title: string;
  drills: Drill[];
  costHeart: boolean;
  onExit: () => void;
  onComplete: (stats: { correct: number; total: number }) => number | Promise<number>;
}) {
  const hearts = useProgress((state) => state.hearts);
  const sound = useProgress((state) => state.sound);
  const recordAnswer = useProgress((state) => state.recordAnswer);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(() =>
    costHeart && useProgress.getState().hearts <= 0 ? "empty" : "play",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [pick, setPick] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [pool, setPool] = useState<number[]>([]);
  const [built, setBuilt] = useState<number[]>([]);
  const [hintOpen, setHintOpen] = useState(false);
  const [quit, setQuit] = useState(false);
  const [xp, setXp] = useState(0);
  const [shake, setShake] = useState(false);
  const stats = useRef({ correct: 0, total: 0 });
  const scroller = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const runtime = useRef({
    grade: () => {},
    advance: () => {},
    canCheck: false,
    status: "idle" as Status,
    phase: "play" as Phase,
    quit: false,
  });
  const drill = drills[index];
  const step = drill?.step;

  useEffect(() => {
    if (!step || step.kind !== "order") return;
    setPool(shuffled(step.lines.length, hashSeed(drill.key)));
    setBuilt([]);
  }, [drill?.key, step]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index, phase]);

  const canCheck = useMemo(() => {
    if (!step) return false;
    if (step.kind === "theory") return true;
    if (step.kind === "choice" || step.kind === "predict" || step.kind === "blank") return pick !== null;
    if (step.kind === "type") return text.trim().length > 0;
    if (step.kind === "order") return built.length === step.lines.length;
    return false;
  }, [built.length, pick, step, text]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      if (event.target instanceof HTMLButtonElement) return;
      const now = runtime.current;
      if (now.phase !== "play" || now.quit) return;
      event.preventDefault();
      if (now.status === "idle") {
        if (now.canCheck) now.grade();
      } else now.advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!step || !drill) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <p className="text-muted">Esta lição não tem passos.</p>
      </main>
    );
  }

  function grade() {
    if (!step || status !== "idle") return;
    if (step.kind === "theory") {
      advance();
      return;
    }
    const ok = isCorrect(step, { pick, text, built });
    stats.current.total += 1;
    if (ok) stats.current.correct += 1;
    recordAnswer(drill.key, ok, costHeart);
    setStatus(ok ? "ok" : "bad");
    playTone(ok ? "ok" : "bad", sound);
    if (!ok) {
      setShake(true);
      window.setTimeout(() => setShake(false), 240);
    }
  }

  async function advance() {
    if (costHeart && !useProgress.getState().hearts && status === "bad") {
      setPhase("empty");
      return;
    }
    if (index + 1 >= drills.length) {
      if (finished.current) return;
      finished.current = true;
      const gained = await onComplete(stats.current);
      setXp(gained);
      setPhase("done");
      playTone("ok", sound);
      return;
    }
    setIndex((value) => value + 1);
    setStatus("idle");
    setPick(null);
    setText("");
    setHintOpen(false);
  }

  runtime.current = { grade, advance, canCheck, status, phase, quit };

  const progress = Math.round((index / drills.length) * 100);

  if (phase === "done") {
    const total = stats.current.total;
    const correct = stats.current.correct;
    const accuracy = total ? Math.round((correct / total) * 100) : 100;
    const perfect = total > 0 && correct === total;
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
        <img src={bolt} alt="" className="rise h-28 w-28" />
        <p className="mt-6 text-sm font-bold tracking-wide text-primary">Lição fechada</p>
        <h1 className="font-display mt-2 text-4xl text-ink">{perfect ? "Perfeito." : "Bom trabalho."}</h1>
        <p className="mt-3 max-w-xs text-muted">
          {perfect ? "Nenhuma falha nesta ronda." : "O erro também ensina. A explicação fica contigo."}
        </p>
        {costHeart ? (
          <p className="mt-3 max-w-xs text-sm font-semibold text-ink">O exercício desta lição ficou aberto no Compilador.</p>
        ) : null}
        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          <Stat label="XP" value={`+${xp}`} />
          <Stat label="Certas" value={`${correct}/${total || drills.length}`} />
          <Stat label="Precisão" value={`${accuracy}%`} />
        </div>
        <Button className="mt-8" onClick={onExit}>
          Continuar
        </Button>
      </main>
    );
  }

  if (phase === "empty") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
        <Heart className="h-12 w-12 fill-bad text-bad" aria-hidden />
        <h1 className="font-display mt-4 text-4xl">Ficaste sem vidas</h1>
        <p className="mt-3 text-muted">
          O treino não gasta vidas. No fim, as cinco voltam e podes retomar o percurso.
        </p>
        <Button
          className="mt-8"
          onClick={() => {
            useProgress.getState().requestTrain();
            onExit();
          }}
        >
          Ir para o treino
        </Button>
        <Button className="mt-3" variant="surface" onClick={onExit}>
          Voltar ao percurso
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="press grid h-11 w-11 place-items-center rounded-full text-muted"
          onClick={() => setQuit(true)}
          aria-label="Sair da lição"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        {costHeart ? (
          <p className="flex items-center gap-1 text-base font-bold text-bad tabular-nums">
            <Heart className="h-5 w-5 fill-bad" aria-hidden />
            {hearts}
          </p>
        ) : (
          <p className="text-sm font-bold text-primary">Treino</p>
        )}
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-sm font-semibold text-muted">{title}</p>
        <StepBody
          step={step}
          pick={pick}
          status={status}
          text={text}
          pool={pool}
          built={built}
          shake={shake}
          hintOpen={hintOpen}
          onPick={(value) => {
            if (status !== "idle") return;
            setPick(value);
            playTone("pop", sound);
          }}
          onText={setText}
          onTake={(value) => {
            if (status !== "idle") return;
            setPool((items) => items.filter((item) => item !== value));
            setBuilt((items) => [...items, value]);
          }}
          onDrop={(value) => {
            if (status !== "idle") return;
            setBuilt((items) => items.filter((item) => item !== value));
            setPool((items) => [...items, value]);
          }}
          onHint={() => setHintOpen((open) => !open)}
        />
      </div>

      <footer
        className={cn(
          "max-h-[48%] shrink-0 overflow-y-auto px-5 pt-4 pb-5 transition-colors duration-200",
          status === "ok" && "bg-ok text-on-primary",
          status === "bad" && "bg-bad text-on-primary",
        )}
      >
        {status === "idle" ? (
          <Button disabled={!canCheck} onClick={grade}>
            {step.kind === "theory" ? "Continuar" : "Verificar"}
          </Button>
        ) : (
          <div>
            <h2 className="font-display text-3xl">{status === "ok" ? PRAISE[index % PRAISE.length] : NUDGE[index % NUDGE.length]}</h2>
            <p className="mt-2 text-base leading-relaxed">{step.kind === "theory" ? "" : step.explain}</p>
            {status === "bad" ? <AnswerReveal step={step} /> : null}
            <Button className="mt-4" variant="inverse" onClick={advance}>
              Continuar
            </Button>
          </div>
        )}
      </footer>

      {quit ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-4 sm:place-items-center" role="dialog" aria-modal aria-labelledby="quit-title">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-5 text-ink shadow-card">
            <h2 id="quit-title" className="font-display text-2xl">
              Sair desta tentativa?
            </h2>
            <p className="mt-2 text-muted">O progresso da lição perde-se. As vidas já gastas ficam gastas.</p>
            <Button className="mt-5" variant="deep" onClick={onExit}>
              Sair
            </Button>
            <Button className="mt-3" variant="surface" onClick={() => setQuit(false)}>
              Continuar a lição
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-4 shadow-card">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function AnswerReveal({ step }: { step: Step }) {
  if (step.kind === "theory") return null;
  if (step.kind === "choice" || step.kind === "predict" || step.kind === "blank") {
    return <p className="mt-3 font-semibold">Resposta: {step.options[step.answer]}</p>;
  }
  if (step.kind === "type") {
    return <p className="mt-3 font-mono text-sm">Resposta: {step.answer}</p>;
  }
  if (step.kind === "order") {
    return <p className="mt-3 font-mono text-sm leading-relaxed">Resposta: {step.lines.join("  ·  ")}</p>;
  }
  return null;
}

function StepBody({
  step,
  pick,
  status,
  text,
  pool,
  built,
  shake,
  hintOpen,
  onPick,
  onText,
  onTake,
  onDrop,
  onHint,
}: {
  step: Step;
  pick: number | null;
  status: Status;
  text: string;
  pool: number[];
  built: number[];
  shake: boolean;
  hintOpen: boolean;
  onPick: (index: number) => void;
  onText: (value: string) => void;
  onTake: (index: number) => void;
  onDrop: (index: number) => void;
  onHint: () => void;
}) {
  if (step.kind === "theory") {
    return (
      <div className="rise pt-4">
        <h1 className="font-display text-3xl">{step.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink">{step.body}</p>
        {step.example ? (
          <div className="mt-5">
            <CodeBlock code={step.example} label="exemplo" />
          </div>
        ) : null}
      </div>
    );
  }

  const prompt = step.prompt;
  return (
    <div className="pt-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl">{prompt}</h1>
      </div>
      {"hint" in step ? (
        <button type="button" className="press mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary" onClick={onHint}>
          <Lightbulb className="h-4 w-4" aria-hidden />
          {hintOpen ? "Esconder dica" : "Dica"}
        </button>
      ) : null}
      {hintOpen && "hint" in step ? <p className="mt-2 rounded-2xl bg-amber-bg px-4 py-3 text-sm text-ink">{step.hint}</p> : null}

      {step.kind === "predict" && step.code ? (
        <div className="mt-5">
          <CodeBlock code={step.code} label="código" />
        </div>
      ) : null}
      {step.kind === "choice" && step.code ? (
        <div className="mt-5">
          <CodeBlock code={step.code} label="código" />
        </div>
      ) : null}
      {step.kind === "type" && step.code ? (
        <div className="mt-5">
          <CodeBlock code={step.code} label="código" />
        </div>
      ) : null}

      {step.kind === "blank" ? (
        <div className="mt-5">
          <CodeBlock
            label="completa"
            code={`${step.before}${pick === null ? "____" : step.options[pick]}${step.after}`}
          />
        </div>
      ) : null}

      {step.kind === "choice" || step.kind === "predict" || step.kind === "blank" ? (
        <div className="mt-5 grid gap-3">
          {step.options.map((option, optionIndex) => {
            const tone =
              status === "idle"
                ? pick === optionIndex
                  ? "selected"
                  : "rest"
                : optionIndex === step.answer
                  ? "ok"
                  : pick === optionIndex
                    ? "bad"
                    : "rest";
            return (
              <button
                key={option}
                type="button"
                disabled={status !== "idle"}
                onClick={() => onPick(optionIndex)}
                className={cn(
                  "press rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold",
                  tone === "selected" && "border-primary bg-primary-soft",
                  tone === "ok" && "border-ok bg-ok-bg",
                  tone === "bad" && "border-bad bg-bad-bg",
                  tone === "bad" && shake && "shake",
                  tone === "rest" && "border-line bg-surface",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      {step.kind === "type" ? (
        <label className="mt-5 block">
          <span className="sr-only">A tua resposta</span>
          <input
            value={text}
            disabled={status !== "idle"}
            onChange={(event) => onText(event.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Escreve aqui"
            className={cn(
              "h-14 w-full rounded-2xl border-2 bg-surface px-4 font-mono text-base outline-none",
              status === "ok" && "border-ok",
              status === "bad" && "border-bad",
              status === "idle" && "border-line focus:border-primary",
            )}
          />
        </label>
      ) : null}

      {step.kind === "order" ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-muted">A tua ordem</p>
          <div className="mt-2 grid min-h-16 gap-2">
            {built.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-line px-4 py-4 text-sm text-muted">Toca nas linhas, pela ordem certa.</p>
            ) : (
              built.map((line, position) => (
                <button
                  key={`${line}-${position}`}
                  type="button"
                  disabled={status !== "idle"}
                  onClick={() => onDrop(line)}
                  className={cn(
                    "press rounded-2xl border-2 px-4 py-3 text-left font-mono text-sm",
                    status === "ok" && "border-ok bg-ok-bg",
                    status === "bad" && "border-bad bg-bad-bg",
                    status === "idle" && "border-primary bg-primary-soft",
                  )}
                >
                  <span className="mr-2 font-sans font-bold text-primary">{position + 1}</span>
                  {step.lines[line]}
                </button>
              ))
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-muted">Linhas</p>
          <div className="mt-2 grid gap-2">
            {pool.map((line) => (
              <button
                key={line}
                type="button"
                disabled={status !== "idle"}
                onClick={() => onTake(line)}
                className="press rounded-2xl border-2 border-line bg-surface px-4 py-3 text-left font-mono text-sm"
              >
                {step.lines[line]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
