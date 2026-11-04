import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import { classifyCoachError, parseCoachResponse, type CoachResponse, type CoachUnavailable } from "@/domain/evaluation";

/** Calls the deployed `proof-coach` Edge Function (Ollama server-side). The function writes learning_evaluations itself. */
export async function requestCoachEvaluation(attemptId: string): Promise<{ ok: true; result: CoachResponse } | { ok: false; reason: CoachUnavailable }> {
  try {
    const { data, error } = await supabase.functions.invoke("proof-coach", { body: { attempt_id: attemptId } });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        const res = error.context as Response;
        const body = await res.json().catch(() => null);
        return { ok: false, reason: classifyCoachError(res.status, body) };
      }
      return { ok: false, reason: classifyCoachError(undefined, null) };
    }
    const result = parseCoachResponse(data);
    return result ? { ok: true, result } : { ok: false, reason: { code: "INVALID_RESPONSE", message: "The AI coach returned an unexpected response." } };
  } catch {
    return { ok: false, reason: classifyCoachError(undefined, null) };
  }
}
