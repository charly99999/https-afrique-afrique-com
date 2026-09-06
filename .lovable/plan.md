# Afrique-Business — Audit complet et plan de mise à niveau

## 1. Audit de l'existant (vérifié dans le code et la base)

### Ce qui fonctionne réellement
- **Annonces** : publication, édition, gestion (`publier`, `annonces/$id`, `annonces/$id/edit`, `mes-annonces`), 66 annonces actives en base, photos réelles dans le stockage privé avec liens signés.
- **Recherche / filtres / catégories** : page Explorer avec catégories et sous-catégories, ville/commune, prix, pays ; historique de recherche ; géolocalisation.
- **Messagerie** : temps réel opérationnel (abonnement live), états lu/non lu, fils par annonce. 4 messages seulement en base (peu d'usage, pas un bug).
- **Favoris**, **profils vendeurs**, **boutique vendeur** (`boutique/$ownerId`), **avis vendeurs**, **KYC** avec vérification automatique toutes les 5 minutes.
- **Paiements PayDunya** : création de facture, page de retour, webhook signé, activation abonnement/boost, journal des webhooks.
- **Notifications Web Push** (abonnement + relance boost) et **publication Facebook** après boost payé.
- **Sécurité** : RLS active partout, téléphone/WhatsApp protégés par fonctions dédiées, rôles admin dans une table séparée.
- **SEO** : sitemaps par pays et catégorie, JSON-LD. **Mobile** : navigation basse, mode Lite, compression d'images.

### Ce qui est incomplet, cassé ou absent
1. **Compteur de vues jamais incrémenté** : aucune écriture de `views_count` dans le code, et une règle base bloque toute mise à jour côté client. Conséquence : « Mes statistiques » et « Mes annonces » affichent toujours 0 vue. Aucun suivi de clics ni de contacts.
2. **Aucune interface d'administration** : pas de page admin (utilisateurs, annonces, signalements, paiements, abonnements, boosts, statistiques). Le rôle admin existe mais n'a aucun écran.
3. **Signalements sans suite** : le formulaire de signalement existe (0 signalement en base), mais aucun écran de modération, pas de signalement de profil.
4. **Pas d'inscription par téléphone + code SMS** : seulement e-mail + mot de passe ; le téléphone n'est qu'une info de profil.
5. **Pas d'alertes de recherche** : aucune table ni écran ; les favoris ne déclenchent aucune notification (baisse de prix, annonce vendue).
6. **Pas de type d'annonce vente / troc / don** : uniquement la vente avec prix.
7. **Photos limitées à 8** au lieu de 10.
8. **Aucune expiration automatique** : abonnements et boosts expirés ne sont jamais nettoyés (une seule tâche planifiée existe, pour le KYC). Les annonces n'expirent pas non plus.
9. **Paiements bloqués** : 33 paiements restent « en attente » contre 2 confirmés. Le correctif du webhook est dans le code mais **n'a jamais été publié en production** — c'est la cause principale.
10. **Adoption des notifications quasi nulle** : 1 seul abonnement push enregistré ; la demande d'autorisation est trop discrète.
11. **Détail annonce** : pas de compteur d'appels/WhatsApp, pas d'annonces similaires, pas de partage de profil vendeur.

## 2. Plan d'implémentation par étapes

### Étape 1 — Débloquer l'argent et les fondations (critique)
- Publier le correctif du webhook de paiement, puis rejouer les paiements en attente auprès de PayDunya et activer ceux réellement payés.
- Rendre le webhook totalement idempotent (un paiement confirmé ne peut jamais être activé deux fois) et ajouter une vérification de secours automatique des paiements en attente de plus de 15 minutes.
- Tâches planifiées : expiration des boosts, expiration des abonnements (retour au compte Gratuit), expiration des annonces anciennes.

### Étape 2 — Statistiques réelles
- Enregistrer les vues (une par visiteur et par jour), les clics « Appeler » / « WhatsApp » / « Message » et les mises en favori.
- Refondre « Mes statistiques » : vues, contacts, favoris, taux de contact, évolution sur 30 jours, classement des annonces.

### Étape 3 — Administration et modération
- Nouvelle section admin réservée au rôle admin : tableau de bord, utilisateurs (rôle, suspension, vérification), annonces (valider, suspendre, supprimer), signalements (traiter, motif, action), paiements et abonnements, boosts, statistiques globales.
- Signalement de profil en plus du signalement d'annonce, avec file de traitement.

### Étape 4 — Parité marketplace
- Type d'annonce : Vente / Troc / Don, avec filtre dédié et prix masqué pour don/troc.
- Jusqu'à 10 photos.
- Alertes de recherche : enregistrer une recherche (catégorie + ville + prix) et recevoir une notification quand une annonce correspond.
- Notifications favoris : baisse de prix et annonce vendue.
- Annonces similaires sur la fiche, partage de la boutique vendeur.

### Étape 5 — Inscription par téléphone + code SMS
- Nécessite un fournisseur SMS. Variable d'environnement à ajouter côté serveur uniquement (nom exact fourni au moment de l'implémentation, par ex. `SMS_PROVIDER_API_KEY`) — aucune clé côté navigateur.
- À défaut de fournisseur, l'e-mail reste la méthode principale et le téléphone est vérifié par code lors de la publication.

### Étape 6 — Finitions et tests
- États de chargement, états vides et messages d'erreur homogènes sur tous les écrans.
- Relecture des règles d'accès pour chaque nouvelle table.
- Tests de bout en bout des 13 parcours demandés (visiteur, inscription, publication, gestion, favoris/alertes, messagerie, signalement, boutique, abonnement, boost, statistiques, admin, mobile).

## 3. Points techniques
- Nouvelles tables prévues : `listing_events` (vues/clics/contacts), `saved_searches`, `profile_reports`, `admin_actions`. Chacune avec droits d'accès explicites et règles de sécurité.
- Nouvelles colonnes : `listings.deal_type` (vente/troc/don), `profiles.suspended_at`.
- Tâches planifiées via le planificateur déjà présent, appelant des points d'entrée protégés par le secret existant `CRON_SECRET`.
- Aucun secret exposé côté navigateur ; toute clé reste lue côté serveur.
- Aucune fonctionnalité existante supprimée : le thème Onyx & Or, l'éléphant 3D, le mode Lite, les pages légales, la bannière et les intégrations actuelles sont conservés.

## 4. Ce que je ne ferai pas sans votre accord
- Rotation des clés PayDunya (recommandée, elles ont été exposées).
- Réactivation du contrôle « mot de passe compromis » (désactivé à votre demande).
- Ajout d'un fournisseur SMS payant.
