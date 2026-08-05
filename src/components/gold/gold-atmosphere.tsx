import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GoldSparks } from "@/components/gold/gold-sparks";

/**
 * Luxurious gold page shell: deep gold gradients, soft glow,
 * falling embers, rising sparks, and ambient twinkles.
 */
export function GoldAtmosphere({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  /** Lighter particle budget for gated/teaser views. */
  compact?: boolean;
}) {
  return (
    <div className={cn("gold-atmosphere", compact && "gold-atmosphere--compact", className)}>
      <div className="gold-atmosphere__glow" aria-hidden="true" />
      <div className="gold-atmosphere__veil" aria-hidden="true" />
      <GoldSparks
        variant="fall"
        count={compact ? 12 : 22}
        className="gold-atmosphere__falls"
      />
      <GoldSparks
        variant="rise"
        count={compact ? 8 : 14}
        className="gold-atmosphere__rises"
      />
      <GoldSparks
        variant="twinkle"
        count={compact ? 10 : 16}
        className="gold-atmosphere__twinkles"
      />
      <div className="gold-atmosphere__content">{children}</div>
    </div>
  );
}

export function GoldHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("gold-hero", className)}>
      <GoldSparks variant="fall" count={18} className="gold-hero__sparks" />
      <div className="gold-hero__shimmer" aria-hidden="true" />
      <div className="gold-hero__body">{children}</div>
    </div>
  );
}
