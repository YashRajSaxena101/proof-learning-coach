import { useEffect, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import { emptyProgress, type Progress } from "@/domain/learning";
import { CONFIDENCE_INT } from "@/domain/evaluation";
import { LocalProgressRepository, progressStore, type AttemptInput, type ProgressRepository } from "./progress-store";

export type SyncStatus = { kind: "local" | "loading" | "saving" | "saved" | "error"; message?: string };
let status: SyncStatus = { kind: "local" };
let session: Session | null = null;
let authReady = false;
const subs = new Set<() => void>();
const setStatus = (s: SyncStatus) => { status = s; subs.forEach((f) => f()); };
const sub = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

export const useSyncStatus = () => useSyncExternalStore(sub, () => status, () => status);
export const useSession = () => useSyncExternalStore(sub, () => session, () => null);
export const useAuthReady = () => useSyncExternalStore(sub, () => authReady, () => false);
export const getSession = () => session;

/** Writes the whole session state to learning_sessions; reports real errors, never fake success. */
class AccountRepository implements ProgressRepository {
  readonly kind = "account" as const;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private sessionId: string, private initial: Progress) {}
  load() { return this.initial; }
  save(p: Progress) {
    if (this.timer) clearTimeout(this.timer);
    setStatus({ kind: "saving" });
    this.timer = setTimeout(() => void this.flush(p), 500);
  }
  async flush(p: Progress) {
    const { error } = await supabase.from("learning_sessions").update({ state: p, updated_at: new Date().toISOString() }).eq("id", this.sessionId);
    setStatus(error ? { kind: "error", message: `Couldn't save to your account: ${error.message}` } : { kind: "saved" });
  }
  clear() { /* reset() saves an empty state right after */ }
}

async function attachAccount(s: Session) {
  setStatus({ kind: "loading" });
  const { data, error } = await supabase.from("learning_sessions").select("id, state")
    .eq("scenario_id", "revenue-mirage").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) { setStatus({ kind: "error", message: `Couldn't load your saved session: ${error.message}` }); return; }
  if (data) {
    const st = (data.state as Progress | null)?.version === 1 ? (data.state as Progress) : emptyProgress();
    progressStore.useRepository(new AccountRepository(data.id, st));
    setStatus({ kind: "saved", message: "Resumed from your account" });
    return;
  }
  // First sign-in: seed the account session from the current browser demo progress.
  const seed = progressStore.get();
  const ins = await supabase.from("learning_sessions").insert({ user_id: s.user.id, scenario_id: "revenue-mirage", state: seed }).select("id").single();
  if (ins.error) { setStatus({ kind: "error", message: `Couldn't create your account session: ${ins.error.message}` }); return; }
  progressStore.useRepository(new AccountRepository(ins.data.id, seed));
  setStatus({ kind: "saved" });
}

export async function insertAttempt(a: AttemptInput): Promise<{ id: string } | { error: string }> {
  if (!session) return { error: "Not signed in" };
  const id = crypto.randomUUID();
  const { error } = await supabase.from("learning_attempts").insert({
    id, user_id: session.user.id, activity_id: `revenue-mirage:${a.activity}`, answer: a.answer.slice(0, 4000),
    confidence: a.confidence ? CONFIDENCE_INT[a.confidence] : null, hints_used: Math.min(3, a.hintsUsed),
  });
  if (error) { setStatus({ kind: "error", message: `Attempt not saved: ${error.message}` }); return { error: error.message }; }
  return { id };
}

let started = false;
/** Call once from the root layout (client only). */
export function useAccountSync() {
  useEffect(() => {
    if (started) return;
    started = true;
    progressStore.onAttempt((a) => { if (session && a.activity !== "teach") void insertAttempt(a); });
    void supabase.auth.getSession().then(({ data }) => {
      session = data.session; authReady = true; subs.forEach((f) => f());
      if (session) void attachAccount(session);
    });
    supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "TOKEN_REFRESHED") return;
      const wasSignedIn = !!session;
      session = s; authReady = true; subs.forEach((f) => f());
      if (event === "SIGNED_IN" && !wasSignedIn && s) void attachAccount(s);
      if (event === "SIGNED_OUT") { progressStore.useRepository(new LocalProgressRepository()); setStatus({ kind: "local" }); }
    });
  }, []);
}
