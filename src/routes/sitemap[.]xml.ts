import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { COUNTRIES, CATEGORIES } from "@/data/catalog";

const BASE_URL = "https://afrique-afrique.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const maps = [
          `${BASE_URL}/sitemap-static.xml`,
          ...COUNTRIES.map((c) => `${BASE_URL}/sitemap-country-${c.code}.xml`),
          ...CATEGORIES.map((c) => `${BASE_URL}/sitemap-category-${c.slug}.xml`),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...maps.map(
            (loc) =>
              `  <sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`,
          ),
          `</sitemapindex>`,
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
