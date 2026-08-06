"use client";

import { useState, type ReactNode } from "react";
import { Check, Crown, KeyRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanId = "core" | "silver" | "vip";

type Plan = {
  id: PlanId;
  name: string;
  badge: string;
  monthly: number;
  months: number;
  total: number;
  blurb: string;
  features: ReactNode[];
  cta: string;
  accent: "core" | "silver" | "vip";
  bestValue?: boolean;
};

const GOLD_ADDON = 20;

const plans: Plan[] = [
  {
    id: "core",
    name: "CORE",
    badge: "חודש אחד",
    monthly: 30,
    months: 1,
    total: 30,
    blurb: "כניסה גמישה למערכת ללא התחייבות ארוכה.",
    features: [
      "גישה מלאה למודל השווקים",
      "מודל הארנקים, Top 10 וסטטיסטיקה",
      "תוקף גישה: 30 יום",
    ],
    cta: "בחר Core",
    accent: "core",
  },
  {
    id: "silver",
    name: "SILVER",
    badge: "6 חודשים",
    monthly: 25,
    months: 6,
    total: 150,
    blurb: "מחיר חודשי מוזל במסלול יציב לחצי שנה.",
    features: [
      <>
        כל כלי ה־
        <span className="ltr-isolate">Core</span>
        {" "}
        ללא הגבלה
      </>,
      "גישה רציפה למשך 6 חודשים",
      'סה״כ למסלול: $150',
    ],
    cta: "בחר Silver",
    accent: "silver",
    bestValue: true,
  },
  {
    id: "vip",
    name: "VIP",
    badge: "12 חודשים",
    monthly: 20,
    months: 12,
    total: 240,
    blurb: "המחיר החודשי הנמוך ביותר למשתמשים רציניים.",
    features: [
      "כל כלי המערכת לשנה מלאה",
      "גישה רציפה למשך 12 חודשים",
      'סה״כ למסלול: $240',
    ],
    cta: "בחר VIP",
    accent: "vip",
  },
];

function PlanIcon({ accent }: { accent: Plan["accent"] }) {
  if (accent === "vip") {
    return <Crown className="h-4 w-4 text-[#c4b5fd]" aria-hidden />;
  }
  if (accent === "silver") {
    return <Sparkles className="h-4 w-4 text-[#e8eef8]" aria-hidden />;
  }
  return (
    <span
      className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-[#5cc3ff] shadow-[0_0_10px_rgba(92,195,255,0.7)]"
      aria-hidden
    />
  );
}

function PlanCard({
  plan,
  goldOn,
  onToggleGold,
}: {
  plan: Plan;
  goldOn: boolean;
  onToggleGold: () => void;
}) {
  const payNow = plan.total + (goldOn ? GOLD_ADDON : 0);

  return (
    <article
      className={cn(
        "plan-card relative flex flex-col overflow-hidden rounded-[1.35rem] border p-5 sm:p-6",
        plan.accent === "core" && "plan-card--core",
        plan.accent === "silver" && "plan-card--silver",
        plan.accent === "vip" && "plan-card--vip",
      )}
    >
      {plan.bestValue ? (
        <div className="plan-ribbon" aria-hidden>
          <span>הכי משתלם</span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-wide text-white">
          {plan.name}
          <PlanIcon accent={plan.accent} />
        </h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            plan.accent === "core" && "bg-[#163554] text-[#c8e7ff]",
            plan.accent === "silver" && "bg-[#2a3344] text-[#e8eef8]",
            plan.accent === "vip" && "bg-[#2a1f55] text-[#ddd6fe]",
          )}
        >
          {plan.badge}
        </span>
      </div>

      <div className="mt-5 flex flex-row-reverse items-baseline justify-end gap-2">
        <span className="ltr-isolate font-display text-5xl font-bold tracking-tight text-white">
          ${plan.monthly}
        </span>
        <span className="text-sm text-[#9aa8bc]">לחודש</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#9aa8bc]">{plan.blurb}</p>

      <ul className="mt-5 space-y-3 text-sm">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3df8b5]" aria-hidden />
            <span className="text-[#e8eef8]">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onToggleGold}
        aria-pressed={goldOn}
        className={cn(
          "gold-addon mt-5 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-right transition",
          goldOn && "gold-addon--on",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold text-[#f0c86a]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            הוסף Gold Trades
          </span>
          <span className="mt-0.5 block text-[11px] text-[#c9a45a]">
            $20 חד־פעמי · נשמר בחשבון
          </span>
        </span>
        <span className="ltr-isolate text-lg font-bold text-[#f0c86a]">$20+</span>
      </button>

      <div className="mt-6 flex items-end justify-between gap-3">
        <span className="pb-1 text-sm text-[#9aa8bc]">לתשלום עכשיו</span>
        <span className="ltr-isolate font-display text-4xl font-bold text-white">
          ${payNow}
        </span>
      </div>

      <a
        href={`/signup?plan=${plan.id}${goldOn ? "&gold=1" : ""}`}
        className={cn(
          "plan-cta mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-bold transition hover:brightness-110",
          plan.accent === "core" && "plan-cta--core",
          plan.accent === "silver" && "plan-cta--silver",
          plan.accent === "vip" && "plan-cta--vip",
        )}
      >
        {plan.cta}
      </a>
    </article>
  );
}

export function AccessPlans() {
  const [goldByPlan, setGoldByPlan] = useState<Record<PlanId, boolean>>({
    core: false,
    silver: false,
    vip: false,
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-bold tracking-[0.16em] text-[#3df8b5] uppercase">
          ACCESS PLANS
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          בחר את מסלול הגישה שלך
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#9aa8bc] sm:text-base">
          המנוי קובע את תקופת הגישה למערכת. Gold Trades הוא שדרוג חד־פעמי שנשמר
          בחשבון.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            goldOn={goldByPlan[plan.id]}
            onToggleGold={() =>
              setGoldByPlan((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))
            }
          />
        ))}
      </div>

      <section className="access-how rounded-2xl border border-[#1e3a5f] bg-[#0a1628] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a2a12] text-[#f0c86a]">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-white sm:text-lg">
              איך הגישה עובדת?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#9aa8bc]">
              בתום תקופת המנוי הגישה נחסמת עד חידוש. רכישת Gold Trades נשמרת
              בחשבון גם אחרי סיום המנוי.
            </p>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-[#6f8098]">
        כלי מחקר בלבד. אין הבטחת רווח.
      </p>
    </div>
  );
}
