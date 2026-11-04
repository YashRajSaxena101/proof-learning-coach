import { useSyncExternalStore } from "react";
import { emptyProgress, type Confidence, type EvidenceEvent, type Progress, type StepId } from "@/domain/learning";

/** Swappable persistence. Browser-local for the instant demo; account sync lives in remote-sync.ts. */
export interface ProgressRepository {
  readonly kind: "browser-local" | "account";
  load(): Progress;
  save(p: Progress): void;
  clear(): void;
}

const KEY = "proof.revenue-mirage.v1";

export class LocalProgressRepository implements ProgressRepository {
  readonly kind = "browser-local" as const;
  load(): Progress {
    try {
      const raw = window.localStorage.getItem(KEY);
      const p = raw ? (JSON.parse(raw) as Progress) : null;
      return p && p.version === 1 ? p : emptyProgress();
    } catch { return emptyProgress(); }
  }
  save(p: Progress) {
    try { window.localStorage.setItem(KEY, JSON.stringify(p)); setLocalPersistence("saved"); }
    catch { setLocalPersistence("memory-only"); }
  }
  clear() { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } }
}

/** Whether browser-demo progress actually reached localStorage. "memory-only" = lost on reload. */
export type LocalPersistence = "saved" | "memory-only";
let localPersistence: LocalPersistence = "saved";
const persistListeners = new Set<() => void>();
function setLocalPersistence(v: LocalPersistence) {
  if (v === localPersistence) return;
  localPersistence = v; persistListeners.forEach((l) => l());
}
export const getLocalPersistence = () => localPersistence;
export function useLocalPersistence(): LocalPersistence {
  return useSyncExternalStore((l) => { persistListeners.add(l); return () => persistListeners.delete(l); }, () => localPersistence, () => "saved");
}

export interface AttemptInput { activity: StepId; answer: string; confidence?: Confidence; hintsUsed: number }

let repo: ProgressRepository | null = null;
let state: Progress | null = null;
const SERVER = emptyProgress();
const listeners = new Set<() => void>();
const attemptListeners = new Set<(a: AttemptInput) => void>();
const emit = () => listeners.forEach((l) => l());

function ensure(): Progress {
  if (!state) { repo = repo ?? new LocalProgressRepository(); state = repo.load(); }
  return state;
}

export const progressStore = {
  get: ensure,
  mode: () => repo?.kind ?? "browser-local",
  set(update: (p: Progress) => Progress) { state = update(ensure()); repo?.save(state); emit(); },
  log(e: Omit<EvidenceEvent, "at">, attempt?: Omit<AttemptInput, "hintsUsed">) {
    progressStore.set((p) => ({ ...p, events: [...p.events, { ...e, at: new Date().toISOString() }] }));
    if (attempt) {
      const a = { ...attempt, hintsUsed: Math.min(3, ensure().hints[attempt.activity] ?? 0) };
      attemptListeners.forEach((l) => l(a));
    }
  },
  reset() { repo?.clear(); state = emptyProgress(); repo?.save(state); emit(); },
  /** Swap persistence (e.g. sign-in) and load its state. */
  useRepository(r: ProgressRepository, initial?: Progress) { repo = r; state = initial ?? r.load(); emit(); },
  onAttempt(l: (a: AttemptInput) => void) { attemptListeners.add(l); return () => attemptListeners.delete(l); },
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
};

export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, ensure, () => SERVER);
}
