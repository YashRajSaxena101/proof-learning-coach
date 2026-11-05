import { useId, useState } from "react";
import { motion } from "motion/react";
import { type Scenario } from "@/domain/career/contracts";
import { scenePositions, sceneEffect, type SceneChoice } from "@/domain/career/scene";
import { Button } from "@/components/ui/button";
import { useMotionPref } from "@/lib/motion-pref";

/** Text/data only: validated graphs, seeded domain layouts and simulated choice effects. */
export function WorkScene({ scene, choice, compact = false }: {
  scene: Scenario["scene"]; choice?: SceneChoice | undefined; compact?: boolean;
}) {
  const { allowed } = useMotionPref();
  const [selected, setSelected] = useState(0);
  const id = useId().replace(/:/g, "");
  const positions = scenePositions(scene);
  const effect = sceneEffect(scene, choice);
  const selectedNode = scene.nodes[selected] ?? scene.nodes[0];
  const tone = effect.constrained ? "var(--warn)" : "var(--teal)";
  const motionStyle = allowed ? {} : { animation: "none" };
  const rows = (x: number, y: number, count: number, width = 55) => Array.from({ length: count }, (_, i) => (
    <rect key={i} x={x} y={y + i * 9} width={width - (i % 2) * 10} height={5} rx={2} fill={i % 2 ? "var(--particle-cyan)" : "var(--teal)"} opacity={0.65} />
  ));
  return (
    <figure className="work-scene py-5" aria-label={`${scene.domain} workplace scene`} data-domain={scene.domain}>
      <svg viewBox="0 0 680 355" className="w-full" role="img" aria-label={`${scene.domain} illustrative workflow: ${scene.nodes.map(v => v.label).join(" → ")}. ${effect.caption}`}>
        <defs>
          <marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill={tone} /></marker>
        </defs>
        {/* Different workplace structures, not decorative variants of one pipeline. */}
        {scene.domain === "ai" && <g>
          {[0, 1, 2].map(i => <g key={i} transform={`translate(${38 + i * 18} ${48 + i * 16})`}><rect width="60" height="68" rx="5" fill="var(--card)" stroke="var(--border)" />{rows(9, 12, 4, 40)}</g>)}
          <text x="340" y="32" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Permitted evidence → retrieval → grounded answer</text>
          <path d="M560 275h75v42h-75z" fill="var(--card)" stroke={tone} />{rows(571, 285, effect.evidenceCount, 50)}
        </g>}
        {scene.domain === "data" && <g>
          <text x="340" y="30" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Record rows → lineage join → aggregate</text>
          <rect x="265" y="85" width="160" height="200" rx="6" fill="var(--card)" stroke="var(--border)" />
          {Array.from({ length: choice ? effect.evidenceCount + 2 : 4 }, (_, i) => <g key={i}><rect x="280" y={104 + i * 24} width="130" height="17" rx="2" fill={effect.constrained && i % 2 ? "var(--warn-soft)" : "var(--teal-soft)"} /><path d={`M295 ${112 + i * 24}h35m10 0h50`} stroke={tone} strokeWidth="2" /></g>)}
          <text x="345" y="308" textAnchor="middle" fill={tone} fontSize="12">{choice ? effect.constrained ? "Repeated rows need a grain check" : "Focus: trace records before summing" : "Commit a choice to inspect the flow"}</text>
        </g>}
        {scene.domain === "software" && <g>
          <text x="340" y="30" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Request → queue → service → response</text>
          <rect x="30" y="100" width="620" height="150" rx="18" fill="none" stroke="var(--border)" strokeDasharray="4 6" />
          {rows(230, 262, choice ? effect.evidenceCount : 3, 90)}
          <text x="360" y="300" fill={tone} fontSize="12">{choice ? `Illustrative response speed: ${choice.metrics.speed}/100` : "Trace a packet through the request lifecycle"}</text>
        </g>}
        {scene.domain === "cloud" && <g>
          <text x="340" y="28" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Service fanout · illustrative capacity and resource cost</text>
          <circle cx="340" cy="175" r="45" fill="var(--teal-soft)" stroke={tone} /><text x="340" y="173" textAnchor="middle" fill="var(--foreground)" fontSize="12">Distribution</text><text x="340" y="190" textAnchor="middle" fill="var(--foreground)" fontSize="12">hub</text>
          {positions.map(p => <path key={p.node.id} d={`M340 175L${p.x} ${p.y}`} stroke={tone} opacity={choice ? 0.7 : 0.25} strokeDasharray={effect.constrained ? "3 8" : undefined} />)}
          <text x="340" y="348" textAnchor="middle" fill={tone} fontSize="12">{choice ? `Capacity proxy ${choice.metrics.speed} · resource cost ${choice.metrics.cost} (simulated)` : "Inspect the services before adding capacity"}</text>
        </g>}
        {scene.domain === "security" && <g>
          <rect x="25" y="52" width="285" height="260" rx="10" fill="var(--warn-soft)" opacity="0.35" /><rect x="370" y="52" width="285" height="260" rx="10" fill="var(--teal-soft)" opacity="0.35" />
          <text x="160" y="75" textAnchor="middle" fill="var(--foreground)" fontSize="12">Requesting zone</text><text x="510" y="75" textAnchor="middle" fill="var(--foreground)" fontSize="12">Protected zone</text>
          <path d="M340 55v240" stroke="var(--warn)" strokeDasharray="5 7" strokeWidth="2" />
          <text x="340" y="327" textAnchor="middle" fill={tone} fontSize="12">{choice ? effect.constrained ? "Simulated boundary: hold request for review" : "Simulated boundary: scoped access path" : "Access is not decided until you choose"}</text>
        </g>}
        {scene.domain === "product" && <g>
          <text x="340" y="28" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Visitors → experiment split → comparison</text>
          <path d="M35 110L185 135V205L35 230Z" fill="var(--teal-soft)" stroke="var(--border)" />
          <path d="M190 170L260 90H480M190 170L260 245H480" fill="none" stroke="var(--particle-cyan)" opacity="0.45" />
          <text x="440" y="75" fill="var(--muted-foreground)" fontSize="12">Comparison A</text><text x="440" y="277" fill="var(--muted-foreground)" fontSize="12">Comparison B</text>
          {choice && <g><rect x="460" y="89" width={choice.metrics.quality * 0.9} height="8" fill="var(--teal)" /><rect x="460" y="241" width={choice.metrics.speed * 0.9} height="8" fill="var(--particle-cyan)" /><text x="340" y="330" textAnchor="middle" fill={tone} fontSize="12">Illustrative alternatives, not measured conversion rates</text></g>}
        </g>}
        {scene.edges.map((edge, i) => {
          const a = positions.find(p => p.node.id === edge.from), b = positions.find(p => p.node.id === edge.to);
          if (!a || !b) return null;
          const bend = scene.domain === "cloud" || scene.domain === "product" ? 0 : -30;
          const d = `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + bend} ${b.x} ${b.y}`;
          const focus = selectedNode?.id === edge.from || selectedNode?.id === edge.to;
          return <g key={`${edge.from}-${edge.to}`} opacity={focus || choice ? 1 : 0.6}>
            <path d={d} fill="none" stroke={focus ? tone : "var(--border)"} strokeWidth={choice ? 2.5 : 1.5} markerEnd={`url(#${id}-arrow)`} strokeDasharray={effect.constrained ? "5 6" : undefined} />
            {allowed && Array.from({ length: scene.domain === "ai" ? effect.evidenceCount : 1 }, (_, packet) => <circle key={packet} r={scene.domain === "data" ? 3 : 4} fill={tone}>
              <animateMotion dur={`${effect.duration}s`} repeatCount="indefinite" begin={`${i * 0.3 + packet * 0.6}s`} path={d} />
            </circle>)}
          </g>;
        })}
        {positions.map(({ node, x, y }, i) => <g key={node.id}>
          <motion.g initial={false} animate={{ opacity: selected === i ? 1 : 0.9 }} transition={{ duration: allowed ? 0.2 : 0 }} style={motionStyle}>
            {node.kind === "boundary" ? <rect x={x - 24} y={y - 24} width="48" height="48" rx="7" fill="var(--card)" stroke={tone} strokeWidth="2" /> : <circle cx={x} cy={y} r={node.kind === "output" ? 28 : 24} fill="var(--card)" stroke={selected === i ? tone : "var(--border)"} strokeWidth="2" />}
            <text x={x} y={y + 5} textAnchor="middle" fill="var(--foreground)" fontSize="14">{i + 1}</text>
          </motion.g>
          <text x={x} y={y + 43} textAnchor="middle" fill="var(--foreground)" fontSize="12">
            {node.label.split(/\s+/).reduce<string[]>((lines, word) => { const last = lines.at(-1); if (!last || last.length + word.length > 19) lines.push(word); else lines[lines.length - 1] = `${last} ${word}`; return lines; }, []).map((line, j) => <tspan key={j} x={x} dy={j ? 14 : 0}>{line}</tspan>)}
          </text>
        </g>)}
      </svg>
      {!compact && <>
        <div className="flex flex-wrap justify-center gap-2">{scene.nodes.map((node, i) => <Button key={node.id} size="lg" variant={selected === i ? "secondary" : "ghost"} aria-pressed={selected === i} className="h-auto min-h-11 whitespace-normal py-3" onClick={() => setSelected(i)}>{i + 1}. {node.label}</Button>)}</div>
        <figcaption className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{selectedNode?.label} · {selectedNode?.kind === "boundary" ? "Check permissions and constraints here." : "Track the evidence entering and leaving this step."}</figcaption>
      </>}
      {choice && <div className="mt-5 border-l-2 border-teal pl-4" aria-live="polite"><p className="text-sm leading-relaxed text-muted-foreground">{effect.caption}</p><p className="mt-2 text-xs text-muted-foreground">Illustrative tradeoffs, not measured outcomes or a learner grade.</p></div>}
      {choice && !compact && <div className="mx-auto mt-5 grid max-w-xl gap-4 sm:grid-cols-3" aria-label="Simulated tradeoffs after your decision">{([
        ["quality", effect.qualityLabel], ["speed", "Response speed (higher is faster)"], ["cost", "Resource cost (lower is better)"],
      ] as const).map(([key, label]) => <div key={key}><p className="mb-2 text-xs leading-relaxed text-muted-foreground">{label} · {choice.metrics[key]}/100</p><div className="h-1.5 bg-muted"><div className="h-full bg-teal" style={{ width: `${choice.metrics[key]}%` }} /></div></div>)}</div>}
    </figure>
  );
}
