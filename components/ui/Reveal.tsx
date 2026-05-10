"use client";
import { useEffect, useRef, useState } from "react";
import type { ElementType } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface Props {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;          // ms
  duration?: number;       // ms
  distance?: number;       // px
  once?: boolean;
  threshold?: number;      // 0..1
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  distance = 28,
  once = true,
  threshold = 0.12,
  as: Tag = "div",
  className,
  style,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion
    const prefersReduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setVisible(true); return; }

    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once, threshold]);

  const offset = (() => {
    switch (direction) {
      case "up":    return `translate3d(0, ${distance}px, 0)`;
      case "down":  return `translate3d(0, -${distance}px, 0)`;
      case "left":  return `translate3d(${distance}px, 0, 0)`;
      case "right": return `translate3d(-${distance}px, 0, 0)`;
      case "none":
      default:      return "none";
    }
  })();

  const mergedStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : offset,
    transition: `opacity ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
    willChange: "opacity, transform",
    ...style,
  };

  const Cmp = Tag as ElementType;
  return (
    <Cmp ref={ref as React.Ref<HTMLElement>} className={className} style={mergedStyle}>
      {children}
    </Cmp>
  );
}
