import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "./legal";

export const Route = createFileRoute("/legal/cgu")({
  head: () => ({ meta: [{ title: "CGU — Afrique-business" }] }),
  component: () => (
    <LegalLayout title="Conditions Générales d'Utilisation">
      <h2 className="text-base font-extrabold">1. Objet</h2>
      <p>Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Afrique-Business (« la Plateforme »), exploitée pour mettre en relation acheteurs et vendeurs en Afrique de l'Ouest.</p>

      <h2 className="text-base font-extrabold">2. Acceptation</h2>
      <p>En accédant à la Plateforme, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes CGU. À défaut, il doit cesser toute utilisation.</p>

      <h2 className="text-base font-extrabold">3. Inscription</h2>
      <p>L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour, et à protéger ses identifiants. Toute usurpation d'identité est strictement interdite.</p>

      <h2 className="text-base font-extrabold">4. Publication d'annonces</h2>
      <p>L'utilisateur est seul responsable du contenu de ses annonces. Il garantit disposer des droits nécessaires sur les biens et contenus publiés. Les annonces doivent respecter la loi en vigueur et les règles de diffusion de la Plateforme.</p>

      <h2 className="text-base font-extrabold">5. Comportements interdits</h2>
      <p>Sont notamment interdits : la fraude, l'arnaque, la vente de produits illicites, l'incitation à la haine, le harcèlement, la publication de contenus à caractère pornographique ou contrefaisant, et toute tentative de contournement des règles de la Plateforme.</p>

      <h2 className="text-base font-extrabold">6. Responsabilité</h2>
      <p>Afrique-Business agit en qualité d'hébergeur et n'est pas partie aux transactions. La Plateforme ne peut être tenue responsable des litiges entre utilisateurs, des défauts des biens ou de l'inexécution des transactions.</p>

      <h2 className="text-base font-extrabold">7. Modération</h2>
      <p>Afrique-Business se réserve le droit, à tout moment et sans préavis, de retirer une annonce, suspendre ou supprimer un compte en cas de violation des CGU ou de signalement avéré.</p>

      <h2 className="text-base font-extrabold">8. Données personnelles</h2>
      <p>Le traitement des données est décrit dans la Politique de Confidentialité accessible depuis le menu « Plus ».</p>

      <h2 className="text-base font-extrabold">9. Évolution</h2>
      <p>Afrique-Business peut modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la Plateforme.</p>

      <h2 className="text-base font-extrabold">10. Contact</h2>
      <p>Pour toute question : <a className="text-brand-green underline" href="mailto:contact@afrique-afrique.com">contact@afrique-afrique.com</a> — WhatsApp : <a className="text-brand-green underline" href="https://wa.me/2250565242349">+225 0565242349</a>.</p>
    </LegalLayout>
  ),
});
