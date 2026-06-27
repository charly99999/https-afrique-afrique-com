import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "./legal";

export const Route = createFileRoute("/legal/regles")({
  head: () => ({ meta: [{ title: "Règles de diffusion — Afrique-business" }] }),
  component: () => (
    <LegalLayout title="Règles de diffusion">
      <p>Pour garantir une marketplace de confiance, chaque annonce doit respecter les règles suivantes.</p>

      <h2 className="text-base font-extrabold">✅ Bonnes pratiques</h2>
      <ul className="list-disc pl-5">
        <li>Un titre clair et précis (modèle, état, marque).</li>
        <li>Une description honnête : état réel, défauts éventuels, accessoires inclus.</li>
        <li>Des photos personnelles, nettes, montrant l'objet réel.</li>
        <li>Un prix juste et en FCFA (ou la mention « gratuit » pour les catégories concernées).</li>
        <li>La localisation exacte (ville et commune) pour faciliter la rencontre.</li>
      </ul>

      <h2 className="text-base font-extrabold">❌ Contenus interdits</h2>
      <ul className="list-disc pl-5">
        <li>Produits illicites : drogues, armes, ivoire, espèces protégées, contrefaçons.</li>
        <li>Médicaments et dispositifs médicaux soumis à prescription.</li>
        <li>Contenus à caractère sexuel, pornographique ou pédopornographique.</li>
        <li>Discriminations, propos haineux, incitations à la violence.</li>
        <li>Schémas pyramidaux, « argent facile », faux investissements, crypto-arnaques.</li>
        <li>Documents officiels (passeports, diplômes, cartes d'identité).</li>
        <li>Comptes (réseaux sociaux, jeux) à céder.</li>
      </ul>

      <h2 className="text-base font-extrabold">🖼 Photos</h2>
      <p>Les photos doivent être prises par le vendeur. Sont interdites les images issues du Web sans droits, les photos floues, ou contenant des coordonnées (numéro, e-mail) inscrites directement dessus.</p>

      <h2 className="text-base font-extrabold">📞 Coordonnées</h2>
      <p>Les coordonnées (téléphone, WhatsApp, e-mail) doivent être renseignées dans le profil et non dans le titre ou la description.</p>

      <h2 className="text-base font-extrabold">🔁 Doublons</h2>
      <p>La republication d'une même annonce à l'identique pour gagner en visibilité est interdite. Utilisez le boost.</p>

      <h2 className="text-base font-extrabold">⚖️ Sanctions</h2>
      <p>Toute annonce non conforme peut être retirée sans préavis. Les manquements répétés entraînent la suspension puis la suppression du compte.</p>
    </LegalLayout>
  ),
});
