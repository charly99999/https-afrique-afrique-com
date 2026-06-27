import { toast } from "sonner";

export const SHARE_TEXT =
  "Rejoins moi sur Afrique Business, la plateforme pour acheter, vendre et gagner de l'argent facilement en Afrique de l'Ouest.\n👉 afrique-afrique.com";

export const SHARE_URL = "https://afrique-afrique.com";

export async function shareApp(): Promise<void> {
  const payload = {
    title: "Afrique Business",
    text: SHARE_TEXT,
    url: SHARE_URL,
  };

  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(payload);
      return;
    }
  } catch (err) {
    // L'utilisateur a annulé : ne rien faire de bruyant.
    if (err instanceof Error && err.name === "AbortError") return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(SHARE_TEXT);
      toast.success("Message copié — collez-le où vous voulez !");
      return;
    }
  } catch {
    /* fallback ci-dessous */
  }

  // Dernier recours
  try {
    const ta = document.createElement("textarea");
    ta.value = SHARE_TEXT;
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
