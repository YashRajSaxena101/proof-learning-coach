/**
 * Backend readiness for the external Supabase project (ref vyaydusrhhcazxshadxv).
 * No client is created until the publishable URL/key are provided as VITE_ env vars.
 */
export const SUPABASE_PROJECT_REF = "vyaydusrhhcazxshadxv";

export function backendStatus() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  return {
    configured: Boolean(url && key),
    persistence: "browser-local" as const,
    auth: "not-connected" as const,
    label: url && key ? "Backend keys detected — integration pending" : "Browser-only demo · backend not connected",
  };
}
