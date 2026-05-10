"use client";

interface Props {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, radius = 8, className, style }: Props) {
  return (
    <span
      className={`sk ${className ?? ""}`}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height = 180 }: { height?: number }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: "var(--cw)",
        border: "1px solid var(--bo)",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <Skeleton height={height} radius={12} />
      <Skeleton width="70%" height={16} />
      <Skeleton width="40%" height={12} />
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
      gap: 18,
    }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          background: "var(--cw)",
          border: "1px solid var(--bo)", borderRadius: 12,
        }}>
          <Skeleton width={44} height={44} radius={10} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </div>
          <Skeleton width={50} height={22} radius={99} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
