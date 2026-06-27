import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "./legal";

export const Route = createFileRoute("/legal/confidentialite")({
  head: () => ({ meta: [{ title: "Confidentialité — Afrique-business" }] }),
  component: () => (
    <LegalLayout title="Politique de Confidentialité">
      <p>La présente politique décrit comment Afrique-Business collecte, utilise et protège les données personnelles des utilisateurs.</p>

      <h2 className="text-base font-extrabold">1. Données collectées</h2>
      <ul className="list-disc pl-5">
        <li>Identité : nom affiché, e-mail, téléphone, WhatsApp.</li>
        <li>Localisation : pays, ville, commune (déclaratifs).</li>
        <li>Contenu : annonces, photos, messages échangés.</li>
        <li>Techniques : adresse IP, identifiant de session, type d'appareil.</li>
      </ul>

      <h2 className="text-base font-extrabold">2. Finalités</h2>
      <p>Les données sont utilisées pour : créer et gérer le compte, publier et diffuser les annonces, faciliter la mise en relation, traiter les paiements, prévenir la fraude, et améliorer la Plateforme.</p>

      <h2 className="text-base font-extrabold">3. Base légale</h2>
      <p>Le traitement repose sur l'exécution du contrat (CGU), le consentement (notifications), l'intérêt légitime (sécurité, lutte contre la fraude) et le respect d'obligations légales.</p>

      <h2 className="text-base font-extrabold">4. Partage</h2>
      <p>Les données ne sont jamais vendues. Elles peuvent être partagées avec : nos hébergeurs (Supabase, Lovable Cloud), notre prestataire de paiement (PayDunya) et, le cas échéant, les autorités sur réquisition.</p>

      <h2 className="text-base font-extrabold">5. Durée de conservation</h2>
      <p>Les données sont conservées pendant la durée d'activité du compte, puis pour la durée légale de prescription. L'utilisateur peut demander leur suppression à tout moment.</p>

      <h2 className="text-base font-extrabold">6. Vos droits</h2>
      <p>L'utilisateur dispose d'un droit d'accès, de rectification, d'opposition, de portabilité et de suppression. Pour exercer ses droits, écrire à <a className="text-brand-green underline" href="mailto:contact@afrique-afrique.com">contact@afrique-afrique.com</a>. La suppression du compte est également accessible depuis « Modifier mon profil ».</p>

      <h2 className="text-base font-extrabold">7. Sécurité</h2>
      <p>Les mots de passe sont stockés sous forme chiffrée. Les accès aux données sensibles sont restreints par des règles de sécurité au niveau base de données (RLS).</p>

      <h2 className="text-base font-extrabold">8. Cookies</h2>
      <p>La Plateforme utilise un stockage local minimal pour le fonctionnement (session, préférences). Aucun cookie publicitaire tiers n'est déposé.</p>
    </LegalLayout>
  ),
});
