import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "./explorer";

export const Route = createFileRoute("/publier")({
  head: () => ({ meta: [{ title: "Publier une annonce — Afrique-business" }] }),
  component: () => (
    <StubPage
      title="Publier une annonce"
      subtitle="Formulaire avec 5 photos minimum, catégorie, pays, ville, prix en FCFA."
    />
  ),
});
