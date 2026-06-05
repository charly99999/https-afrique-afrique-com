import { createFileRoute } from "@tanstack/react-router";

const BODY = `User-agent: *
Allow: /
Disallow: /auth
Disallow: /publier
Disallow: /mes-annonces
Disallow: /mes-statistiques
Disallow: /messages
Disallow: /mon-abonnement
Disallow: /parametres
Disallow: /paiement.succes
Disallow: /api/

Sitemap: https://afrique-afrique.com/sitemap.xml
`;

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(BODY, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});
