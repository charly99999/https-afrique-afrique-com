import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COMPLETED_STATUSES = new Set(["completed", "complete", "paid", "approved", "success", "successful"]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "expired"]);

type PaymentRow = {
  id: string;
  user_id: string;
  kind: "subscription" | "boost";
  amount_fcfa: number;
  related_plan: string | null;
  related_listing_id: string | null;
  boost_days: number | null;
  status: string;
};

export function mapPaydunyaStatus(status: string): "completed" | "cancelled" | "failed" {
  const normalized = status.toLowerCase();
  if (COMPLETED_STATUSES.has(normalized)) return "completed";
  if (CANCELLED_STATUSES.has(normalized)) return "cancelled";
  return "failed";
}

async function activatePayment(payment: PaymentRow) {
  if (payment.kind === "subscription" && payment.related_plan) {
    const { SUB_PRICES } = await import("@/data/pricing");
    const plan = SUB_PRICES[payment.related_plan as keyof typeof SUB_PRICES];
    if (!plan) return;

    const expires = new Date(Date.now() + plan.days * 86400 * 1000).toISOString();

    const { data: existingSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (!existingSubscription) {
      await supabaseAdmin.from("subscriptions").insert({
        user_id: payment.user_id,
        plan: payment.related_plan as never,
        amount_fcfa: payment.amount_fcfa,
        expires_at: expires,
        payment_id: payment.id,
        active: true,
      });
    }

    await supabaseAdmin.from("profiles")
      .update({ account_type: plan.tier, account_expires_at: expires })
      .eq("id", payment.user_id);
  }

  if (payment.kind === "boost" && payment.related_listing_id && payment.boost_days) {
    const expires = new Date(Date.now() + payment.boost_days * 86400 * 1000).toISOString();

    const { data: existingBoost } = await supabaseAdmin
      .from("boosts")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (!existingBoost) {
      await supabaseAdmin.from("boosts").insert({
        user_id: payment.user_id,
        listing_id: payment.related_listing_id,
        days: payment.boost_days,
        amount_fcfa: payment.amount_fcfa,
        expires_at: expires,
        payment_id: payment.id,
      });
    }

    await supabaseAdmin.from("listings")
      .update({ boosted_until: expires })
      .eq("id", payment.related_listing_id);
  }
}

export async function finalizePaydunyaPayment(params: {
  paymentId: string;
  providerToken?: string | null;
  status: string;
  raw: Record<string, unknown>;
}) {
  const newStatus = mapPaydunyaStatus(params.status);

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .update({
      status: newStatus,
      provider_token: params.providerToken ?? null,
      provider_response: params.raw as never,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", params.paymentId)
    .neq("status", "completed")
    .select("id, user_id, kind, amount_fcfa, related_plan, related_listing_id, boost_days, status")
    .single<PaymentRow>();

  if (!payment) return { status: newStatus, activated: false };
  if (newStatus !== "completed") return { status: newStatus, activated: false };

  await activatePayment(payment);
  return { status: newStatus, activated: true };
}