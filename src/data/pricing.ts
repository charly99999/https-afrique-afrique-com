// Prix officiels Afrique-business (FCFA) — Phase 1
// Toute modification doit être reflétée côté UI + server fns payDunya.

export type SubPlan = "pro_monthly" | "pro_quarterly" | "pro_yearly"
  | "business_monthly" | "business_quarterly" | "business_yearly";

export const SUB_PRICES: Record<SubPlan, { label: string; amount: number; days: number; tier: "pro" | "business" }> = {
  pro_monthly:        { label: "Pro — Mensuel",       amount: 5_000,  days: 30,  tier: "pro" },
  pro_quarterly:      { label: "Pro — Trimestriel",   amount: 12_000, days: 90,  tier: "pro" },
  pro_yearly:         { label: "Pro — Annuel",        amount: 25_000, days: 365, tier: "pro" },
  business_monthly:   { label: "Business — Mensuel",  amount: 10_000, days: 30,  tier: "business" },
  business_quarterly: { label: "Business — Trim.",    amount: 25_000, days: 90,  tier: "business" },
  business_yearly:    { label: "Business — Annuel",   amount: 50_000, days: 365, tier: "business" },
};

export type BoostDays = 1 | 3 | 7 | 30;

export const BOOST_PRICES: Record<BoostDays, number> = {
  1: 500,
  3: 1_200,
  7: 2_500,
  30: 8_000,
};
