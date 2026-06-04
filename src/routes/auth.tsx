import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "./explorer";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Afrique-business" }] }),
  component: () => (
    <StubPage
      title="Inscription par téléphone"
      subtitle="Vérification OTP, 1 compte = 1 numéro. Disponible bientôt."
    />
  ),
});
