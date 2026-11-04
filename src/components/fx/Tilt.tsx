import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { useRef } from "react";
import { useMotionPref } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";

/** Small pointer-driven tilt + spotlight. Spring-damped, max ±4°, never translates (click targets stay put). */
export function Tilt({ className, children, max = 4, ...rest }: HTMLMotionProps<"div"> & { max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowed } = useMotionPref();
  const px = useMotionValue(0.5), py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 22 }), sy = useSpring(py, { stiffness: 220, damping: 22 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  return (
    <motion.div ref={ref} {...rest}
      className={cn("spot", className)}
      style={allowed ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      onPointerMove={(e) => {
        const el = ref.current; if (!el || e.pointerType !== "mouse") return;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        px.set(nx); py.set(ny);
        el.style.setProperty("--mx", `${nx * 100}%`); el.style.setProperty("--my", `${ny * 100}%`); el.style.setProperty("--spot", "1");
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); ref.current?.style.setProperty("--spot", "0"); }}>
      {children}
    </motion.div>
  );
}

/** Button/link wrapper with hover + press springs (scale only, stays under the pointer). */
export function Springy({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span className={cn("inline-flex", className)} whileHover={{ scale: 1.035 }} whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}>
      {children}
    </motion.span>
  );
}
