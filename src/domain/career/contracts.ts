import { z } from "zod";
// Learner expressions are inert React text, not executable model/scene output.
const learnerText = (max: number) => z.string().trim().min(1).max(max);
export const capabilitySchema = z.string().min(1).max(512);
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (v) => !/<\/?(?:script|iframe|style|img|svg|object)\b|https?:\/\/|javascript:/i.test(v),
      "Use bounded text without executable markup or links.",
    );
export const TOPICS = [
  "AI engineer",
  "Data analyst",
  "Software engineer",
  "Cloud/DevOps",
  "Cybersecurity",
  "Product/Business",
] as const;
export const profileSchema = z
  .object({
    topic: learnerText(100),
    experience: z.enum(["new", "foundations", "projects"]),
    interest: z.string().trim().max(600),
    goal: z.enum(["interview", "workplace", "refresh"]),
    minutes: z.union([z.literal(10), z.literal(15), z.literal(25)]),
    diagnostic: z.string().trim().max(1000),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
const metrics = z
  .object({
    quality: z.number().int().min(0).max(100),
    speed: z.number().int().min(0).max(100),
    cost: z.number().int().min(0).max(100),
  })
  .strict();
const node = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,29}$/),
    label: text(45),
    kind: z.enum(["input", "process", "boundary", "output"]),
  })
  .strict();
export const sceneSchema = z
  .object({
    domain: z.enum(["ai", "data", "software", "cloud", "security", "product"]),
    seed: z.number().int().min(0).max(9999),
    nodes: z.array(node).min(3).max(7),
    edges: z
      .array(z.object({ from: z.string(), to: z.string() }).strict())
      .min(2)
      .max(10),
  })
  .strict()
  .superRefine((s, c) => {
    const ids = s.nodes.map((n) => n.id);
    if (
      new Set(ids).size !== ids.length ||
      s.edges.some((e) => !ids.includes(e.from) || !ids.includes(e.to) || e.from === e.to)
    )
      c.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid graph references" });
  });
export const decisionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,20}$/),
    question: text(400),
    choices: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]{1,20}$/),
            label: text(120),
            consequence: text(600),
            metrics,
          })
          .strict(),
      )
      .min(2)
      .max(3),
  })
  .strict()
  .superRefine((d, c) => {
    if (new Set(d.choices.map((v) => v.id)).size !== d.choices.length)
      c.addIssue({ code: "custom", message: "Choice IDs must be unique" });
  });
export const scenarioSchema = z
  .object({
    title: text(100),
    manager: text(80),
    request: text(700),
    context: text(700),
    constraints: z.array(text(200)).min(2).max(4),
    objective: text(250),
    artifacts: z
      .array(z.object({ label: text(70), detail: text(500) }).strict())
      .min(2)
      .max(4),
    decisions: z.array(decisionSchema).min(2).max(3),
    interview: text(400),
    transfer: text(400),
    rubric: z.array(text(200)).min(3).max(5),
    scene: sceneSchema,
  })
  .strict()
  .superRefine((s, c) => {
    if (new Set(s.decisions.map((d) => d.id)).size !== s.decisions.length)
      c.addIssue({ code: "custom", message: "Decision IDs must be unique" });
  });
export type Scenario = z.infer<typeof scenarioSchema>;
export const feedbackSchema = z
  .object({
    mode: z.literal("live-ai"),
    provider: z.literal("Ollama"),
    model: text(100),
    message: text(1800),
    strengths: z.array(text(250)).max(4),
    gaps: z.array(text(250)).max(4),
    nextQuestion: text(400),
    retrySuggestions: z.array(text(250)).max(3),
    independent: z.boolean(),
  })
  .strict();
export type Feedback = z.infer<typeof feedbackSchema>;
export const messageSchema = z
  .object({ role: z.enum(["user", "coach"]), text: learnerText(2000) })
  .strict();
