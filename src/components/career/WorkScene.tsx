import { useId, useState } from "react";
import { motion } from "motion/react";
import { type Scenario } from "@/domain/career/contracts";
import {
  scenePositions,
  sceneEffect,
  type SceneChoice,
  type SceneDecisionContext,
} from "@/domain/career/scene";
import { Button } from "@/components/ui/button";
import { useMotionPref } from "@/lib/motion-pref";

const DOMAIN_LABELS = {
  ai: "AI",
  data: "Data",
  software: "Software",
  cloud: "Cloud",
  security: "Security",
  product: "Product",
} as const;
function labelLines(label: string) {
  const words = label.split(/\s+/).flatMap((word) => word.match(/.{1,14}/g) ?? []);
  return words.reduce<string[]>((lines, word) => {
    const last = lines.at(-1);
    if (!last || last.length + word.length + 1 > 14) lines.push(word);
    else lines[lines.length - 1] = `${last} ${word}`;
    return lines;
  }, []);
}

/** Data-only scenario map. Geometry never invents an operational outcome. */
export function WorkScene({
  scene,
  choice,
  decisions = [],
  compact = false,
}: {
  scene: Scenario["scene"];
  choice?: SceneChoice | undefined;
  decisions?: SceneDecisionContext[] | undefined;
  compact?: boolean;
}) {
  const { allowed } = useMotionPref();
  const [selected, setSelected] = useState(0);
  const [decisionId, setDecisionId] = useState<string>();
  const inspected = decisions.find((decision) => decision.id === decisionId) ?? decisions[0];
  const displayedChoice = inspected?.choice ?? choice;
  const id = useId().replace(/:/g, "");
  const positions = scenePositions(scene);
  const effect = sceneEffect(scene, displayedChoice);
  const selectedNode = scene.nodes[selected] ?? scene.nodes[0];
  const connections = scene.edges
    .map(
      (edge) =>
        `${scene.nodes.find((node) => node.id === edge.from)?.label} to ${scene.nodes.find((node) => node.id === edge.to)?.label}`,
    )
    .join("; ");
  return (
    <figure
      className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-[0_18px_60px_-35px_rgba(0,0,0,0.7)]"
      aria-label={`${DOMAIN_LABELS[scene.domain]} workplace scene`}
      data-domain={scene.domain}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-teal">THE WORK IN VIEW</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore the connections. Explain your choice.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs">
          {DOMAIN_LABELS[scene.domain]}
        </span>
      </div>
      {decisions.length > 0 && (
        <div className="border-b border-border px-5 py-4">
          <p className="mb-3 text-sm text-muted-foreground">Inspect a recorded decision</p>
          <div role="group" aria-label="Decision to inspect" className="flex flex-wrap gap-2">
            {decisions.map((decision, index) => (
              <Button
                key={decision.id}
                size="lg"
                variant={inspected?.id === decision.id ? "secondary" : "outline"}
                aria-pressed={inspected?.id === decision.id}
                onClick={() => setDecisionId(decision.id)}
                className="h-auto min-h-11 justify-start whitespace-normal py-3 text-left"
              >
                {index + 1}. {decision.question}
              </Button>
            ))}
          </div>
        </div>
      )}
      <svg
        viewBox="0 0 680 355"
        className="hidden w-full sm:block"
        role="img"
        aria-label={`${DOMAIN_LABELS[scene.domain]} scenario map. Connections: ${connections}. ${displayedChoice ? `Selected approach: ${displayedChoice.label}. ${effect.caption}` : effect.caption}`}
      >
        <defs>
          <marker
            id={`${id}-arrow`}
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0 0L7 3.5L0 7" fill="var(--teal)" />
          </marker>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="var(--teal-soft)" stopOpacity="0.75" />
            <stop offset="1" stopColor="var(--teal-soft)" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="var(--muted-foreground)" opacity="0.15" />
          </pattern>
        </defs>
        <g aria-hidden="true">
          <rect width="680" height="355" fill={`url(#${id}-grid)`} />
          {scene.domain === "ai" && (
            <g>
              {[0, 1, 2].map((i) => (
                <rect
                  key={i}
                  x={35 + i * 15}
                  y={55 + i * 15}
                  width="80"
                  height="100"
                  rx="8"
                  fill="var(--card)"
                  stroke="var(--border)"
                  opacity="0.4"
                />
              ))}
              <ellipse cx="380" cy="170" rx="250" ry="150" fill={`url(#${id}-halo)`} />
            </g>
          )}
          {scene.domain === "data" && (
            <g>
              {[0, 1, 2].map((row) =>
                [0, 1, 2, 3].map((column) => (
                  <rect
                    key={`${row}-${column}`}
                    x={250 + column * 45}
                    y={65 + row * 75}
                    width="36"
                    height="60"
                    rx="4"
                    fill="var(--teal-soft)"
                    opacity="0.25"
                  />
                )),
              )}
              <path d="M225 45v260M450 45v260" stroke="var(--border)" opacity="0.5" />
            </g>
          )}
          {scene.domain === "software" && (
            <g>
              <rect
                x="25"
                y="55"
                width="630"
                height="260"
                rx="24"
                fill="none"
                stroke="var(--border)"
                strokeDasharray="4 7"
              />
              <path d="M45 175h590" stroke="var(--border)" opacity="0.4" />
            </g>
          )}
          {scene.domain === "cloud" && (
            <g>
              <ellipse cx="340" cy="160" rx="275" ry="150" fill={`url(#${id}-halo)`} />
              <ellipse
                cx="340"
                cy="160"
                rx="240"
                ry="105"
                fill="none"
                stroke="var(--border)"
                strokeDasharray="3 9"
              />
              <ellipse
                cx="340"
                cy="160"
                rx="150"
                ry="65"
                fill="none"
                stroke="var(--border)"
                opacity="0.5"
              />
            </g>
          )}
          {scene.domain === "security" && (
            <g>
              <path
                d="M340 40l115 42v104c0 61-57 106-115 129-58-23-115-68-115-129V82z"
                fill="var(--warn-soft)"
                stroke="var(--border)"
                opacity="0.4"
              />
              <path
                d="M340 65l91 33v88c0 46-44 84-91 105-47-21-91-59-91-105V98z"
                fill="none"
                stroke="var(--border)"
                strokeDasharray="4 7"
              />
            </g>
          )}
          {scene.domain === "product" && (
            <g>
              <rect
                x="200"
                y="45"
                width="330"
                height="120"
                rx="24"
                fill="var(--teal-soft)"
                opacity="0.25"
              />
              <rect
                x="200"
                y="205"
                width="330"
                height="120"
                rx="24"
                fill="var(--card)"
                stroke="var(--border)"
                opacity="0.45"
              />
            </g>
          )}
        </g>
        {scene.edges.map((edge, i) => {
          const a = positions.find((p) => p.node.id === edge.from),
            b = positions.find((p) => p.node.id === edge.to);
          if (!a || !b) return null;
          const dx = b.x - a.x,
            dy = b.y - a.y;
          const inset = Math.min(53 / Math.max(1, Math.abs(dx)), 45 / Math.max(1, Math.abs(dy)));
          const ax = a.x + dx * inset,
            ay = a.y + 8 + dy * inset;
          const bx = b.x - dx * inset,
            by = b.y + 8 - dy * inset;
          const bend = scene.domain === "cloud" || scene.domain === "product" ? 0 : -18;
          const d = `M${ax} ${ay} Q${(ax + bx) / 2} ${(ay + by) / 2 + bend} ${bx} ${by}`;
          const focus = selectedNode?.id === edge.from || selectedNode?.id === edge.to;
          return (
            <g key={`${edge.from}-${edge.to}`} opacity={focus || displayedChoice ? 1 : 0.4}>
              <path
                d={d}
                fill="none"
                stroke={focus ? "var(--teal)" : "var(--border)"}
                strokeWidth={displayedChoice ? 2.5 : 1.5}
                markerEnd={`url(#${id}-arrow)`}
              />
              {allowed &&
                Array.from({ length: displayedChoice ? effect.evidenceCount : 1 }, (_, packet) => (
                  <circle
                    key={`${inspected?.id ?? displayedChoice?.id ?? "preview"}-${packet}`}
                    r={3}
                    fill="var(--teal)"
                    opacity="0.8"
                  >
                    <animateMotion
                      dur={`${effect.duration}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.3 + packet * 0.6}s`}
                      path={d}
                    />
                  </circle>
                ))}
            </g>
          );
        })}
        {positions.map(({ node, x, y }, i) => (
          <g key={node.id}>
            <motion.g
              initial={false}
              animate={{ opacity: selected === i ? 1 : 0.88 }}
              transition={{ duration: allowed ? 0.2 : 0 }}
            >
              <rect
                x={x - 51}
                y={y - 35}
                width="102"
                height="92"
                rx={node.kind === "boundary" ? 8 : 13}
                fill="var(--background)"
                stroke={selected === i ? "var(--teal)" : "var(--border)"}
                strokeWidth={selected === i ? 1.8 : 1}
              />
              <rect x={x - 41} y={y - 25} width="20" height="17" rx="4" fill="var(--teal-soft)" />
              <text
                x={x - 31}
                y={y - 13}
                textAnchor="middle"
                fill="var(--teal)"
                fontSize="9"
                fontWeight="600"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text x={x - 15} y={y - 13} fill="var(--muted-foreground)" fontSize="8">
                {node.kind.toUpperCase()}
              </text>
              <text x={x - 40} y={y + 9} fill="var(--foreground)" fontSize="11.5" fontWeight="500">
                {labelLines(node.label).map((line, j) => (
                  <tspan key={j} x={x - 40} dy={j ? 13 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </motion.g>
          </g>
        ))}
      </svg>
      <details className="space-y-3 p-5 sm:hidden">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-teal">
          Explore the workflow · {scene.nodes.length} steps
        </summary>
        <div role="group" aria-label="Scenario connections" className="space-y-3">
          {scene.nodes.map((node, i) => {
            const next = scene.edges
              .filter((edge) => edge.from === node.id)
              .map((edge) => scene.nodes.find((candidate) => candidate.id === edge.to)?.label)
              .filter(Boolean);
            return (
              <div
                key={node.id}
                className={`rounded-xl border p-4 ${selected === i ? "border-teal/60 bg-teal-soft/30" : "border-border bg-background/40"}`}
              >
                <button
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  className="flex min-h-11 w-full items-center gap-3 text-left"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-soft text-sm font-medium text-teal">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 break-words">
                    <span className="block text-xs text-muted-foreground">{node.kind}</span>
                    <span className="mt-1 block text-base font-medium">{node.label}</span>
                  </span>
                </button>
                {next.length > 0 && (
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    Connects to: {next.join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </details>
      {!compact && (
        <div className="hidden border-t border-border px-5 py-4 sm:block">
          <div role="group" aria-label="Scenario nodes" className="flex flex-wrap gap-2">
            {scene.nodes.map((node, i) => (
              <Button
                key={node.id}
                size="lg"
                variant={selected === i ? "secondary" : "ghost"}
                aria-pressed={selected === i}
                className="h-auto min-h-11 whitespace-normal break-words py-3 text-left"
                onClick={() => setSelected(i)}
              >
                {i + 1}. {node.label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {selectedNode?.label} ·{" "}
            {selectedNode?.kind === "boundary"
              ? "Review this boundary against the scenario's constraints."
              : "Inspect this step in the scenario brief."}
          </p>
        </div>
      )}
      {displayedChoice && (
        <div className="border-t border-border bg-background/35 p-5" aria-live="polite">
          {inspected && <h3 className="text-lg">{inspected.question}</h3>}
          <p className="mt-2 font-medium">Selected approach: {displayedChoice.label}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{effect.caption}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This view illustrates the selected decision. Inspect another decision above to compare
            its tradeoffs.
          </p>
        </div>
      )}
      {displayedChoice && !compact && (
        <div className="border-t border-border p-5">
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Scenario assumptions on a 0–100 scale, not a learner grade or measured performance.
            Compare each dimension separately.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["quality", "Quality assumption (higher is better)"],
                ["speed", "Speed assumption (higher is faster)"],
                ["cost", "Resource cost assumption (lower uses fewer resources)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                  {label} · {displayedChoice.metrics[key]}/100
                </p>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${displayedChoice.metrics[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
