/**
 * Proposed mathematical defaults for later simulation phases.
 * Nothing here is authoritative until the product owner confirms
 * (see docs/implementation-plan.md → Mathematical assumptions).
 */

export const SizingMode = {
  FixedFractional: "fixed_fractional",
  FixedCashRisk: "fixed_cash_risk",
  VolatilityTargeting: "volatility_targeting",
  KellyEducational: "kelly_educational",
} as const;

export type SizingMode = (typeof SizingMode)[keyof typeof SizingMode];

export const ReferencePriceMethod = {
  SyntheticMid: "synthetic_mid",
  LastTrade: "last_trade",
  SessionVwap: "session_vwap",
  InstructorMark: "instructor_mark",
} as const;

export type ReferencePriceMethod =
  (typeof ReferencePriceMethod)[keyof typeof ReferencePriceMethod];

export const LeverageTransitionMode = {
  Gate: "gate",
  Compare: "compare",
  Caps: "caps",
} as const;

export type LeverageTransitionMode =
  (typeof LeverageTransitionMode)[keyof typeof LeverageTransitionMode];

/** Draft defaults — pending owner confirmation before Phase 5. */
export const proposedMathDefaults = {
  defaultSizingMode: SizingMode.FixedFractional,
  defaultRiskFraction: 0.01,
  kellyDisplayFraction: 0.5,
  primaryReferencePrice: ReferencePriceMethod.LastTrade,
  gradedReferencePrice: ReferencePriceMethod.InstructorMark,
  leverageTransitionModes: [
    LeverageTransitionMode.Gate,
    LeverageTransitionMode.Compare,
  ] as const,
  maxEducationalLeverage: 10,
  defaultRoundTripFeeBps: 2,
  gradedLabsDeterministic: true,
  awaitingOwnerConfirmation: true,
} as const;
