import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "./legal";

export const Route = createFileRoute("/legal/securite")({
  head: () => ({ meta: [{ title: "Conseils de sécurité — Afrique-business" }] }),
  component: () => (
    <LegalLayout title="Conseils de sécurité">
      <p>Votre sécurité est notre priorité. Voici les bons réflexes pour acheter et vendre sereinement.</p>

      <h2 className="text-base font-extrabold">🛡 Avant la transaction</h2>
      <ul className="list-disc pl-5">
        <li>Privilégiez les vendeurs avec le badge <b>Vérifié</b> ou un statut <b>Pro</b> / <b>Business</b>.</li>
        <li>Vérifiez la cohérence du prix : une offre « trop belle pour être vraie » est souvent une arnaque.</li>
        <li>Posez des questions précises : état, garantie, raison de la vente.</li>
        <li>Demandez plusieurs photos sous différents angles, voire une vidéo en direct.</li>
      </ul>

      <h2 className="text-base font-extrabold">🤝 Le jour du rendez-vous</h2>
      <ul className="list-disc pl-5">
        <li>Rencontrez-vous dans un <b>lieu public et fréquenté</b> (centre commercial, station-service).</li>
        <li>Évitez de venir seul, surtout pour les biens de valeur (téléphones, véhicules).</li>
        <li>Vérifiez le bien : fonctionnement, accessoires, numéros de série.</li>
        <li>Payez de préférence par Mobile Money traçable plutôt qu'en espèces non vérifiées.</li>
      </ul>

      <h2 className="text-base font-extrabold">💳 Paiement</h2>
      <ul className="list-disc pl-5">
        <li>Ne payez <b>jamais</b> à l'avance pour un bien que vous n'avez pas vu.</li>
        <li>Refusez les transferts internationaux Western Union / MoneyGram demandés par des inconnus.</li>
        <li>Méfiez-vous des « frais de livraison » ou « frais de douane » réclamés à l'avance.</li>
      </ul>

      <h2 className="text-base font-extrabold">💼 Offres d'emploi et services</h2>
      <ul className="list-disc pl-5">
        <li>Aucune offre d'emploi sérieuse ne demande de l'argent au candidat (frais de dossier, formation, uniforme).</li>
        <li>Méfiez-vous des promesses de salaires irréalistes et des « postes à l'étranger » trop simples.</li>
      </ul>

      <h2 className="text-base font-extrabold">🚨 Signaler une arnaque</h2>
      <p>Utilisez le bouton « Signaler » présent sur chaque annonce et chaque conversation. Vous pouvez également nous contacter sur WhatsApp au <a className="text-brand-green underline" href="https://wa.me/2250565242349">+225 0565242349</a> ou par e-mail à <a className="text-brand-green underline" href="mailto:contact@afrique-afrique.com">contact@afrique-afrique.com</a>.</p>

      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
        Afrique-Business est un intermédiaire technique : nous ne détenons ni les biens ni les fonds échangés. Restez vigilants, c'est votre meilleure protection.
      </p>
    </LegalLayout>
  ),
});
