import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "./legal";

export const Route = createFileRoute("/legal/cgv")({
  head: () => ({ meta: [{ title: "CGV — Afrique-business" }] }),
  component: () => (
    <LegalLayout title="Conditions Générales de Vente">
      <h2 className="text-base font-extrabold">1. Champ d'application</h2>
      <p>Les présentes Conditions Générales de Vente (« CGV ») s'appliquent à toutes les prestations payantes proposées par Afrique-Business : abonnements (Pro, Business) et boosts d'annonces.</p>

      <h2 className="text-base font-extrabold">2. Prix</h2>
      <p>Les prix sont indiqués en francs CFA (FCFA) toutes taxes comprises lorsqu'applicables. Afrique-Business se réserve le droit de modifier ses tarifs à tout moment ; les conditions applicables sont celles en vigueur au moment du paiement.</p>

      <h2 className="text-base font-extrabold">3. Modalités de paiement</h2>
      <p>Les paiements s'effectuent via les solutions Mobile Money locales et opérateurs partenaires (Orange Money, Wave, MTN, Moov, Free, etc.) à travers le prestataire de paiement PayDunya.</p>

      <h2 className="text-base font-extrabold">4. Activation</h2>
      <p>Les services (abonnement ou boost) sont activés automatiquement après confirmation du paiement par le prestataire. En cas d'échec, le paiement n'est pas débité.</p>

      <h2 className="text-base font-extrabold">5. Durée et renouvellement</h2>
      <p>Les abonnements sont conclus pour la durée choisie (mensuelle, semestrielle ou annuelle). Aucun renouvellement automatique n'est appliqué : l'utilisateur doit reconduire manuellement son offre à l'échéance.</p>

      <h2 className="text-base font-extrabold">6. Droit de rétractation</h2>
      <p>Conformément au caractère immédiatement exécutable des services numériques, l'utilisateur renonce expressément à son droit de rétractation dès le début d'exécution du service (activation de l'abonnement ou du boost).</p>

      <h2 className="text-base font-extrabold">7. Remboursement</h2>
      <p>Aucun remboursement n'est dû en cas de suspension consécutive à une violation des CGU. En cas de dysfonctionnement technique avéré imputable à la Plateforme, un avoir équivalent pourra être accordé.</p>

      <h2 className="text-base font-extrabold">8. Facturation</h2>
      <p>Un reçu électronique est disponible dans l'espace « Mes activités → Achats ». L'utilisateur peut demander une facture détaillée à l'adresse contact@afrique-afrique.com.</p>

      <h2 className="text-base font-extrabold">9. Litiges</h2>
      <p>Tout litige est soumis à une tentative de résolution amiable préalable. À défaut, les tribunaux du lieu d'exploitation de la Plateforme sont seuls compétents.</p>
    </LegalLayout>
  ),
});
