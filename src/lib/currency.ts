export type Currency = "XOF" | "XAF" | "CDF" | "GNF" | "MAD" | "DZD" | "TND" | "EUR" | "USD";

export interface Country {
  code: string;
  name: string;
  currency: Currency;
  flag: string;
  mobileMoney: string[];
  cities: string[];
}

export const COUNTRIES: Country[] = [
  { code: "SN", name: "Sénégal", currency: "XOF", flag: "🇸🇳",
    mobileMoney: ["Orange Money", "Wave", "Free Money"],
    cities: ["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Touba", "Mbour"] },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮",
    mobileMoney: ["Orange Money", "MTN MoMo", "Moov Money", "Wave"],
    cities: ["Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro", "Korhogo"] },
  { code: "CM", name: "Cameroun", currency: "XAF", flag: "🇨🇲",
    mobileMoney: ["MTN MoMo", "Orange Money"],
    cities: ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua"] },
  { code: "ML", name: "Mali", currency: "XOF", flag: "🇲🇱",
    mobileMoney: ["Orange Money", "Moov Money", "Wave"],
    cities: ["Bamako", "Sikasso", "Ségou", "Mopti", "Kayes", "Gao"] },
  { code: "BJ", name: "Bénin", currency: "XOF", flag: "🇧🇯",
    mobileMoney: ["MTN MoMo", "Moov Money"],
    cities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi"] },
  { code: "TG", name: "Togo", currency: "XOF", flag: "🇹🇬",
    mobileMoney: ["T-Money", "Flooz"],
    cities: ["Lomé", "Sokodé", "Kara", "Kpalimé"] },
  { code: "BF", name: "Burkina Faso", currency: "XOF", flag: "🇧🇫",
    mobileMoney: ["Orange Money", "Moov Money"],
    cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"] },
  { code: "GN", name: "Guinée", currency: "GNF", flag: "🇬🇳",
    mobileMoney: ["Orange Money", "MTN MoMo"],
    cities: ["Conakry", "Kankan", "Nzérékoré", "Kindia"] },
  { code: "CD", name: "RD Congo", currency: "CDF", flag: "🇨🇩",
    mobileMoney: ["Orange Money", "Airtel Money", "M-Pesa"],
    cities: ["Kinshasa", "Lubumbashi", "Goma", "Bukavu", "Mbuji-Mayi"] },
  { code: "GA", name: "Gabon", currency: "XAF", flag: "🇬🇦",
    mobileMoney: ["Airtel Money", "Moov Money"],
    cities: ["Libreville", "Port-Gentil", "Franceville"] },
  { code: "NE", name: "Niger", currency: "XOF", flag: "🇳🇪",
    mobileMoney: ["Orange Money", "Airtel Money", "Moov Money"],
    cities: ["Niamey", "Zinder", "Maradi", "Agadez"] },
  { code: "TD", name: "Tchad", currency: "XAF", flag: "🇹🇩",
    mobileMoney: ["Airtel Money", "Moov Money"],
    cities: ["N'Djamena", "Moundou", "Sarh"] },
  { code: "MA", name: "Maroc", currency: "MAD", flag: "🇲🇦",
    mobileMoney: ["Wafacash", "Cash Plus"],
    cities: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"] },
];

export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function formatPrice(amount: number, currency: Currency = "XOF"): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

export function getStoredCountry(): string {
  if (typeof window === "undefined") return "SN";
  return localStorage.getItem("ab_country") || "SN";
}

export function setStoredCountry(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ab_country", code);
}
