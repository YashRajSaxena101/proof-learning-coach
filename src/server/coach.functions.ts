import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side placeholder for a live teaching model. It never returns model output
 * until a provider key is configured as a server secret and wired here.
 */
export const coachStatus = createServerFn({ method: "GET" }).handler(async () => {
  const configured = Boolean(process.env["PROOF_COACH_API_KEY"]);
  return { live: false, configured, reason: configured ? "Key present but live coach not yet implemented" : "No server-side coach key configured" };
});

export const reviewTeachBackLive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ text: z.string().min(1).max(4000) }).parse(input))
  .handler(async () => {
    return { ok: false as const, error: "Live coach not available; client uses the scripted coach." };
  });
