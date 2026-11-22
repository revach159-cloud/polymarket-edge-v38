/**
 * ZigZag Method mathematical defaults for later engine phases.
 * Nothing here is authoritative until the product owner confirms
 * (see Project store docs/implementation-plan.md → Mathematical assumptions).
 *
 * Primary methodology is ZigZag reinforcement — not Kelly / fixed-fractional.
 */

/** How the next reinforcement size is computed. */
export const ReinforcementSizingMode = {
  /** Sum of capital explicitly allocated / reinforced so far (default until confirmed). */
  CumulativeAllocatedCapital: "cumulative_allocated_capital",
  /** Mark-to-market equity of the open position, including unrealized PnL. */
  PositionEquityInclUnrealized: "position_equity_incl_unrealized",
} as const;

export type ReinforcementSizingMode =
  (typeof ReinforcementSizingMode)[keyof typeof ReinforcementSizingMode];

/** How 1x adverse educational steps are marked on the path. */
export const AdverseMoveReference = {
  /** Default proposal: educational ladder on a 10% price interval. */
  TenPercentInterval: "ten_percent_interval",
  PercentOfEntry: "percent_of_entry",
  PercentOfLastReinforcement: "percent_of_last_reinforcement",
  InstructorMark: "instructor_mark",
} as const;

export type AdverseMoveReference =
  (typeof AdverseMoveReference)[keyof typeof AdverseMoveReference];

/**
 * 1x → 10x paths are not equivalent — keep them distinct in the engine/UI.
 */
export const LeverageTransitionPath = {
  SeparateTenXPosition: "separate_10x_position",
  ChangeLeverageOnExisting: "change_leverage_on_existing",
} as const;

export type LeverageTransitionPath =
  (typeof LeverageTransitionPath)[keyof typeof LeverageTransitionPath];

/** “Realize 75% profit” has two distinct interpretations. */
export const ProfitRealizationMode = {
  WithdrawProfit: "withdraw_profit",
  CloseSeventyFivePercentPosition: "close_75_percent_position",
} as const;

export type ProfitRealizationMode =
  (typeof ProfitRealizationMode)[keyof typeof ProfitRealizationMode];

export const PnlMeasurementBasis = {
  RealizedOnly: "realized_only",
  RealizedPlusUnrealized: "realized_plus_unrealized",
  EquityVsAllocatedDrawdown: "equity_vs_allocated_drawdown",
} as const;

export type PnlMeasurementBasis =
  (typeof PnlMeasurementBasis)[keyof typeof PnlMeasurementBasis];

/** Draft defaults — pending owner confirmation before Phase 4 engine work. */
export const proposedMathDefaults = {
  methodology: "zigzag_reinforcement" as const,
  reinforcementSizingMode: ReinforcementSizingMode.CumulativeAllocatedCapital,
  adverseMoveReference: AdverseMoveReference.TenPercentInterval,
  adverseMoveIntervalPct: 0.1,
  tenXReinforcementThreshold: "loss_equals_100pct_of_latest_reinforcement" as const,
  pnlMeasurementBasis: PnlMeasurementBasis.RealizedPlusUnrealized,
  leverageTransitionPaths: [
    LeverageTransitionPath.SeparateTenXPosition,
    LeverageTransitionPath.ChangeLeverageOnExisting,
  ] as const,
  maxEducationalLeverage: 10,
  profitRealizationModes: [
    ProfitRealizationMode.WithdrawProfit,
    ProfitRealizationMode.CloseSeventyFivePercentPosition,
  ] as const,
  defaultRoundTripFeeBps: 2,
  defaultFundingBps: 0,
  defaultSlippageBpsPerSide: 1,
  gradedLabsDeterministic: true,
  awaitingOwnerConfirmation: true,
} as const;
