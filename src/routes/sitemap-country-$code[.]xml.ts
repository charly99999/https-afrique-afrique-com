import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://afrique-afrique.com";

export const Route = createFileRoute("/sitemap-country-$code[.]xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = (params as { code: string }).code.toUpperCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("listings")
          .select("id, updated_at, published_at")
          .eq("status", "active")
          .eq("country", code)
          .order("published_at", { ascending: false })
          .limit(5000);

        if (error) {
          return new Response(`<!-- error: ${error.message} -->`, {
            status: 500,
            headers: { "Content-Type": "application/xml" },
          });
        }

        const rows = data ?? [];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...rows.map((r) => {
            const lastmod = (r.updated_at ?? r.published_at ?? new Date().toISOString()).slice(0, 10);
            return `  <url><loc>${BASE_URL}/annonces/${r.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
          }),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
