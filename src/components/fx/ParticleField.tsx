import { useEffect, useRef } from "react";
import { useMotionPref, motionAllowedNow } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";
/** Cached glow sprites, batched spring dynamics and no frame-driven React state. */
export function ParticleField({
  className,
  density = 1,
  variant = "spiral",
}: {
  className?: string;
  density?: number;
  variant?: "spiral" | "ring";
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { allowed } = useMotionPref();
  const enabled = useRef(allowed);
  enabled.current = allowed;
  const kick = useRef<() => void>(() => {});
  useEffect(() => kick.current(), [allowed]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const small = window.innerWidth < 640;
    const N = Math.min(
      small ? 700 : 2400,
      Math.max(120, Math.round((small ? 500 : 1800) * density)),
    );
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const css = getComputedStyle(document.documentElement);
    const colors = ["--particle-mint", "--particle-ivory", "--particle-cyan"].map((v) =>
      css.getPropertyValue(v).trim(),
    );
    const sprites = colors.map((color) => {
      const c = document.createElement("canvas");
      c.width = c.height = 48;
      const g = c.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
        grad.addColorStop(0, color);
        grad.addColorStop(0.18, color);
        grad.addColorStop(1, "transparent");
        g.fillStyle = grad;
        g.fillRect(0, 0, 48, 48);
      }
      return c;
    });
    const points = Array.from({ length: N }, (_, i) => ({
      r: variant === "ring" ? 0.6 + Math.random() * 0.2 : Math.sqrt(Math.random()),
      a: (i / N) * Math.PI * 9 + Math.random(),
      z: Math.random(),
      size: i % 47 === 0 ? 4 + Math.random() : 1.5 + Math.random() * 2,
      color: i % 11 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
    let W = 0,
      H = 0,
      raf = 0,
      visible = true,
      last = 0;
    const pointer = { x: 0, y: 0, active: false };
    let ripple: { x: number; y: number; at: number } | undefined;
    const resize = () => {
      const rect = cv.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const home = (p: (typeof points)[number], t: number) => {
      const a = p.a + t * 0.000035;
      return {
        x: W / 2 + Math.cos(a) * p.r * W * 0.49,
        y: H / 2 + Math.sin(a) * p.r * H * 0.44 * (0.55 + p.z * 0.4),
      };
    };
    resize();
    points.forEach((p) => {
      const h = home(p, 0);
      p.x = h.x;
      p.y = h.y;
    });
    const draw = (t: number, moving: boolean) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const p of points) {
        const h = home(p, t);
        if (moving) {
          let ax = (h.x - p.x) * 0.025,
            ay = (h.y - p.y) * 0.025;
          if (pointer.active) {
            const dx = p.x - pointer.x,
              dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1 && dist < 105) {
              const f = (1 - dist / 105) * 1.7;
              ax += (dx / dist) * f;
              ay += (dy / dist) * f;
            }
          }
          if (ripple) {
            const dx = p.x - ripple.x,
              dy = p.y - ripple.y,
              dist = Math.hypot(dx, dy);
            const age = t - ripple.at;
            const radius = age * 0.25;
            if (age < 1000 && dist > 1 && Math.abs(dist - radius) < 35) {
              ax += (dx / dist) * 1.3 * (1 - age / 1000);
              ay += (dy / dist) * 1.3 * (1 - age / 1000);
            }
          }
          p.vx = (p.vx + ax) * 0.88;
          p.vy = (p.vy + ay) * 0.88;
          p.x += p.vx;
          p.y += p.vy;
        }
        const centerDistance = Math.hypot((p.x-W/2)/(W*0.36), (p.y-H/2)/(H*0.35));
        const legibility = density >= 1 && centerDistance < 1 ? 0.12 + centerDistance * 0.65 : 1;
        ctx.globalAlpha = (0.18 + p.z * 0.45) * legibility;
        const size = p.size * (1 + p.z * 0.25);
        const sprite = sprites[p.color];
        if (sprite) ctx.drawImage(sprite, p.x - size * 2, p.y - size * 2, size * 4, size * 4);
        ctx.globalAlpha = (0.45 + p.z * 0.4) * legibility;
        ctx.fillStyle = colors[p.color] ?? colors[0] ?? css.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    const loop = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || !enabled.current) return;
      last = t;
      draw(t, true);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf) {
        if (!enabled.current) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else return;
      }
      if (!enabled.current || !motionAllowedNow()) {
        draw(last, false);
        return;
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    kick.current = start;
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) start();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(cv);
    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) draw(last, false);
    });
    ro.observe(cv);
    const onMove = (e: PointerEvent) => {
      if (!enabled.current || e.pointerType === "touch") return;
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= W && pointer.y <= H;
    };
    const onTap = (e: PointerEvent) => {
      if (!enabled.current) return;
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      if (x >= 0 && x <= W && y >= 0 && y <= H) ripple = { x, y, at: performance.now() };
    };
    const leave = () => {
      pointer.active = false;
    };
    const vis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else start();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onTap, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", vis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onTap);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", vis);
      kick.current = () => {};
    };
  }, [density, variant]);
  return (
    <div className={cn("relative", className)} aria-hidden>
      <canvas ref={ref} className="absolute inset-0 size-full" />
    </div>
  );
}
