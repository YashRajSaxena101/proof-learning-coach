import { visibleDecision, type CareerSession, type Scenario } from "./contracts";
export { latestFeedback } from "./attempts";
export type SceneChoice = Scenario["decisions"][number]["choices"][number];
export type SceneDecisionContext = { id: string; question: string; choice: SceneChoice };
/** Each recorded decision stays independently inspectable. */
export const visibleDecisionsForScene = (
  s: Pick<CareerSession, "scenario" | "choices">,
): SceneDecisionContext[] =>
  s.scenario.decisions.flatMap((decision) => {
    const choice = visibleDecision(decision, s.choices[decision.id]);
    return choice ? [{ id: decision.id, question: decision.question, choice }] : [];
  });
export const visibleDecisionForScene = (s: CareerSession) =>
  visibleDecisionsForScene(s).at(-1)?.choice;
export function scenePositions(scene: Scenario["scene"]) {
  const n = scene.nodes.length;
  const jitter = (i: number) => ((scene.seed * (i + 3) * 13) % 17) - 8;
  return scene.nodes.map((node, i) => {
    let x = 90 + (i * 500) / Math.max(1, n - 1),
      y = 165;
    if (scene.domain === "ai") {
      x = i === 0 ? 90 : i === n - 1 ? 590 : 230 + ((i - 1) % 3) * 115;
      y = i === 0 ? 120 : i === n - 1 ? 170 : i < 4 ? 115 : 245;
    }
    if (scene.domain === "data") {
      x = i < 2 ? 100 : 350 + ((i - 2) * 230) / Math.max(1, n - 3);
      y = i < 2 ? 90 + i * 155 : 135 + ((i - 2) % 2) * 100;
    }
    if (scene.domain === "software") y = 105 + (i % 2) * 125;
    if (scene.domain === "cloud") {
      const angle = (i * Math.PI * 2) / n - Math.PI / 2;
      x = 340 + Math.cos(angle) * 240;
      y = 175 + Math.sin(angle) * 118;
    }
    if (scene.domain === "security") {
      x = i === 0 ? 85 : i === n - 1 ? 590 : 225 + ((i - 1) % 3) * 115;
      y = i === 0 || i === n - 1 ? 175 : i < 4 ? 120 : 235;
    }
    if (scene.domain === "product") {
      x = i === 0 ? 85 : i === n - 1 ? 590 : 250 + ((i - 1) % 3) * 110;
      y = i === 0 || i === n - 1 ? 170 : i < 4 ? 100 : 240;
    }
    return { node, x: x + jitter(0), y: Math.min(245, y + jitter(1)) };
  });
}
export function sceneEffect(_scene: Scenario["scene"], choice?: SceneChoice) {
  const speed = choice?.metrics.speed ?? 50,
    quality = choice?.metrics.quality ?? 50;
  return {
    duration: 4.5 - speed / 30,
    evidenceCount: choice ? Math.max(1, Math.round(quality / 25)) : 2,
    // Proxies control appearance, never operational grants, blocks or outcomes.
    caption: choice
      ? choice.consequence
      : "Explore the scenario's nodes and connections, then make a choice.",
  };
}
