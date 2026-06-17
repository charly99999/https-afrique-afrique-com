// Communes / quartiers principaux par ville (Afrique francophone)
// Utilisé pour le filtre hyper-local en cascade Ville > Commune.
export const COMMUNES: Record<string, string[]> = {
  Abidjan: [
    "Cocody", "Yopougon", "Marcory", "Treichville", "Plateau", "Adjamé",
    "Abobo", "Koumassi", "Port-Bouët", "Attécoubé", "Bingerville", "Anyama",
  ],
  Dakar: ["Plateau", "Médina", "Almadies", "Ouakam", "Yoff", "Mermoz", "Sacré-Cœur", "Parcelles Assainies", "Pikine", "Guédiawaye"],
  Bamako: ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V", "Commune VI"],
  Ouagadougou: ["Baskuy", "Bogodogo", "Boulmiougou", "Nongr-Massom", "Sig-Noghin", "Tampouy"],
  Cotonou: ["Akpakpa", "Cadjehoun", "Ganhi", "Vedoko", "Saint-Michel"],
  "Porto-Novo": ["Centre", "Houinmè", "Ouando"],
  Lomé: ["Bè", "Tokoin", "Agoè", "Adidogomé", "Baguida"],
  Niamey: ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V"],
  Conakry: ["Kaloum", "Dixinn", "Matam", "Ratoma", "Matoto"],
  Yaoundé: ["Bastos", "Mvog-Mbi", "Mvan", "Nlongkak", "Mendong", "Nkolbisson"],
  Douala: ["Akwa", "Bonanjo", "Bonapriso", "Bonabéri", "Deido", "Logbessou", "Makepe"],
  Kinshasa: ["Gombe", "Limete", "Lemba", "Ngaliema", "Kalamu", "Bandalungwa", "Masina", "Ndjili"],
  Libreville: ["Centre-Ville", "Akanda", "Owendo", "Nzeng-Ayong"],
};

export function getCommunes(city: string): string[] {
  return COMMUNES[city] ?? [];
}
