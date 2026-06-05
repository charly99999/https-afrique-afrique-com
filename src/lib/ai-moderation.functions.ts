import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ModerationInput = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(3000),
  category: z.string().max(60),
});

type ModerationResult = {
  decision: "approve" | "review" | "reject";
  reason: string;
  flags: string[];
};

const SYSTEM = `Tu es un modérateur d'annonces pour une marketplace en Afrique francophone.
Tu analyses chaque annonce et renvoies UNIQUEMENT un JSON strict :
{"decision":"approve|review|reject","reason":"court message en français","flags":["..."]}

Règles :
- "reject" : contenu illégal (drogue, armes, contrefaçon claire, contenu sexuel, escroquerie évidente type "doublez votre argent"), spam manifeste, URL suspecte, demande de paiement à l'avance sans bien réel.
- "review" : annonce floue, doute sur l'authenticité, prix manifestement absurde, doublons probables.
- "approve" : annonce légitime et claire.
- "flags" : tags courts ("price_suspect","fake_likely","missing_info","external_link","contact_in_text").
Ne jamais expliquer hors du JSON.`;

export const moderateListing = createServerFn({ method: "POST" })
  .inputValidator((d) => ModerationInput.parse(d))
  .handler(async ({ data }): Promise<ModerationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      // Pas d'IA → on laisse passer sans bloquer la publication
      return { decision: "approve", reason: "AI disabled", flags: [] };
    }

    const userMsg = `Catégorie: ${data.category}
Titre: ${data.title}
Description: ${data.description}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });
      if (!res.ok) {
        console.error("moderateListing gateway error", res.status);
        return { decision: "approve", reason: "AI unavailable", flags: [] };
      }
      const json = await res.json() as { choices?: { message?: { content?: string } }[] };
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Partial<ModerationResult>;
      const decision = parsed.decision === "reject" || parsed.decision === "review" ? parsed.decision : "approve";
      return {
        decision,
        reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "",
        flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 8).map(String) : [],
      };
    } catch (err) {
      console.error("moderateListing exception", err);
      return { decision: "approve", reason: "AI error", flags: [] };
    }
  });
