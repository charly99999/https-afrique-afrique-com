# Feuille de route — Afrique-Business

## Mode gratuit (règle commerciale confirmée)
- [ ] Réglage centralisé serveur : tout gratuit jusqu'au 31/12/2026, bascule auto au 01/01/2027
- [ ] Aucune facture PayDunya créée avant le 01/01/2027 (blocage serveur)
- [ ] Boost / Pro / Business activables gratuitement pendant la période (architecture conservée)
- [ ] Bandeau « Gratuit jusqu'au 31 décembre 2026 » sur boost / abonnements / mon-abonnement

## Phase 1 — Paiements fiables + expirations
- [x] Webhook PayDunya idempotent
- [x] Réconciliation automatique des paiements « pending »
- [x] Expiration automatique boosts / abonnements / annonces (pg_cron)
- [ ] Publier le correctif IPN en production (vérifier après publication)

## Phase 2 — Statistiques réelles
- [x] `listing_events` + `record_listing_event` + refonte `mes-statistiques`

## Phase 3 — Administration & modération
- [x] `/admin` dashboard, utilisateurs, annonces, signalements, paiements
- [ ] Onglets abonnements, boosts, signalements de profil, journal d'actions

## Phase 4 — Parité marketplace
- [ ] Vente / Troc / Don : publier, éditer, fiche, cartes, filtres explorer
- [ ] 10 photos (publier + édition)
- [ ] Recherches sauvegardées : sauvegarde depuis Explorer, écran `/mes-alertes`, cron d'alertes
- [ ] Notifications in-app (`notifications`) + baisse de prix / annonce vendue (favoris)
- [ ] Annonces similaires sur la fiche
- [ ] Partage de boutique
- [ ] Signalement de profil (boutique)

## Phase 5 — OTP téléphone
- [ ] Flux préparé (table, server fn), aucun SMS simulé sans fournisseur, dépendance documentée

## Phase 6 — Qualité
- [ ] Build / typecheck
- [ ] Tests navigateur : accueil, explorer, fiche, publier, messages, profil, stats, admin (desktop + mobile)
- [ ] Vérification crons / secrets (jamais affichés)

## Sécurité
- [ ] Finding : phone/whatsapp exposés via `profiles_public_read` → table `profile_contacts` dédiée
