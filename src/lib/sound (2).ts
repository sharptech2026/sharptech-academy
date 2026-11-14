let ctx: AudioContext | null = null;

export function playTone(kind: "ok" | "bad" | "pop", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = kind === "bad" ? "triangle" : "sine";
  const freq = kind === "ok" ? 660 : kind === "bad" ? 180 : 520;
  osc.frequency.setValueAtTime(freq, now);
  if (kind === "ok") osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "ok" ? 0.22 : 0.16));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

export function previewSound() {
  playTone("pop", true);
  window.setTimeout(() => playTone("ok", true), 160);
  window.setTimeout(() => playTone("bad", true), 380);
}
