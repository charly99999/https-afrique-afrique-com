import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PriceInput = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(3000),
  category: z.string().max(60),
  country: z.string().length(2),
});

type PriceEstimate = {
  min: number; // FCFA
  max: number;
  confidence: "low" | "medium" | "high";
  note: string;
};

const SYSTEM = `Tu estimes un prix de marché en FCFA (XOF/XAF) pour une annonce d'occasion en Afrique francophone.
Renvoie UNIQUEMENT du JSON : {"min":number,"max":number,"confidence":"low|medium|high","note":"court"}
- Le prix doit être réaliste pour le marché local du pays indiqué.
- Si l'objet est inconnu ou trop vague, mets confidence "low" et donne une fourchette large.
- note : 1 phrase courte en français expliquant l'estimation.`;

export const estimatePrice = createServerFn({ method: "POST" })
  .inputValidator((d) => PriceInput.parse(d))
  .handler(async ({ data }): Promise<PriceEstimate> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { min: 0, max: 0, confidence: "low", note: "Estimation IA indisponible." };
    }

    const userMsg = `Pays: ${data.country}
Catégorie: ${data.category}
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
          temperature: 0.2,
        }),
      });
      if (!res.ok) {
        return { min: 0, max: 0, confidence: "low", note: "Estimation IA indisponible." };
      }
      const json = await res.json() as { choices?: { message?: { content?: string } }[] };
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Partial<PriceEstimate>;
      const min = Math.max(0, Math.round(Number(parsed.min) || 0));
      const max = Math.max(min, Math.round(Number(parsed.max) || 0));
      const confidence: PriceEstimate["confidence"] =
        parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low";
      return {
        min, max, confidence,
        note: typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "",
      };
    } catch {
      return { min: 0, max: 0, confidence: "low", note: "Estimation IA indisponible." };
    }
  });
