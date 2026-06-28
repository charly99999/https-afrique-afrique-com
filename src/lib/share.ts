import { toast } from "sonner";

export const SHARE_URL = "https://afrique-afrique.com";

// Texte par défaut (page "Plus" → Inviter mes amis)
export const SHARE_TEXT =
  "Rejoins Afrique Business, la plateforme pour acheter et vendre en Afrique de l'Ouest 👉 afrique-afrique.com";

// Texte pour le bouton Partager du header de la page d'accueil
export const SHARE_TEXT_HOME =
  "Découvre Afrique Business, la marketplace de l'Afrique de l'Ouest 👉 afrique-afrique.com";

export async function shareApp(text: string = SHARE_TEXT): Promise<void> {
  const payload = {
    title: "Afrique Business",
    text,
    url: SHARE_URL,
  };

  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(payload);
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success("Message copié — collez-le où vous voulez !");
      return;
    }
  } catch {
    /* fallback ci-dessous */
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast.success("Message copié !");
  } catch {
    toast.error("Impossible de partager automatiquement. Copiez le lien afrique-afrique.com");
  }
}
