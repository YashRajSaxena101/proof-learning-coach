import { expect, it } from "vitest";
import { exampleScenario } from "./examples";
import { scenePositions, sceneEffect } from "./scene";
import { TOPICS } from "./contracts";
import * as sceneTools from "./scene";
it("gives six domains distinct stable bounded geometry and a visible seed variation", () => {
  const layouts = TOPICS.map((t) => scenePositions(exampleScenario(t).scene));
  expect(new Set(layouts.map((l) => JSON.stringify(l.map((p) => [p.x, p.y])))).size).toBe(6);
  for (const topic of TOPICS) {
    const scene = exampleScenario(topic).scene;
    expect(scenePositions(scene)).toEqual(scenePositions(scene));
    expect(scenePositions({ ...scene, seed: 43 })).not.toEqual(scenePositions(scene));
    for (const p of scenePositions(scene)) {
      expect(p.x).toBeGreaterThan(30);
      expect(p.x).toBeLessThan(650);
      expect(p.y).toBeGreaterThan(30);
      expect(p.y).toBeLessThan(300);
    }
  }
  for (const topic of TOPICS) {
    const scene = exampleScenario(topic).scene;
    const nodes = Array.from({ length: 7 }, (_, i) => ({
      id: `n-${i}`,
      label: `Work step ${i}`,
      kind: "process" as const,
    }));
    const layout = scenePositions({ ...scene, nodes });
    for (const a of layout)
      for (const b of layout)
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(55);
  }
});
it("maps only committed choices to simulated packet speed, evidence and consequence", () => {
  const s = exampleScenario("AI engineer"),
    choices = s.decisions[0]?.choices;
  if (!choices?.[0] || !choices[1]) throw Error("fixture");
  expect(sceneEffect(s.scene).caption).not.toContain(choices[0].consequence);
  const a = sceneEffect(s.scene, choices[0]),
    b = sceneEffect(s.scene, choices[1]);
  expect(a.duration).not.toBe(b.duration);
  expect(a.evidenceCount).not.toBe(b.evidenceCount);
  expect(a.caption).toContain(choices[0].consequence);
});

it("retains the unsafe approach when a later evidence decision is committed", () => {
  const scenario = exampleScenario("Cybersecurity");
  const session = {
    scenario,
    choices: { approach: "choice-1", evidence: "trial" },
  };
  expect(typeof sceneTools.visibleDecisionsForScene).toBe("function");
  const contexts = sceneTools.visibleDecisionsForScene(session);
  expect(contexts.map((context) => context.id)).toEqual(["approach", "evidence"]);
  expect(contexts[0]?.choice.label).toBe("Share a full administrator account");
  expect(contexts[1]?.choice.label).toBe("Run a small trial with explicit success checks");
});

it("keeps full node cards apart for every supported scene size", () => {
  for (const topic of TOPICS) {
    for (let count = 3; count <= 7; count++) {
      const scene = exampleScenario(topic).scene;
      const nodes = Array.from({ length: count }, (_, index) => ({
        id: `node-${index}`,
        label: "A readable node",
        kind: "process" as const,
      }));
      const positions = scenePositions({ ...scene, nodes });
      for (const first of positions)
        for (const second of positions) {
          if (first === second) continue;
          expect(
            Math.abs(first.x - second.x) >= 106 || Math.abs(first.y - second.y) >= 96,
            `${topic}, ${count} cards: ${first.node.id} overlaps ${second.node.id}`,
          ).toBe(true);
        }
    }
  }
});

it.each(["Preventing <script> injection", "HTTP APIs https://example.com", "x".repeat(100)])(
  "opens a safe general example for accepted technical topic %s",
  (topic) => {
    expect(() => exampleScenario(topic)).not.toThrow();
    const scenario = exampleScenario(topic);
    expect(scenario.title.length).toBeLessThanOrEqual(100);
    expect(scenario.request).not.toContain(topic);
    expect(scenario.scene.nodes.map((node) => node.label)).toContain("Team request");
  },
);
