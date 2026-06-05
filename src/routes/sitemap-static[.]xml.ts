import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { COUNTRIES, CATEGORIES } from "@/data/catalog";

const BASE_URL = "https://afrique-afrique.com";

export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; priority: string; changefreq: string }[] = [
          { loc: "/", priority: "1.0", changefreq: "daily" },
          { loc: "/explorer", priority: "0.9", changefreq: "daily" },
          { loc: "/abonnements", priority: "0.6", changefreq: "monthly" },
          { loc: "/auth", priority: "0.3", changefreq: "yearly" },
        ];

        for (const c of COUNTRIES) {
          urls.push({ loc: `/explorer?country=${c.code}`, priority: "0.8", changefreq: "daily" });
        }
        for (const cat of CATEGORIES) {
          urls.push({ loc: `/explorer?category=${cat.slug}`, priority: "0.8", changefreq: "daily" });
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls.map(
            (u) =>
              `  <url><loc>${BASE_URL}${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
