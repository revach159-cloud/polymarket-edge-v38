import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Deterministic 0–1 hash so SSR and client markup match. */
function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export type GoldSparkVariant = "fall" | "rise" | "twinkle";

function buildFallSparks(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = lerp(4, 96, hash01(i, 1));
    const y = lerp(-8, 18, hash01(i, 2));
    const size = lerp(2.6, 7.2, hash01(i, 3));
    const dx = lerp(-110, 110, hash01(i, 4));
    const dy = lerp(160, 460, hash01(i, 5));
    const duration = lerp(4.8, 11.2, hash01(i, 6));
    const delay = -lerp(0.2, 10, hash01(i, 7));
    const r0 = lerp(-28, 28, hash01(i, 8));
    const r1 = lerp(-90, 90, hash01(i, 9));
    const s0 = lerp(0.7, 1.25, hash01(i, 10));
    const s1 = lerp(0.18, 0.55, hash01(i, 11));
    const alpha = lerp(0.45, 0.98, hash01(i, 12));
    const blur = lerp(0.02, 0.75, hash01(i, 13));

    return {
      style: {
        ["--x" as string]: `${x.toFixed(2)}%`,
        ["--y" as string]: `${y.toFixed(2)}%`,
        ["--size" as string]: `${size.toFixed(2)}px`,
        ["--dx" as string]: `${dx.toFixed(1)}px`,
        ["--dy" as string]: `${dy.toFixed(1)}px`,
        ["--duration" as string]: `${duration.toFixed(2)}s`,
        ["--delay" as string]: `${delay.toFixed(2)}s`,
        ["--r0" as string]: `${r0.toFixed(1)}deg`,
        ["--r1" as string]: `${r1.toFixed(1)}deg`,
        ["--s0" as string]: s0.toFixed(2),
        ["--s1" as string]: s1.toFixed(2),
        ["--alpha" as string]: alpha.toFixed(2),
        ["--blur" as string]: `${blur.toFixed(2)}px`,
      } as CSSProperties,
    };
  });
}

function buildRiseSparks(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const left = lerp(3, 97, hash01(i, 21));
    const size = lerp(3.5, 9.5, hash01(i, 22));
    const duration = lerp(5.2, 10.5, hash01(i, 23));
    const delay = -lerp(0.5, 9, hash01(i, 24));
    const drift = lerp(-28, 28, hash01(i, 25));

    return {
      style: {
        left: `${left.toFixed(2)}%`,
        width: `${size.toFixed(2)}px`,
        height: `${size.toFixed(2)}px`,
        animationDuration: `${duration.toFixed(2)}s`,
        animationDelay: `${delay.toFixed(2)}s`,
        ["--drift" as string]: `${drift.toFixed(1)}px`,
      } as CSSProperties,
    };
  });
}

function buildTwinkles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const left = lerp(2, 98, hash01(i, 31));
    const top = lerp(4, 92, hash01(i, 32));
    const duration = lerp(2.6, 5.2, hash01(i, 33));
    const delay = -lerp(0.2, 4.8, hash01(i, 34));
    const size = lerp(2, 5.5, hash01(i, 35));

    return {
      style: {
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${size.toFixed(2)}px`,
        height: `${size.toFixed(2)}px`,
        animationDuration: `${duration.toFixed(2)}s`,
        animationDelay: `${delay.toFixed(2)}s`,
      } as CSSProperties,
    };
  });
}

/**
 * Decorative gold/fire particles. Caps counts for mobile performance.
 * Uses deterministic styles (no Math.random) for hydration safety.
 */
export function GoldSparks({
  variant = "fall",
  count,
  className,
}: {
  variant?: GoldSparkVariant;
  /** Override particle count; defaults are mobile-safe. */
  count?: number;
  className?: string;
}) {
  if (variant === "fall") {
    const n = count ?? 22;
    const sparks = buildFallSparks(n);
    return (
      <div className={cn("gold-sparks gold-sparks--fall", className)} aria-hidden="true">
        {sparks.map((s, i) => (
          <i key={i} className="gold-ember-fall" style={s.style} />
        ))}
      </div>
    );
  }

  if (variant === "rise") {
    const n = count ?? 14;
    const sparks = buildRiseSparks(n);
    return (
      <div className={cn("gold-sparks gold-sparks--rise", className)} aria-hidden="true">
        {sparks.map((s, i) => (
          <span key={i} className="gold-ember-rise" style={s.style} />
        ))}
      </div>
    );
  }

  const n = count ?? 16;
  const sparks = buildTwinkles(n);
  return (
    <div className={cn("gold-sparks gold-sparks--twinkle", className)} aria-hidden="true">
      {sparks.map((s, i) => (
        <i key={i} className="gold-twinkle" style={s.style} />
      ))}
    </div>
  );
}
