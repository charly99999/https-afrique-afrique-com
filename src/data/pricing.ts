// Prix officiels Afrique-business (FCFA)
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

// === PROMO LIMITÉE — 50% sur les abonnements mensuels pendant 2 mois ===
// Pour désactiver la promo, mettre PROMO_ACTIVE à false.
export const PROMO_ACTIVE = true;

export const PROMO_PRICES: Partial<Record<SubPlan, { amount: number; days: number }>> = {
  pro_monthly:      { amount: 2_500, days: 60 },  // 2 500 FCFA → 2 mois d'accès Pro
  business_monthly: { amount: 5_000, days: 60 },  // 5 000 FCFA → 2 mois d'accès Business
};

export type BoostDays = 1 | 3 | 7 | 30;

export const BOOST_PRICES: Record<BoostDays, number> = {
  1: 500,
  3: 1_200,
  7: 2_500,
  30: 8_000,
};
