export class PolymarketError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "PolymarketError";
    this.code = code;
    this.status = status;
  }
}

export class PolymarketValidationError extends PolymarketError {
  readonly issues: unknown;

  constructor(message: string, issues?: unknown) {
    super("VALIDATION", message, 422);
    this.name = "PolymarketValidationError";
    this.issues = issues;
  }
}
