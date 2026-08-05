export type Role = "free" | "core" | "gold" | "admin";
export type Plan = "free" | "core" | "gold";

export type UserRole = Role;
export type UserPlan = Plan;

export const ROLES = ["free", "core", "gold", "admin"] as const satisfies readonly Role[];
export const PLANS = ["free", "core", "gold"] as const satisfies readonly Plan[];

const ROLE_RANK: Record<Role, number> = {
  free: 0,
  core: 1,
  gold: 2,
  admin: 3,
};

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  core: 1,
  gold: 2,
};

export function roleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan] ?? 0;
}

export function hasMinRole(role: Role, minimum: Role): boolean {
  return roleRank(role) >= roleRank(minimum);
}

export function hasMinPlan(plan: Plan, minimum: Plan): boolean {
  return planRank(plan) >= planRank(minimum);
}

export function canAccessGold(role: Role, plan: Plan): boolean {
  if (role === "admin" || role === "gold") return true;
  return plan === "gold" || plan === "core";
}

/** Core can browse markets; Gold tier content requires gold/admin (or gold plan). */
export function canAccessGoldPicks(role: Role, plan: Plan): boolean {
  if (role === "admin" || role === "gold") return true;
  return plan === "gold";
}

export function canAccessAdmin(role: Role): boolean {
  return role === "admin";
}

export function canAccessCore(role: Role, plan: Plan): boolean {
  if (role === "admin" || role === "gold" || role === "core") return true;
  return plan === "core" || plan === "gold";
}

export class PermissionError extends Error {
  readonly status = 403;

  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "PermissionError";
  }
}

export function requireRole(role: Role, minimum: Role, message?: string): void {
  if (!hasMinRole(role, minimum)) {
    throw new PermissionError(
      message ?? `Requires role ${minimum} or higher (got ${role})`,
    );
  }
}

export function requireGold(role: Role, plan: Plan): void {
  if (!canAccessGoldPicks(role, plan)) {
    throw new PermissionError("Gold plan or admin role required");
  }
}

export function requireAdmin(role: Role): void {
  if (!canAccessAdmin(role)) {
    throw new PermissionError("Admin role required");
  }
}

export function assertGoldAccess(role: Role, plan: Plan): void {
  requireGold(role, plan);
}

export function assertAdminAccess(role: Role): void {
  requireAdmin(role);
}

export type AccessContext = {
  role: Role;
  plan: Plan;
};
