import { createClient } from "@supabase/supabase-js";

// Publishable (public) client credentials for the external project. Safe in the browser; RLS enforces ownership.
export const SUPABASE_URL = "https://vyaydusrhhcazxshadxv.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fFbjQbA4aq6fHe8iEetttQ_URYAiAbD";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: typeof window !== "undefined", autoRefreshToken: typeof window !== "undefined", detectSessionInUrl: true },
});
