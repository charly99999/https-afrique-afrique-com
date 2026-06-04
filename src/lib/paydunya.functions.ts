// Server functions pour initier des paiements payDunya.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SUB_PRICES, BOOST_PRICES, type SubPlan } from "@/data/pricing";

async function getServerOrigin(): Promise<string> {
  try {
    const mod = await import("@tanstack/react-start/server");
    const proto = mod.getRequestHeader("x-forwarded-proto");
    const host = mod.getRequestHeader("x-forwarded-host") ?? mod.getRequestHeader("host");
    if (host) return `${proto ?? "https"}://${host}`;
  } catch { /* no-op */ }
  return process.env.PUBLIC_SITE_URL
    ?? `https://project--${process.env.SUPABASE_PROJECT_ID ?? "app"}.lovable.app`;
}

export const startSubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    origin: z.string().url(),
    plan: z.enum([
      "pro_monthly","pro_quarterly","pro_yearly",
      "business_monthly","business_quarterly","business_yearly",
    ]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = SUB_PRICES[data.plan as SubPlan];

    const { createPaydunyaInvoice } = await import("./paydunya.server");
    const userOrigin = data.origin;
    const serverOrigin = await getServerOrigin();

    // Crée le paiement pending
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        kind: "subscription",
        amount_fcfa: plan.amount,
        status: "pending",
        provider: "paydunya",
        related_plan: data.plan,
      })
      .select("id")
      .single();
    if (payErr || !payment) return { ok: false, error: payErr?.message ?? "Erreur DB" };

    const invoice = await createPaydunyaInvoice({
      totalAmount: plan.amount,
      description: `Abonnement ${plan.label} — Afrique-business`,
      items: [{
        name: plan.label,
        quantity: 1,
        unit_price: String(plan.amount),
        total_price: String(plan.amount),
        description: `Accès ${plan.tier} pendant ${plan.days} jours`,
      }],
      customData: { payment_id: payment.id, user_id: userId, kind: "subscription", plan: data.plan },
      returnUrl: `${userOrigin}/paiement/succes?id=${payment.id}`,
      cancelUrl: `${userOrigin}/abonnements`,
      callbackUrl: `${serverOrigin}/api/public/paydunya-ipn`,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").update({
      provider_token: invoice.token ?? null,
      provider_invoice_url: invoice.invoiceUrl ?? null,
      provider_response: (invoice.raw as object as never) ?? null,
      status: invoice.ok ? "pending" : "failed",
    }).eq("id", payment.id);

    if (!invoice.ok) return { ok: false, error: invoice.error ?? "PayDunya KO" };
    return { ok: true, invoiceUrl: invoice.invoiceUrl!, paymentId: payment.id };
  });

export const startBoostPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    origin: z.string().url(),
    listingId: z.string().uuid(),
    days: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(30)]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const amount = BOOST_PRICES[data.days];

    // Vérifie propriété
    const { data: listing, error: lErr } = await supabase
      .from("listings").select("id, owner_id, title").eq("id", data.listingId).single();
    if (lErr || !listing) return { ok: false, error: "Annonce introuvable" };
    if (listing.owner_id !== userId) return { ok: false, error: "Annonce non autorisée" };

    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        kind: "boost",
        amount_fcfa: amount,
        status: "pending",
        provider: "paydunya",
        related_listing_id: data.listingId,
        boost_days: data.days,
      })
      .select("id")
      .single();
    if (payErr || !payment) return { ok: false, error: payErr?.message ?? "Erreur DB" };

    const { createPaydunyaInvoice } = await import("./paydunya.server");
    const userOrigin = data.origin;
    const serverOrigin = await getServerOrigin();

    const invoice = await createPaydunyaInvoice({
      totalAmount: amount,
      description: `Boost ${data.days} jours — ${listing.title}`,
      items: [{
        name: `Boost ${data.days} jours`,
        quantity: 1,
        unit_price: String(amount),
        total_price: String(amount),
        description: `Mise en avant de "${listing.title}"`,
      }],
      customData: { payment_id: payment.id, user_id: userId, kind: "boost",
        listing_id: data.listingId, days: data.days },
      returnUrl: `${userOrigin}/paiement/succes?id=${payment.id}`,
      cancelUrl: `${userOrigin}/annonces/${data.listingId}`,
      callbackUrl: `${serverOrigin}/api/public/paydunya-ipn`,
    });

    const { supabaseAdmin: adminB } = await import("@/integrations/supabase/client.server");
    await adminB.from("payments").update({
      provider_token: invoice.token ?? null,
      provider_invoice_url: invoice.invoiceUrl ?? null,
      provider_response: (invoice.raw as object as never) ?? null,
      status: invoice.ok ? "pending" : "failed",
    }).eq("id", payment.id);

    if (!invoice.ok) return { ok: false, error: invoice.error ?? "PayDunya KO" };
    return { ok: true, invoiceUrl: invoice.invoiceUrl!, paymentId: payment.id };
  });
