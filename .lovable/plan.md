# Mise à jour Afrique Business

Toutes les pages ajoutées respectent le thème lumineux existant (brand-green, brand-gold, fond clair) et restent en français.

## 1. Partage de l'application (page d'accueil)
- Ajouter un bouton icône `Share2` (lucide) en haut à gauche du header de `src/routes/index.tsx`.
- Logique : utiliser `navigator.share` si disponible ; sinon copier le texte dans le presse-papiers + toast.
- Message partagé exact :
  > Rejoins moi sur Afrique Business, la plateforme pour acheter, vendre et gagner de l'argent facilement en Afrique de l'Ouest.
  > 👉 afrique-afrique.com

## 2. Bannière promotionnelle rouge (accueil)
- Composant `PromoBanner` fermable (état persistant 24 h via `localStorage`).
- Fond rouge `bg-red-600` + texte blanc, bouton blanc "DÉCOUVRIR NOS OFFRES" → `/abonnements`.
- Bouton X en haut à droite, accessible (`aria-label="Fermer"`).
- Texte : « Pour toutes questions concernant nos offres ou toutes autres informations, contactez-nous : +225 0565242349 »

## 3. Section « Plus » dans le profil
Ajouter dans `src/routes/profil.tsx` une nouvelle carte « Plus » qui ouvre `/plus` (nouvelle route).

Page `/plus` (nouveau fichier `src/routes/plus.tsx`) :
- **Mode Lite** : toggle (Switch shadcn) — stocké dans `localStorage` clé `afb-lite-mode`. Quand actif, on lit ce flag dans `ListingCard` pour ne pas charger les images (placeholder gris + bouton « Charger l'image »).
- **Inviter ses amis** → réutilise la fonction partage du point 1.
- **Nous contacter sur WhatsApp** → `https://wa.me/2250565242349`.
- **Nous contacter par mail** → `mailto:contact@afrique-afrique.com`.
- Liens vers les pages légales :
  - `/legal/cgu` — Conditions Générales d'Utilisation
  - `/legal/cgv` — Conditions Générales de Vente
  - `/legal/confidentialite` — Politique de Confidentialité
  - `/legal/regles-diffusion` — Règles de diffusion
  - `/legal/securite` — Conseils de sécurité

Chaque page légale a un contenu de base professionnel propre à Afrique Business (rédigé maintenant, pas un Lorem). Mise en page lisible (prose).

## 4. Profil utilisateur à onglets
Refonte de `src/routes/mes-annonces.tsx` (ou nouveau composant en haut) :
- 3 onglets principaux (`Tabs` shadcn) : **Annonces** / **Boosts** / **Achats**.
- Onglet **Annonces** : 4 sous-onglets avec badges de compteur :
  - En vente (`status='active'`)
  - Vendues (`status='sold'`)
  - Expirées (`status='expired'`)
  - Rejetées (`status='rejected'`)
- Onglet **Boosts** : liste des entrées de la table `boosts` de l'utilisateur (date, annonce, durée, statut).
- Onglet **Achats** : liste des paiements `payments` de l'utilisateur (date, montant, type).
- Compteurs récupérés en une seule requête `.select('status', { count: 'exact' })` groupée côté client.

## 5. Page « Modifier mon profil »
Nouvelle route `/profil/modifier` (`src/routes/profil.modifier.tsx`) :
- **Changer mes contacts** : formulaire téléphone + WhatsApp (update table `profiles`).
- **Changer le mot de passe** : `supabase.auth.updateUser({ password })`.
- **Gérer mes notifications** : toggle push (réutilise `PushOptIn`) + toggle e-mails promo (colonne `profiles.email_opt_in` à ajouter via migration).
- Bouton **Se déconnecter** (style neutre).
- Bouton **Supprimer le compte** (rouge, double confirmation) : appelle un nouveau server fn `deleteMyAccount` qui supprime via `supabaseAdmin.auth.admin.deleteUser(userId)`. Le compte de l'admin (`manassemandan0779@gmail.com`) est protégé : le server fn refuse si l'appelant a le rôle `admin`.

Lien ajouté dans `/profil` : « Modifier mon profil » en tête de liste.

## 6. CTA Abonnement dans le profil
- Remplacer la carte sombre actuelle « 👑 Business » par une bannière lumineuse dorée :
  - Titre : « Vendez plus vite et gagnez plus »
  - Sous-titre : « grâce à nos abonnements Pro & Business »
  - Bouton blanc « Découvrir » → `/abonnements`
- Conserver les couleurs brand (gold + green).

## Détails techniques

- **Migration unique** :
  - Ajouter `email_opt_in boolean default true` à `profiles`.
  - Ajouter les statuts `'sold'`, `'expired'`, `'rejected'` au check existant de `listings.status` si absents.
- **Server function** : `src/lib/account.functions.ts` → `deleteMyAccount` (middleware auth requis ; charge `supabaseAdmin` à l'intérieur du handler ; bloque si rôle admin).
- **Routes ajoutées** :
  ```text
  src/routes/plus.tsx
  src/routes/legal.cgu.tsx
  src/routes/legal.cgv.tsx
  src/routes/legal.confidentialite.tsx
  src/routes/legal.regles-diffusion.tsx
  src/routes/legal.securite.tsx
  src/routes/profil.modifier.tsx
  ```
- **Composants ajoutés** : `PromoBanner`, `ShareAppButton`, `LiteModeProvider` (contexte simple basé sur `localStorage`).
- **Cron Web Push** : la précédente tentative `cron.schedule` a échoué (extension `pg_cron` non installée sur le projet). Je l'inclus dans cette mise à jour en activant `pg_cron` + `pg_net` via la migration avant la planification — ou, si l'activation échoue, je laisse l'endpoint `/api/public/hooks/push-boost-nudge` prêt et je documente l'appel manuel.
- **Secret VAPID** : la clé privée VAPID reste à ajouter via `add_secret` (interrompue précédemment). Je relancerai la demande à la fin de l'implémentation.

## Hors scope (à confirmer si tu les veux)
- Refonte complète du design du profil au-delà des points listés.
- Internationalisation des pages légales (uniquement FR pour l'instant).
- Modération automatique des nouvelles annonces marquées `rejected`.