export const sessionSchema = z
  .object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    profile: profileSchema,
    scenario: scenarioSchema,
    source: z.enum(["example", "live-ai"]),
    // Private scoped access. Never render, export or log this field.
    capability: capabilitySchema.optional(),
    provider: z.literal("Ollama").optional(),
    model: z.string().min(1).max(100).optional(),
    stage: z.enum(["decisions", "interview", "transfer", "complete"]),
    drafts: z
      .object({
        decisions: z.string().max(2000).optional(),
        interview: z.string().max(2000).optional(),
        transfer: z.string().max(2000).optional(),
      })
      .strict()
      .optional(),
    choices: z.record(z.string()),
    choiceHistory: z
      .array(
        z
          .object({
            decisionId: z.string().max(20),
            choiceId: z.string().max(20),
            createdAt: z.string().datetime(),
            helpUsed: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(100)
      .optional(),
    answers: z
      .array(
        z
          .object({
            id: z.string().min(1).max(100).optional(),
            createdAt: z.string().datetime().optional(),
            feedbackAt: z.string().datetime().optional(),
            status: z.enum(["pending", "failed", "complete", "recorded"]).optional(),
            stage: z.enum(["decisions", "interview", "transfer"]),
            choices: z.record(z.string()).optional(),
            text: z.string().max(2000),
            helpUsed: z.number().int().min(0).max(100),
            feedback: feedbackSchema.optional(),
          })
          .strict(),
      )
      .max(40),
    messages: z.array(messageSchema).max(40),
    helpUsed: z.number().int().min(0).max(100),
  })
  .strict()
  .superRefine((s, c) => {
    if (
      Object.entries(s.choices).some(
        ([id, v]) =>
          !s.scenario.decisions.some((d) => d.id === id && d.choices.some((ch) => ch.id === v)),
      )
    )
      c.addIssue({ code: "custom", message: "Invalid committed choice" });
  });
export type CareerSession = z.infer<typeof sessionSchema>;
export const careerStateSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema.optional(),
    activeId: z.string().uuid().optional(),
    sessions: z.array(sessionSchema).max(30),
  })
  .strict();
export type CareerState = z.infer<typeof careerStateSchema>;
export const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), profile: profileSchema }).strict(),
  z
    .object({
      action: z.literal("tutor"),
      sessionId: z.string().uuid(),
      capability: capabilitySchema.optional(),
      text: learnerText(2000),
      intent: z.enum(["hint", "simpler", "example", "answer"]),
      stage: z.enum(["decisions", "interview", "transfer"]),
      choices: z.record(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("feedback"),
      sessionId: z.string().uuid(),
      capability: capabilitySchema.optional(),
      text: learnerText(2000),
      intent: z.enum(["hint", "simpler", "example", "answer"]),
      stage: z.enum(["decisions", "interview", "transfer"]),
      choices: z.record(z.string()).optional(),
    })
    .strict(),
]);
export const canRequest = (userCount: number, globalCount: number) =>
  userCount < 12 && globalCount < 200;
export const visibleDecision = (d: z.infer<typeof decisionSchema>, id: string | undefined) =>
  id ? (d.choices.find((c) => c.id === id) ?? null) : null;
export const nextSuggestion = (gaps: string[], suggestions: string[] = []) =>
  suggestions[0] ??
  gaps[0] ??
  "Try a different constraint and explain how it changes your decision.";
export const diagnosticQuestion = (topic: string) =>
  topic === "AI engineer"
    ? "A support assistant must answer from private documents. What would you check before choosing how it learns?"
    : topic === "Data analyst"
      ? "A report changes after two tables are joined. What would you inspect first?"
      : topic === "Software engineer"
        ? "A checkout request sometimes fails. What evidence would you collect before changing the code?"
        : topic === "Cloud/DevOps"
          ? "A service slows down during a traffic spike. What would you check before adding servers?"
          : topic === "Cybersecurity"
            ? "A teammate requests access to customer records. What should you establish before granting it?"
            : topic === "Product/Business"
              ? "Sign-ups increased after a redesign. What would you need before attributing the change to the redesign?"
              : `What would you check first when asked to solve a practical problem in ${topic}?`;
export const REFERENCES: Record<string, { label: string; url: string }> = {
  "AI engineer": {
    label: "Retrieval concepts · Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview",
  },
  "Data analyst": {
    label: "Join behavior · PostgreSQL",
    url: "https://www.postgresql.org/docs/current/tutorial-join.html",
  },
  "Software engineer": {
    label: "HTTP concepts · MDN",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
  },
  "Cloud/DevOps": {
    label: "Service concepts · Kubernetes",
    url: "https://kubernetes.io/docs/concepts/services-networking/service/",
  },
  Cybersecurity: {
    label: "Access control · OWASP",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
  },
  "Product/Business": {
    label: "Experiment design · NIST",
    url: "https://www.itl.nist.gov/div898/handbook/pri/pri.htm",
  },
};
