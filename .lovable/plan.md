# Plan d'exécution complet — Phases 4 à 8

Je termine tout d'une traite, sans poser de questions. Phases 1, 2 et 3 sont déjà livrées (Emploi gratuit, Confiance/Sécurité, Performance/SEO de base).

## Phase 4 — UX & Galerie photos (correction critique)
- Corriger le défilement des photos sur la page annonce (`src/routes/annonces.$id.tsx`) : swipe tactile fluide, flèches clavier, indicateurs cliquables, lazy load des miniatures.
- Lightbox plein écran avec pinch-zoom mobile.
- Skeletons de chargement sur listes et fiche annonce.
- Toasts d'erreur cohérents.

## Phase 5 — Recherche & Filtres avancés
- Barre de recherche globale persistante avec suggestions.
- Filtres : prix min/max, ville, catégorie/sous-catégorie, état, date, vendeur vérifié, gratuit uniquement.
- Tri : récent, prix ↑/↓, pertinence, boostés en tête.
- URL synchronisée (search params) pour partage de recherche.

## Phase 6 — Messagerie & Notifications
- Page `/messages` : liste des conversations + thread temps réel (Supabase Realtime sur `messages`).
- Indicateur non-lu, badge sur header.
- Notifications navigateur opt-in pour nouveaux messages.

## Phase 7 — Localisation panafricaine
- Sélecteur pays/ville (Sénégal, Côte d'Ivoire, Cameroun, Mali, Bénin, Togo, Burkina, Guinée, RDC, Gabon…).
- Devises locales (XOF, XAF, CDF, GNF) avec formatage `Intl.NumberFormat`.
- Mobile Money par pays (Orange Money, Wave, MTN MoMo, Moov) affiché sur la fiche paiement.
- Stockage préférence pays dans `localStorage` + colonne `country` profil.

## Phase 8 — SEO avancé + Audit final
- JSON-LD `Product` sur fiche annonce, `BreadcrumbList`, `Organization` racine.
- `head()` dynamique sur `annonces.$id` et `boutique.$ownerId`.
- Sitemap dynamique (`src/routes/sitemap[.]xml.ts`) listant toutes les annonces actives.
- Audit : `supabase--linter`, scan sécurité, vérification RLS, test des parcours clés (publier, contacter, signaler, favoris, paiement).
- Correction de tous les bugs détectés.

## Détails techniques
- Galerie : composant `<ListingGallery>` réutilisable basé sur `embla-carousel-react` (déjà installé probablement, sinon `bun add`).
- Realtime : `supabase.channel('messages:user_id=...').on('postgres_changes', ...)`.
- Devises : helper `formatPrice(amount, currency)` dans `src/lib/currency.ts`.
- JSON-LD : via `head().scripts` TanStack.
- Migration éventuelle : ajouter `country`, `currency` à `profiles` et `listings` si manquant.

## Fichiers principaux touchés
- `src/routes/annonces.$id.tsx`, `src/routes/explorer.tsx`, `src/routes/messages.tsx` (nouveau)
- `src/components/ListingGallery.tsx`, `SearchBar.tsx`, `CountrySelector.tsx`, `Filters.tsx` (nouveaux)
- `src/lib/currency.ts`, `src/lib/countries.ts` (nouveaux)
- `src/routes/sitemap[.]xml.ts` (nouveau)
- Migration SQL pour `country`/`currency` si nécessaire.

Une fois approuvé, j'exécute tout en parallèle sans nouvelles questions.