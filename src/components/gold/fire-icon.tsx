"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "fire-icon--xs",
  sm: "fire-icon--sm",
  md: "fire-icon--md",
  lg: "fire-icon--lg",
} as const;

export function FireIcon({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const outer = `fire-outer-${uid}`;
  const mid = `fire-mid-${uid}`;
  const core = `fire-core-${uid}`;
  const glow = `fire-glow-${uid}`;

  return (
    <span
      className={cn("fire-icon", sizeMap[size], className)}
      aria-hidden="true"
    >
      <svg
        className="fire-icon__svg"
        viewBox="0 0 32 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <defs>
          <linearGradient id={outer} x1="16" y1="42" x2="16" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff3b00" />
            <stop offset="38%" stopColor="#ff7a00" />
            <stop offset="68%" stopColor="#ffb82e" />
            <stop offset="100%" stopColor="#ffe9a0" />
          </linearGradient>
          <linearGradient id={mid} x1="16" y1="40" x2="16" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff5c00" />
            <stop offset="45%" stopColor="#ffb020" />
            <stop offset="100%" stopColor="#fff6c8" />
          </linearGradient>
          <linearGradient id={core} x1="16" y1="38" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff0a8" />
            <stop offset="55%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fffceb" />
          </linearGradient>
          <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.35" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          className="fire-icon__base-glow"
          cx="16"
          cy="38.5"
          rx="9"
          ry="3.2"
          fill="rgba(255, 120, 20, 0.55)"
        />

        <path
          className="fire-icon__tongue fire-icon__tongue--outer"
          d="M16 2.2C12.8 8.4 7.2 12.6 6.1 20.4c-1 7.2 3.6 14.6 9.9 16.8 6.3-2.2 10.9-9.6 9.9-16.8C24.8 12.6 19.2 8.4 16 2.2Z"
          fill={`url(#${outer})`}
          filter={`url(#${glow})`}
        />

        <path
          className="fire-icon__tongue fire-icon__tongue--side-a"
          d="M10.2 18.5C8.4 22.8 8.1 27.4 10.6 31.2c2.1 3.2 5.4 4.6 5.4 4.6s-4.8-5.8-4.2-12.4c.2-2.2-.4-3.6-1.6-4.9Z"
          fill="#ff6a00"
          opacity="0.85"
        />

        <path
          className="fire-icon__tongue fire-icon__tongue--side-b"
          d="M22.2 17.8c1.6 4.1 1.7 8.8-.7 12.7-2 3.2-5.5 4.8-5.5 4.8s4.6-5.6 4.1-12.1c-.2-2.1.5-3.6 2.1-5.4Z"
          fill="#ff8f1a"
          opacity="0.8"
        />

        <path
          className="fire-icon__tongue fire-icon__tongue--mid"
          d="M16 9.5c-2.1 4.1-5.4 6.7-6 11.6-.7 5.4 2.5 10.6 6 12.2 3.5-1.6 6.7-6.8 6-12.2-.6-4.9-3.9-7.5-6-11.6Z"
          fill={`url(#${mid})`}
        />

        <path
          className="fire-icon__tongue fire-icon__tongue--core"
          d="M16 18.2c-1.25 2.5-2.9 4-3.2 6.7-.35 3.1 1.35 5.9 3.2 6.8 1.85-.9 3.55-3.7 3.2-6.8-.3-2.7-1.95-4.2-3.2-6.7Z"
          fill={`url(#${core})`}
        />
      </svg>
    </span>
  );
}

export function GoldWordmark({
  size = "sm",
  className,
  label = "Gold",
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("gold-wordmark", className)}>
      <FireIcon size={size} />
      <span>{label}</span>
    </span>
  );
}
