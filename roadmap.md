# Feuille de route — Afrique-Business (parité marketplace)

## Phase 1 — Paiements fiables + expirations (CRITIQUE)
- [ ] Webhook PayDunya idempotent (verrou sur statut completed)
- [ ] Réconciliation automatique des paiements « pending » (> 15 min)
- [ ] Expiration automatique boosts / abonnements / annonces (pg_cron)

## Phase 2 — Statistiques réelles
- [ ] Table `listing_events` (vue, clic tel, clic whatsapp, clic message, favori)
- [ ] Enregistrement côté annonce + dédup vue (1/visiteur/jour)
- [ ] Refonte `mes-statistiques`

## Phase 3 — Administration & modération
- [ ] Routes `/admin` (dashboard, utilisateurs, annonces, signalements, paiements, boosts)
- [ ] `admin_actions`, suspension profil, RLS admin

## Phase 4 — Parité marketplace
- [ ] Vente / Troc / Don (`deal_type`)
- [ ] 10 photos
- [ ] Recherches sauvegardées + alertes
- [ ] Notifications favoris (baisse prix / vendu)
- [ ] Annonces similaires, partage boutique
- [ ] Signalement de profil

## Phase 5 — Auth téléphone / OTP
- [ ] Architecture OTP + variable serveur documentée (pas de secret client)

## Phase 6 — Qualité
- [ ] Loading / empty / error, validation, RLS, build, parcours de bout en bout

## Sécurité
- [ ] Finding: exposition phone/whatsapp via `profiles_public_read`
