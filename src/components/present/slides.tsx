export interface Slide { title: string; kicker: string; body: React.ReactNode; notes: string; demoCue?: boolean }

const Tag = ({ k }: { k: "Built" | "Roadmap" }) => (
  <span className={k === "Built" ? "rounded-full bg-ok-soft px-3 py-1 font-mono text-xs text-ok" : "rounded-full bg-warn-soft px-3 py-1 font-mono text-xs text-warn"}>{k}</span>
);

export const SLIDES: Slide[] = [
  { kicker: "01 · The problem", title: "A plausible number, a wrong decision.",
    body: <p className="text-2xl md:text-3xl leading-snug max-w-4xl">A fictional CFO sees revenue “double” from $500 to $1,000 and prepares to double marketing spend. The real number is flat. One JOIN caused it.</p>,
    notes: "Open with the stakes. This is a fictional scenario, but the mistake — join fan-out — is a well-known class of analytics error." },
  { kicker: "02 · The learning gap", title: "Tutorials teach syntax. Jobs test judgment.",
    body: <ul className="space-y-3 text-2xl max-w-4xl list-disc pl-6"><li>Learners can write a JOIN but not notice when it changes row grain.</li><li>Completion badges don't show whether help was needed.</li><li>Confident misconceptions go unaddressed.</li></ul>,
    notes: "Frame this as a hypothesis we want to validate, not a measured finding." },
  { kicker: "03 · The Proof experience", title: "Predict → inspect → trace → repair → teach → transfer.",
    body: <p className="text-2xl max-w-4xl">Each step produces evidence. Hints are tiered and recorded. Assisted success is never labeled as demonstrated.</p>,
    notes: "Walk the eight-step progress map. Mention the Looker card: a documented product approach to the same problem, not a customer incident." },
  { kicker: "04 · Live demo", title: "The Revenue Mirage", demoCue: true,
    body: <ol className="space-y-2 text-xl max-w-4xl list-decimal pl-6"><li>Predict $500 with high confidence</li><li>Click O101 → two line items</li><li>Play the join: 4 orders → 8 rows</li><li>Click $1,000 to trace duplicates</li><li>Try DISTINCT → $380, see why</li><li>Inventory transfer: 50 units</li></ol>,
    notes: "90-second demo. Switch to /learn. Keep it moving: one action per beat. Press T to start the timer." },
  { kicker: "05 · Adaptive paths", title: "Confidence changes the path.",
    body: <div className="grid gap-4 md:grid-cols-3 text-lg"><div className="paper p-5"><Tag k="Built" /><p className="mt-3">High-confidence wrong → misconception probe</p></div><div className="paper p-5"><Tag k="Built" /><p className="mt-3">Low-confidence wrong → prerequisite scaffold</p></div><div className="paper p-5"><Tag k="Built" /><p className="mt-3">3-level hints, recorded as assistance</p></div></div>,
    notes: "All three branches are implemented with deterministic rules and unit tests." },
  { kicker: "06 · Architecture", title: "What's built vs. what's next.",
    body: <div className="grid gap-3 text-base md:grid-cols-2 md:text-lg">
      <p><Tag k="Built" /> Pure calculation + learning-rule modules with unit tests</p>
      <p><Tag k="Built" /> Instant browser-only demo (localStorage)</p>
      <p><Tag k="Built" /> Email/password accounts; sessions sync and resume (owner-only access rules)</p>
      <p><Tag k="Built" /> Every answer saved as a permanent attempt record</p>
      <p><Tag k="Built" /> Signed-in teach-back sent to a server-side AI coach; keyword rubric shown, labeled, as fallback</p>
      <p><Tag k="Roadmap" /> Live AI answers: waiting on the Ollama key in the server function</p>
      <p><Tag k="Roadmap" /> Organization roles + real instructor dashboard</p>
      <p><Tag k="Roadmap" /> More scenarios beyond join fan-out</p>
    </div>,
    notes: "Be precise. The proof-coach server function is deployed but its Ollama key is not entered, so it currently returns not-configured and the app shows the labeled rubric fallback. Outcomes say Demonstrated in this exercise, not permanent mastery. Instructor view is sample data." },
  { kicker: "07 · Validation plan", title: "A pilot we'd like to run.",
    body: <ul className="space-y-3 text-2xl max-w-4xl list-disc pl-6"><li>Small cohort of student volunteers</li><li>Measure unassisted transfer success, before vs. after</li><li>Compare to a reading-only control</li><li>No results yet — we haven't run it</li></ul>,
    notes: "We have no metrics. Say so plainly." },
  { kicker: "08 · Proof", title: "Don't trust the dashboard. Prove it.",
    body: <p className="text-2xl max-w-3xl">Try it now at <span className="font-mono text-teal">/learn</span>.</p>,
    notes: "Close. Invite judges to try the simulation themselves." },
];
