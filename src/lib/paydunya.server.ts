// Helpers payDunya — server-only. Ne jamais importer depuis du code client.
// Doc API : https://paydunya.com/developers/

type PaydunyaInvoiceItem = {
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  description?: string;
};

export type PaydunyaCreatePayload = {
  totalAmount: number;
  description: string;
  items: PaydunyaInvoiceItem[];
  customData: Record<string, string | number | boolean | null>;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  storeName?: string;
};

export type PaydunyaCreateResult = {
  ok: boolean;
  token?: string;
  invoiceUrl?: string;
  raw: unknown;
  error?: string;
};

function getMode(): "live" | "sandbox" {
  return process.env.PAYDUNYA_MODE?.toLowerCase() === "live" ? "live" : "sandbox";
}

function getBaseUrl(): string {
  return getMode() === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";
}

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY ?? "",
  };
  if (getMode() === "live") {
    h["PAYDUNYA-PUBLIC-KEY"] = process.env.PAYDUNYA_PUBLIC_KEY ?? "";
    h["PAYDUNYA-PRIVATE-KEY"] = process.env.PAYDUNYA_PRIVATE_KEY ?? "";
    if (process.env.PAYDUNYA_TOKEN) h["PAYDUNYA-TOKEN"] = process.env.PAYDUNYA_TOKEN;
  } else {
    // Sandbox utilise les clés "test"
    h["PAYDUNYA-PUBLIC-KEY"] = process.env.PAYDUNYA_PUBLIC_KEY ?? "";
    h["PAYDUNYA-PRIVATE-KEY"] = process.env.PAYDUNYA_PRIVATE_KEY ?? "";
    if (process.env.PAYDUNYA_TOKEN) h["PAYDUNYA-TOKEN"] = process.env.PAYDUNYA_TOKEN;
  }
  return h;
}

export async function createPaydunyaInvoice(p: PaydunyaCreatePayload): Promise<PaydunyaCreateResult> {
  if (!process.env.PAYDUNYA_MASTER_KEY) {
    return { ok: false, error: "Clés payDunya non configurées", raw: null };
  }

  const itemsObj: Record<string, PaydunyaInvoiceItem> = {};
  p.items.forEach((it, i) => { itemsObj[`item_${i}`] = it; });

  const storeWebsite = process.env.PAYDUNYA_STORE_WEBSITE || process.env.PUBLIC_SITE_URL || "https://afrique-afrique.com";
  const storeLogo = process.env.PAYDUNYA_STORE_LOGO || `${storeWebsite}/icon-512.png`;
  const storePhone = process.env.PAYDUNYA_STORE_PHONE || undefined;

  // PayDunya exige un Store complet (nom + site web + logo) pour activer
  // Orange Money CI, MTN MoMo CI, Moov Money CI et Djamo. Sans ces champs,
  // seul Wave est proposé et les autres canaux renvoient "Échec de paiement".
  const body = {
    invoice: {
      total_amount: p.totalAmount,
      description: p.description,
      items: itemsObj,
    },
    store: {
      name: p.storeName ?? "Afrique-business",
      tagline: "Marketplace panafricaine",
      phone: storePhone,
      postal_address: "Abidjan, Côte d'Ivoire",
      website_url: storeWebsite,
      logo_url: storeLogo,
    },
    custom_data: p.customData,
    actions: {
      cancel_url: p.cancelUrl,
      return_url: p.returnUrl,
      callback_url: p.callbackUrl,
    },
  };

  const mode = getMode();
  const url = `${getBaseUrl()}/checkout-invoice/create`;
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw_text: text }; }

    // Logging détaillé — n'expose JAMAIS les clés (headers omis volontairement)
    console.log("[PayDunya] checkout-invoice/create", JSON.stringify({
      mode,
      url,
      http_status: res.status,
      duration_ms: Date.now() - startedAt,
      request: {
        total_amount: p.totalAmount,
        description: p.description,
        items_count: p.items.length,
        custom_data_keys: Object.keys(p.customData ?? {}),
        store_has_website: !!storeWebsite,
        store_has_logo: !!storeLogo,
      },
      response: {
        response_code: (json as { response_code?: string }).response_code,
        response_text: (json as { response_text?: string }).response_text,
        token_present: !!(json as { token?: string }).token,
        full: json,
      },
    }));

    if ((json as { response_code?: string }).response_code === "00") {
      return {
        ok: true,
        token: (json as { token?: string }).token,
        invoiceUrl: (json as { response_text?: string }).response_text,
        raw: json,
      };
    }
    return {
      ok: false,
      error: translatePaydunyaError((json as { response_text?: string }).response_text, res.status),
      raw: json,
    };
  } catch (e) {
    console.error("[PayDunya] network error", { mode, url, message: e instanceof Error ? e.message : String(e) });
    return {
      ok: false,
      error: e instanceof Error
        ? `Connexion à PayDunya impossible (${e.message}). Vérifiez votre connexion internet et réessayez.`
        : "Erreur réseau lors du paiement.",
      raw: null,
    };
  }
}

/**
 * Traduit en français clair les codes d'erreur PayDunya les plus fréquents
 * (Orange Money CI, MTN MoMo, Moov Money, Wave, Djamo, carte bancaire).
 */
export function translatePaydunyaError(raw: string | undefined | null, httpStatus?: number): string {
  if (!raw) return httpStatus && httpStatus >= 500
    ? "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes."
    : "Le paiement n'a pas pu être initié. Réessayez.";
  const t = raw.toLowerCase();
  if (t.includes("insufficient") || t.includes("solde")) return "Solde insuffisant sur votre compte Mobile Money. Rechargez puis réessayez.";
  if (t.includes("invalid") && t.includes("otp")) return "Code OTP invalide ou expiré. Demandez un nouveau code et réessayez.";
  if (t.includes("otp") && (t.includes("expire") || t.includes("expired"))) return "Le code OTP a expiré. Recommencez le paiement pour recevoir un nouveau code.";
  if (t.includes("invalid") && (t.includes("phone") || t.includes("number") || t.includes("msisdn"))) return "Numéro de téléphone invalide. Vérifiez votre numéro Mobile Money (sans indicatif) puis réessayez.";
  if (t.includes("cancel")) return "Paiement annulé. Vous pouvez recommencer quand vous le souhaitez.";
  if (t.includes("timeout") || t.includes("delai")) return "Le paiement a expiré sans confirmation. Recommencez.";
  if (t.includes("unauthorized") || t.includes("forbidden")) return "Paiement refusé par votre opérateur. Contactez Orange / MTN / Moov / Djamo si le problème persiste.";
  if (t.includes("duplicate")) return "Une transaction identique est déjà en cours. Patientez quelques minutes avant de réessayer.";
  if (t.includes("not found")) return "Transaction introuvable côté PayDunya. Recommencez le paiement.";
  if (t.includes("amount")) return "Montant invalide pour ce moyen de paiement. Contactez le support.";
  // Message générique mais en français
  return `Paiement refusé : ${raw}`;
}

export async function confirmPaydunyaInvoice(token: string): Promise<{ ok: boolean; status?: string; raw: unknown }> {
  try {
    const res = await fetch(`${getBaseUrl()}/checkout-invoice/confirm/${token}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: json?.response_code === "00", status: json?.status, raw: json };
  } catch (e) {
    return { ok: false, raw: { error: e instanceof Error ? e.message : "Erreur réseau" } };
  }
}
