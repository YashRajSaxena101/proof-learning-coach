import { visibleDecision, type CareerSession, type Scenario } from "./contracts";
export { latestFeedback } from "./attempts";
export const visibleDecisionForScene = (s: CareerSession) => s.scenario.decisions.flatMap(d => {
  const c = visibleDecision(d, s.choices[d.id]); return c ? [c] : [];
}).at(-1);
export type SceneChoice = Scenario["decisions"][number]["choices"][number];
export function scenePositions(scene: Scenario["scene"]) {
  const n = scene.nodes.length;
  const jitter = (i: number) => ((scene.seed * (i + 3) * 17) % 29) - 14;
  return scene.nodes.map((node, i) => {
    let x = 90 + i * 500 / Math.max(1, n - 1), y = 165;
    if (scene.domain === "ai") { x = i === 0 ? 90 : i === n - 1 ? 590 : 230 + ((i - 1) % 3) * 115; y = i === 0 ? 120 : i === n - 1 ? 170 : i < 4 ? 115 : 245; }
    if (scene.domain === "data") { x = i < 2 ? 100 : 350 + (i - 2) * 230 / Math.max(1, n - 3); y = i < 2 ? 90 + i * 155 : 160 + ((i - 2) % 2) * 40; }
    if (scene.domain === "software") y = 135 + (i % 2) * 65;
    if (scene.domain === "cloud") { const angle = i * Math.PI * 2 / n - Math.PI / 2; x = 340 + Math.cos(angle) * 240; y = 175 + Math.sin(angle) * 105; }
    if (scene.domain === "security") { x = i === 0 ? 85 : i === n - 1 ? 590 : 225 + ((i - 1) % 3) * 115; y = i === 0 || i === n - 1 ? 175 : i < 4 ? 120 : 235; }
    if (scene.domain === "product") { x = i === 0 ? 85 : i === n - 1 ? 590 : 250 + ((i - 1) % 3) * 110; y = i === 0 || i === n - 1 ? 170 : i < 4 ? 100 : 240; }
    return { node, x: x + jitter(i), y: y + jitter(i + 1) };
  });
}
export function sceneEffect(scene: Scenario["scene"], choice?: SceneChoice) {
  const speed = choice?.metrics.speed ?? 50, quality = choice?.metrics.quality ?? 50;
  return {
    duration: 4.5 - speed / 30,
    evidenceCount: choice ? Math.max(1, Math.round(quality / 25)) : 2,
    constrained: !!choice && quality < 50,
    caption: choice ? `Simulated choice: ${choice.label}. ${choice.consequence}` : "Illustrative workflow. Choose an approach to explore its simulated effect.",
    qualityLabel: scene.domain === "software" ? "Reliability (higher is better)" : scene.domain === "security" ? "Boundary protection (higher is better)" : "Evidence quality (higher is better)",
  };
}