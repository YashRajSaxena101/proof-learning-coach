import { useState } from "react";
import { motion } from "motion/react";
import { type Scenario } from "@/domain/career/contracts";
import { Button } from "@/components/ui/button";
import { useMotionPref } from "@/lib/motion-pref";

/** A bounded, reusable scene: only validated labels, node types and edges are rendered. */
export function WorkScene({
  scene,
  metrics,
  compact = false,
}: {
  scene: Scenario["scene"];
  metrics?: { quality: number; speed: number; cost: number } | undefined;
  compact?: boolean;
}) {
  const { allowed } = useMotionPref();
  const [selected, setSelected] = useState(0);
  const n = scene.nodes.length;
  const positions = scene.nodes.map((node, i) => ({
    node,
    x: 85 + (i % 4) * 170,
    y:
      65 +
      Math.floor(i / 4) * 145 +
      (scene.domain === "security" && i === 1 ? 20 : 0) +
      (scene.seed % 3) * 4,
  }));
  return (
    <figure className="work-scene py-5" aria-label={`${scene.domain} workplace scene`}>
      <svg
        viewBox={`0 0 680 ${n > 4 ? 330 : 210}`}
        className="w-full"
        role="img"
        aria-label={scene.nodes.map((v) => v.label).join(" → ")}
      >
        <defs>
          <marker
            id={`arrow-${scene.domain}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0 0L6 3L0 6" fill="var(--teal)" />
          </marker>
        </defs>
        {scene.edges.map((edge, i) => {
          const a = positions.find((p) => p.node.id === edge.from),
            b = positions.find((p) => p.node.id === edge.to);
          if (!a || !b) return null;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path
                d={`M${a.x + 26} ${a.y} Q${(a.x + b.x) / 2} ${a.y - 35} ${b.x - 30} ${b.y}`}
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
                markerEnd={`url(#arrow-${scene.domain})`}
              />
              <motion.path
                d={`M${a.x + 26} ${a.y} Q${(a.x + b.x) / 2} ${a.y - 35} ${b.x - 30} ${b.y}`}
                fill="none"
                stroke="var(--teal)"
                strokeWidth={metrics ? 3 : 1.5}
                initial={false}
                animate={
                  allowed
                    ? { pathLength: [0.12, 1], opacity: [0.3, 0.8] }
                    : { pathLength: 1, opacity: 0.6 }
                }
                transition={
                  allowed ? { duration: 2.8, repeat: Infinity, delay: i * 0.35 } : { duration: 0 }
                }
              />
            </g>
          );
        })}
        {positions.map(({ node, x, y }, i) => (
          <g key={node.id}>
            {node.kind === "boundary" ? (
              <rect
                x={x - 27}
                y={y - 27}
                width="54"
                height="54"
                rx="8"
                fill="var(--warn-soft)"
                stroke={selected === i ? "var(--teal)" : "var(--warn)"}
                transform={`rotate(8 ${x} ${y})`}
              />
            ) : (
              <circle
                cx={x}
                cy={y}
                r={node.kind === "output" ? 29 : 24}
                fill={selected === i ? "var(--teal-soft)" : "var(--card)"}
                stroke={selected === i ? "var(--teal)" : "var(--border)"}
                strokeWidth="2"
              />
            )}
            <text x={x} y={y + 5} textAnchor="middle" fill="var(--foreground)" fontSize="14">
              {i + 1}
            </text>
            <text x={x} y={y + 53} textAnchor="middle" fill="var(--foreground)" fontSize="12">
              {node.label.length > 24 ? node.label.slice(0, 23) + "…" : node.label}
            </text>
          </g>
        ))}
      </svg>
      {!compact && (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {scene.nodes.map((node, i) => (
              <Button
                key={node.id}
                size="lg"
                variant={selected === i ? "secondary" : "ghost"}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                {i + 1}. {node.label}
              </Button>
            ))}
          </div>
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">
            {scene.nodes[selected]?.label} ·{" "}
            {scene.nodes[selected]?.kind === "boundary"
              ? "Check permissions and constraints here."
              : "Track the evidence entering and leaving this step."}
          </figcaption>
        </>
      )}
      {metrics && (
        <div
          className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4"
          aria-label="Illustrative tradeoffs after your decision"
        >
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key}>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {key === "quality"
                    ? "Evidence quality"
                    : key === "speed"
                      ? "Speed"
                      : "Cost effort"}
                </span>
                <span>{value}/100</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div className="h-full bg-teal" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
