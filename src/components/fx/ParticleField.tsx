import { useEffect, useRef } from "react";
import { useMotionPref, motionAllowedNow } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";
import { storyShape, storyWeights } from "./particle-shapes";
/** Cached glow sprites, batched spring dynamics and no frame-driven React state. */
export function ParticleField({
  className,
  density = 1,
  variant = "spiral",
  scrollStory = false,
}: {
  className?: string;
  density?: number;
  variant?: "spiral" | "ring";
  scrollStory?: boolean;
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
      shape: scrollStory ? storyShape(i, N, (i % 19) / 18) : undefined,
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
    const pointer = { x: 0, y: 0, active: false, pressed: false };
    let ripple: { x: number; y: number; at: number } | undefined;
    let progress = 0;
    let scrollRange = 1;
    const onScroll = () => {
      progress = Math.max(0, Math.min(1, window.scrollY / scrollRange));
    };
    const resize = () => {
      const rect = cv.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      onScroll();
    };
    let weights = storyWeights(0);
    const home = (p: (typeof points)[number], t: number) => {
      const a = p.a + t * 0.000035;
      const x = W / 2 + Math.cos(a) * p.r * W * 0.49;
      const y = H / 2 + Math.sin(a) * p.r * H * 0.44 * (0.55 + p.z * 0.4);
      if (!p.shape || weights.field === 1) return { x, y };
      const size = Math.min(W, H);
      const centerX = W * (W < 640 ? 0.5 : 0.76);
      return {
        x:
          x * weights.field +
          (centerX + size * p.shape.orbitX) * weights.orbit +
          (centerX + size * p.shape.bookX) * weights.book,
        y:
          y * weights.field +
          (H * 0.45 + size * p.shape.orbitY) * weights.orbit +
          (H * 0.5 + size * p.shape.bookY) * weights.book,
      };
    };
    resize();
    points.forEach((p) => {
      const h = home(p, 0);
      p.x = h.x;
      p.y = h.y;
    });
    const draw = (t: number, moving: boolean) => {
      // Keep spring motion consistent on high-refresh screens and bound wake-up jumps.
      const dt = last ? Math.min(2, Math.max(0.25, (t - last) / (1000 / 60))) : 1;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      weights = storyWeights(scrollStory ? progress : 0);
      const storyAlpha = scrollStory ? 0.42 + weights.field * 0.58 : 1;
      for (const p of points) {
        const h = home(p, t);
        if (moving) {
          let ax = (h.x - p.x) * 0.025,
            ay = (h.y - p.y) * 0.025;
          if (pointer.active) {
            const dx = p.x - pointer.x,
              dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            const reach = pointer.pressed ? 185 : 125;
            if (dist > 1 && dist < reach) {
              const influence = 1 - dist / reach;
              const f = influence * (pointer.pressed ? -3.2 : 2.4);
              ax += (dx / dist) * f;
              ay += (dy / dist) * f;
              if (pointer.pressed) {
                ax -= (dy / dist) * influence * 1.2;
                ay += (dx / dist) * influence * 1.2;
              }
            }
          }
          if (ripple) {
            const dx = p.x - ripple.x,
              dy = p.y - ripple.y,
              dist = Math.hypot(dx, dy);
            const age = t - ripple.at;
            const radius = age * 0.25;
            if (age < 1000 && dist > 1 && Math.abs(dist - radius) < 35) {
              ax += (dx / dist) * 2.2 * (1 - age / 1000);
              ay += (dy / dist) * 2.2 * (1 - age / 1000);
            }
          }
          const damping = Math.pow(0.88, dt);
          p.vx = (p.vx + ax * dt) * damping;
          p.vy = (p.vy + ay * dt) * damping;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        const centerDistance = Math.hypot((p.x - W / 2) / (W * 0.36), (p.y - H / 2) / (H * 0.35));
        const legibility = density >= 1 && centerDistance < 1 ? 0.12 + centerDistance * 0.65 : 1;
        ctx.globalAlpha = (0.18 + p.z * 0.45) * legibility * storyAlpha;
        const size = p.size * (1 + p.z * 0.25);
        const sprite = sprites[p.color];
        if (sprite) ctx.drawImage(sprite, p.x - size * 2, p.y - size * 2, size * 4, size * 4);
        ctx.globalAlpha = (0.45 + p.z * 0.4) * legibility * storyAlpha;
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
      if (last && t - last < (density < 0.5 ? 30 : 15)) {
        raf = requestAnimationFrame(loop);
        return;
      }
      draw(t, true);
      last = t;
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
    if (scrollStory) {
      ro.observe(document.body);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
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
      if (x >= 0 && x <= W && y >= 0 && y <= H) {
        ripple = { x, y, at: performance.now() };
        if (
          e.pointerType !== "touch" &&
          !(e.target instanceof Element && e.target.closest("a,button,input,textarea,select,label"))
        ) {
          pointer.x = x;
          pointer.y = y;
          pointer.active = true;
          pointer.pressed = true;
        }
      }
    };
    const release = () => {
      pointer.pressed = false;
    };
    const leave = () => {
      pointer.active = false;
      pointer.pressed = false;
    };
    const vis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else start();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onTap, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    document.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", vis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      if (scrollStory) window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onTap);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", leave);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", vis);
      kick.current = () => {};
    };
  }, [density, variant, scrollStory]);
  return (
    <div className={cn("relative", className)} aria-hidden>
      <canvas ref={ref} className="absolute inset-0 size-full" />
    </div>
  );
}
