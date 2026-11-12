import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { previewSound, playTone } from "@/lib/sound";
import { useProgress, type ThemeId } from "@/lib/progress";

const THEMES: Array<{ id: ThemeId; label: string; detail: string; swatch: string }> = [
  { id: "claro", label: "Claro", detail: "Fundo limpo, azul vivo.", swatch: "swatch-claro" },
  { id: "noite", label: "Noite", detail: "Fundo escuro para praticar à noite.", swatch: "swatch-noite" },
  { id: "papel", label: "Papel", detail: "Tom quente, como um caderno.", swatch: "swatch-papel" },
];

export function useApplyTheme() {
  const theme = useProgress((state) => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}

export function SettingsPanel() {
  const theme = useProgress((state) => state.theme);
  const sound = useProgress((state) => state.sound);
  const setTheme = useProgress((state) => state.setTheme);
  const toggleSound = useProgress((state) => state.toggleSound);

  return (
    <section className="px-5 pt-4">
      <h1 className="font-display text-3xl">Definições</h1>
      <p className="mt-2 text-muted">A aparência e o som ficam neste dispositivo.</p>

      <h2 className="mt-6 text-sm font-bold">Aparência</h2>
      <div className="mt-3 grid gap-3">
        {THEMES.map((item) => {
          const active = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              aria-pressed={active}
              className={cn(
                "press flex items-center gap-4 rounded-3xl border-2 bg-surface p-4 text-left",
                active ? "border-primary" : "border-transparent",
              )}
            >
              <span className={cn("h-14 w-14 shrink-0 rounded-2xl border border-line", item.swatch)} aria-hidden />
              <span>
                <span className="block font-bold">{item.label}</span>
                <span className="mt-1 block text-sm text-muted">{item.detail}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-6 text-sm font-bold">Som</h2>
      <div className="mt-3 rounded-3xl bg-surface p-4 shadow-card">
        <button
          type="button"
          onClick={() => {
            const next = !useProgress.getState().sound;
            toggleSound();
            if (next) playTone("ok", true);
          }}
          className="press flex h-14 w-full items-center justify-between rounded-2xl bg-bg px-4 font-bold"
          aria-pressed={sound}
        >
          {sound ? "Som ligado" : "Som desligado"}
          {sound ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted" />}
        </button>
        <p className="mt-3 text-sm text-muted">Acertos, erros e toques das lições usam este som.</p>
        <button
          type="button"
          onClick={() => previewSound()}
          className="press mt-3 h-12 w-full rounded-2xl border-2 border-line text-sm font-bold"
        >
          Ouvir exemplo
        </button>
      </div>
    </section>
  );
}
