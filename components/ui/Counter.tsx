"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;           // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** id-ID thousand separator. Default true. */
  locale?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** If false, animates every time it enters viewport. Default true. */
  once?: boolean;
}

/**
 * Animated number counter. Starts animation when element enters viewport.
 * Respects prefers-reduced-motion (renders final value immediately).
 */
export default function Counter({
  value,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = true,
  className,
  style,
  once = true,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runAnimation = () => {
      if (reduced) { setDisplay(value); return; }
      const start = performance.now();
      const initial = 0;
      const delta = value - initial;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(initial + delta * eased);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") { runAnimation(); return; }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && startedRef.current) return;
            startedRef.current = true;
            setStarted(true);
            runAnimation();
            if (once) obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, once]);

  // Re-run when value changes AFTER first animation has completed
  useEffect(() => {
    if (!started) return;
    const reduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(value); return; }
    const start = performance.now();
    const initial = display;
    const delta = value - initial;
    if (delta === 0) return;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / Math.min(duration, 700));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(initial + delta * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = locale
    ? display.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : display.toFixed(decimals);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
