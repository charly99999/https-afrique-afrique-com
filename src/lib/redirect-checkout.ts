// Redirection robuste vers une page externe (ex: PayDunya).
// Lovable preview affiche l'app dans un iframe ; PayDunya bloque l'embed
// via X-Frame-Options, ce qui produit un écran blanc si on utilise
// window.location.href. On sort donc systématiquement de l'iframe et,
// en dernier recours, on ouvre un nouvel onglet.
export function redirectToCheckout(url: string) {
  if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
    throw new Error("URL de paiement invalide");
  }

  try {
    // Cas standard hors iframe OU iframe same-origin : navigation top-level.
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = url;
        return;
      } catch {
        // Cross-origin iframe : on tombe sur l'ouverture nouvel onglet.
      }
    } else {
      window.location.href = url;
      return;
    }
  } catch {
    // ignore
  }

  // Fallback : nouvel onglet (peut être bloqué par le navigateur si pas
  // déclenché par un clic utilisateur — ici c'est toujours le cas).
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    // Dernier recours : remplacer l'URL courante.
    window.location.href = url;
  }
}
