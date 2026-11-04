import { useEffect, useSyncExternalStore } from "react";

/** User motion control: OS reduced-motion OR the in-app pause toggle disables ambient/decorative motion. */
const KEY = "proof.motion-paused";
let paused = false;
let reduced = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let inited = false;

function init() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  try { paused = window.localStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = mq.matches;
  mq.addEventListener("change", (e) => { reduced = e.matches; apply(); emit(); });
  apply();
}
function apply() {
  document.documentElement.classList.toggle("motion-paused", paused || reduced);
}
export function setMotionPaused(v: boolean) {
  paused = v;
  try { window.localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  apply(); emit();
}
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

export function useMotionPref() {
  useEffect(init, []);
  const p = useSyncExternalStore(subscribe, () => paused, () => false);
  const r = useSyncExternalStore(subscribe, () => reduced, () => false);
  return { paused: p, reduced: r, allowed: !p && !r };
}
export const motionAllowedNow = () => { init(); return !paused && !reduced; };
