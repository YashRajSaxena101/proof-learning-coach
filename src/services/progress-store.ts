import { useSyncExternalStore } from "react";
import { emptyProgress, type EvidenceEvent, type Progress } from "@/domain/learning";

/**
 * Repository interface so a backend implementation can replace localStorage later.
 * Only LocalProgressRepository exists today — browser-only demo persistence.
 */
export interface ProgressRepository {
  readonly kind: "browser-local" | "remote";
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
    } catch {
      return emptyProgress();
    }
  }
  save(p: Progress) { try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota/private mode */ } }
  clear() { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } }
}

let repo: ProgressRepository | null = null;
let state: Progress | null = null;
const SERVER = emptyProgress();
const listeners = new Set<() => void>();

function ensure(): Progress {
  if (!state) { repo = new LocalProgressRepository(); state = repo.load(); }
  return state;
}

export const progressStore = {
  get: ensure,
  set(update: (p: Progress) => Progress) {
    state = update(ensure());
    repo?.save(state);
    listeners.forEach((l) => l());
  },
  log(e: Omit<EvidenceEvent, "at">) {
    progressStore.set((p) => ({ ...p, events: [...p.events, { ...e, at: new Date().toISOString() }] }));
  },
  reset() { repo?.clear(); state = emptyProgress(); listeners.forEach((l) => l()); },
};

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    ensure,
    () => SERVER,
  );
}
