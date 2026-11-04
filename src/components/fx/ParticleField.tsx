import { useEffect, useRef } from "react";
import { motionAllowedNow, useMotionPref } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";

/**
 * Batched canvas particle sculpture: points orbit a 3D spiral "home", attached by springs,
 * repelled by the pointer. All per-frame work stays in refs + rAF (no React renders).
 * Paused offscreen / in background tabs / when motion is off; DPR and count are capped.
 */
export function ParticleField({ className, density = 1, variant = "spiral" }: { className?: string; density?: number; variant?: "spiral" | "ring" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const { allowed } = useMotionPref();
  const allowedRef = useRef(allowed);
  allowedRef.current = allowed;
  const kick = useRef<() => void>(() => {});

  useEffect(() => { kick.current(); }, [allowed]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) { if (fallback.current) fallback.current.hidden = false; cv.hidden = true; return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let W = 0, H = 0;
    const small = window.innerWidth < 640;
    const N = Math.round((small ? 650 : 1500) * density);
    // home params
    const r0 = new Float32Array(N), a0 = new Float32Array(N), z0 = new Float32Array(N), hue = new Uint8Array(N), size = new Float32Array(N);
    const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      if (variant === "ring") { r0[i] = 0.55 + (Math.random() - 0.5) * 0.25; a0[i] = Math.random() * Math.PI * 2; }
      else { r0[i] = Math.pow(t, 0.6) * 0.95 + Math.random() * 0.05; a0[i] = t * Math.PI * 2 * 4.2 + (i % 3) * 2.094; }
      z0[i] = (Math.random() - 0.5) * 0.5;
      const roll = Math.random();
      hue[i] = roll < 0.06 ? 2 : roll < 0.45 ? 1 : 0; // 0 mint, 1 ivory, 2 amber (rare anomaly)
      size[i] = 0.6 + Math.random() * 1.3;
    }
    const pointer = { x: -9999, y: -9999, active: false };
    let tilt = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const home = (i: number, time: number) => {
      const s = Math.min(W, H) * 0.48;
      const a = a0[i]! + time * 0.00012 * (1 + (1 - r0[i]!) * 0.6);
      const rx = Math.cos(a) * r0[i]! * s, rz = Math.sin(a) * r0[i]! * s;
      const tiltA = 1.05 + tilt;
      return [W / 2 + rx, H / 2 + rz * Math.cos(tiltA) + z0[i]! * s * Math.sin(tiltA) * 0.6, rz] as const;
    };
    for (let i = 0; i < N; i++) { const [hx, hy] = home(i, 0); x[i] = hx; y[i] = hy; }
    const COLORS = ["oklch(0.86 0.19 158 / A)", "oklch(0.95 0.02 85 / A)", "oklch(0.76 0.16 55 / A)"];
    const draw = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const R = Math.min(W, H) * 0.16, R2 = R * R;
      for (let i = 0; i < N; i++) {
        const [hx, hy, hz] = home(i, time);
        // spring to home
        let ax = (hx - x[i]!) * 0.035, ay = (hy - y[i]!) * 0.035;
        if (pointer.active) {
          const dx = x[i]! - pointer.x, dy = y[i]! - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) { const f = (1 - d2 / R2) * 2.4 / Math.sqrt(d2); ax += dx * f; ay += dy * f; }
        }
        vx[i] = (vx[i]! + ax) * 0.86; vy[i] = (vy[i]! + ay) * 0.86;
        x[i]! += vx[i]!; y[i]! += vy[i]!;
        const depth = 0.45 + 0.55 * ((hz / (Math.min(W, H) * 0.48)) * 0.5 + 0.5);
        const sp = Math.min(1, Math.hypot(vx[i]!, vy[i]!) * 0.15);
        ctx.fillStyle = COLORS[hue[i]!]!.replace("A", String((0.25 + 0.6 * depth + sp * 0.3).toFixed(2)));
        const sz = size[i]! * (0.6 + depth * 0.9);
        ctx.fillRect(x[i]!, y[i]!, sz, sz);
      }
      ctx.globalCompositeOperation = "source-over";
    };
    let raf = 0, visible = true, last = 0;
    const loop = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || !allowedRef.current) return;
      last = t; draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf) return;
      if (!motionAllowedNow() || !allowedRef.current) { draw(last); return; } // static frame
      raf = requestAnimationFrame(loop);
    };
    kick.current = start;
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) start(); }, { threshold: 0 });
    io.observe(cv);
    const ro = new ResizeObserver(() => { resize(); if (!raf) draw(last); });
    ro.observe(cv);
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
      tilt = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
    };
    const onLeave = () => { pointer.active = false; };
    const onVis = () => { if (!document.hidden) start(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      kick.current = () => {};
    };
  }, [density, variant]);

  return (
    <div className={cn("relative", className)} aria-hidden>
      <canvas ref={ref} className="absolute inset-0 size-full" />
      <div ref={fallback} hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_65%)]" />
    </div>
  );
}
