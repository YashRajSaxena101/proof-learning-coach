import { motion } from "motion/react";
import { ParticleField } from "@/components/fx/ParticleField";

const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1, ease: "easeOut" as const } };

/** One illustrative visual per slide. Values shown are the fictional scenario's own numbers only. */
export function SlideVisual({ index }: { index: number }) {
  const box = "hidden md:block w-full max-w-md justify-self-end";
  switch (index) {
    case 0:
      return (
        <svg viewBox="0 0 300 220" className={box} aria-hidden>
          <rect x="50" y="140" width="60" height="60" rx="6" fill="var(--muted-foreground)" opacity="0.4" />
          <motion.rect x="170" width="60" rx="6" fill="var(--teal)" initial={{ y: 200, height: 0 }} animate={{ y: 80, height: 120 }} transition={{ type: "spring", stiffness: 70, damping: 14 }} />
          <text x="80" y="130" textAnchor="middle" fill="var(--foreground)" fontFamily="Fraunces" fontSize="20">$500</text>
          <text x="200" y="70" textAnchor="middle" fill="var(--foreground)" fontFamily="Fraunces" fontSize="20">$1,000?</text>
          <text x="200" y="215" textAnchor="middle" fill="var(--warn)" fontFamily="JetBrains Mono" fontSize="9">REPORTED · UNVERIFIED</text>
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 300 200" className={box} aria-hidden>
          <motion.path d="M20 150 C 100 150, 120 60, 280 50" stroke="var(--teal)" strokeWidth="2" fill="none" {...draw} />
          <motion.path d="M20 150 C 100 150, 160 140, 280 120" stroke="var(--warn)" strokeWidth="2" strokeDasharray="5 5" fill="none" {...draw} />
          <text x="280" y="40" textAnchor="end" fontSize="10" fill="var(--teal)" fontFamily="JetBrains Mono">syntax practice</text>
          <text x="280" y="140" textAnchor="end" fontSize="10" fill="var(--warn)" fontFamily="JetBrains Mono">judgment on real data</text>
        </svg>
      );
    case 2:
    case 4: {
      const labels = index === 2 ? ["Predict", "Inspect", "Trace", "Repair", "Teach", "Transfer"] : ["High conf. wrong", "Low conf. wrong", "Hints"];
      return (
        <svg viewBox="0 0 300 300" className={box} aria-hidden>
          <motion.circle cx="150" cy="150" r="110" fill="none" stroke="var(--teal)" strokeOpacity="0.5" {...draw} />
          {labels.map((l, k) => {
            const a = (k / labels.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.g key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 * k }}>
                <circle cx={150 + Math.cos(a) * 110} cy={150 + Math.sin(a) * 110} r="7" fill="var(--teal)" />
                <text x={150 + Math.cos(a) * 80} y={154 + Math.sin(a) * 80} textAnchor="middle" fontSize="11" fill="var(--foreground)">{l}</text>
              </motion.g>
            );
          })}
        </svg>
      );
    }
    case 3:
      return <ParticleField className="hidden md:block aspect-square w-full max-w-md justify-self-end" density={0.6} />;
    case 5:
      return (
        <svg viewBox="0 0 300 220" className={box} aria-hidden>
          {[["Browser", 30], ["App + rules", 115], ["Account DB", 200]].map(([l, x]) => (
            <g key={l as string}><rect x={x as number} y="40" width="75" height="44" rx="8" fill="var(--card)" stroke="var(--teal)" /><text x={(x as number) + 37} y="66" textAnchor="middle" fontSize="10" fill="var(--foreground)">{l}</text></g>
          ))}
          <rect x="115" y="140" width="75" height="44" rx="8" fill="var(--card)" stroke="var(--warn)" strokeDasharray="4 4" />
          <text x="152" y="160" textAnchor="middle" fontSize="10" fill="var(--foreground)">AI coach</text>
          <text x="152" y="174" textAnchor="middle" fontSize="8" fill="var(--warn)" fontFamily="JetBrains Mono">key pending</text>
          <motion.path d="M105 62 H115 M190 62 H200 M152 84 V140" stroke="var(--muted-foreground)" fill="none" {...draw} />
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 300 200" className={box} aria-hidden>
          <line x1="30" y1="170" x2="280" y2="170" stroke="var(--border)" />
          {[0, 1].map((k) => <rect key={k} x={80 + k * 100} y="60" width="60" height="110" rx="6" fill="none" stroke="var(--muted-foreground)" strokeDasharray="4 4" />)}
          <text x="110" y="190" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">before</text>
          <text x="210" y="190" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">after</text>
          <text x="160" y="40" textAnchor="middle" fontSize="11" fill="var(--warn)" fontFamily="JetBrains Mono">NOT YET MEASURED</text>
        </svg>
      );
    default:
      return <ParticleField variant="ring" className="hidden md:block aspect-square w-full max-w-md justify-self-end" density={0.5} />;
  }
}
