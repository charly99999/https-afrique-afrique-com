import villaImg from "@/assets/listing-villa.jpg";
import carImg from "@/assets/listing-car.jpg";
import iphoneImg from "@/assets/listing-iphone.jpg";
import macbookImg from "@/assets/listing-macbook.jpg";
import watchImg from "@/assets/listing-watch.jpg";
import studioImg from "@/assets/listing-studio.jpg";

export type CountryCode =
  | "CI" | "SN" | "ML" | "BF" | "BJ" | "TG" | "NE" | "GN" | "CM" | "CD" | "GA";

export const COUNTRIES: { code: CountryCode; name: string; flag: string; cities: string[] }[] = [
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", cities: ["Abidjan", "Cocody", "Yopougon", "Bouaké", "San-Pédro", "Yamoussoukro"] },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", cities: ["Dakar", "Thiès", "Saint-Louis", "Touba", "Mbour"] },
  { code: "ML", name: "Mali", flag: "🇲🇱", cities: ["Bamako", "Sikasso", "Mopti", "Ségou"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"] },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", cities: ["Cotonou", "Porto-Novo", "Parakou"] },
  { code: "TG", name: "Togo", flag: "🇹🇬", cities: ["Lomé", "Sokodé", "Kara"] },
  { code: "NE", name: "Niger", flag: "🇳🇪", cities: ["Niamey", "Zinder", "Maradi"] },
  { code: "GN", name: "Guinée", flag: "🇬🇳", cities: ["Conakry", "Kankan", "Labé"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", cities: ["Yaoundé", "Douala", "Bafoussam", "Garoua"] },
  { code: "CD", name: "RD Congo", flag: "🇨🇩", cities: ["Kinshasa", "Lubumbashi", "Goma", "Bukavu"] },
  { code: "GA", name: "Gabon", flag: "🇬🇦", cities: ["Libreville", "Port-Gentil"] },
];

export type Category = {
  slug: string;
  name: string;
  emoji: string;
  sub: string[];
};

export const CATEGORIES: Category[] = [
  { slug: "vehicules", name: "Véhicules", emoji: "🚗", sub: ["Voitures", "Motos", "Camions", "Accessoires"] },
  { slug: "immobilier", name: "Immobilier", emoji: "🏠", sub: ["Villas", "Appartements", "Terrains", "Bureaux"] },
  { slug: "electronique", name: "Électronique", emoji: "📱", sub: ["Téléphones", "Ordinateurs", "TV", "Accessoires"] },
  { slug: "electromenager", name: "Électroménager", emoji: "🧊", sub: ["Réfrigérateurs", "Climatiseurs", "Cuisinières"] },
  { slug: "mode", name: "Mode & Beauté", emoji: "👗", sub: ["Vêtements Homme", "Vêtements Femme", "Chaussures", "Bijoux"] },
  { slug: "enfant", name: "Pour l'Enfant", emoji: "👶", sub: ["Vêtements", "Jouets", "Mobilier Bébé"] },
  { slug: "services", name: "Emploi & Services", emoji: "💼", sub: ["Offres d'emploi", "Demandes d'emploi", "Prestataires de services", "Cours & Formation"] },
  { slug: "maison", name: "Maison & Loisirs", emoji: "🛋️", sub: ["Meubles", "Décoration", "Sports"] },
  { slug: "pro-agricole", name: "Pro & Agricole", emoji: "🚜", sub: [] },
  { slug: "alimentation", name: "Alimentation", emoji: "🍎", sub: [] },
  { slug: "animaux", name: "Animaux", emoji: "🐕", sub: [] },
  { slug: "autres", name: "Autres", emoji: "📦", sub: [] },
];

/** Catégories gratuites — publication 100% offerte, badge "Opportunité gratuite". */
export const FREE_CATEGORIES = new Set<string>(["services"]);
export const isFreeCategory = (slug?: string | null) => !!slug && FREE_CATEGORIES.has(slug);


export type SellerBadge = "gratuit" | "pro" | "business";

export type Listing = {
  id: string;
  title: string;
  price: number;
  priceSuffix?: string;
  category: string;
  subCategory?: string;
  country: CountryCode;
  city: string;
  image: string;
  boosted?: boolean;
  badge?: SellerBadge;
  seller: string;
  postedAt: string;
  description: string;
};

export const LISTINGS: Listing[] = [
  {
    id: "villa-cocody-5p",
    title: "Villa d'architecte 5 pièces avec piscine",
    price: 250_000_000,
    category: "immobilier",
    subCategory: "Villas",
    country: "CI",
    city: "Cocody, Abidjan",
    image: villaImg,
    boosted: true,
    badge: "business",
    seller: "Cocody Premium Immo",
    postedAt: "Il y a 2h",
    description:
      "Magnifique villa contemporaine située dans un quartier résidentiel calme de Cocody. 5 chambres, 4 salles de bain, salon double, cuisine équipée, piscine, jardin paysager, place pour 3 véhicules.",
  },
  {
    id: "land-cruiser-v6",
    title: "Toyota Land Cruiser V6 2023",
    price: 65_000_000,
    category: "vehicules",
    subCategory: "Voitures",
    country: "SN",
    city: "Plateau, Dakar",
    image: carImg,
    boosted: true,
    badge: "pro",
    seller: "Auto Prestige SN",
    postedAt: "Il y a 4h",
    description:
      "Toyota Land Cruiser V6 importée d'Europe. 25 000 km, boîte automatique, cuir beige, GPS, caméra de recul, jantes 20 pouces. Entretien à jour.",
  },
  {
    id: "iphone-15-pmax",
    title: "iPhone 15 Pro Max 256GB Titane",
    price: 850_000,
    category: "electronique",
    subCategory: "Téléphones",
    country: "SN",
    city: "Dakar",
    image: iphoneImg,
    badge: "pro",
    seller: "Mobile Plus",
    postedAt: "Il y a 5 min",
    description:
      "iPhone 15 Pro Max 256 Go titane naturel. Acheté il y a 2 mois, encore sous garantie Apple. Boîte complète, facture disponible.",
  },
  {
    id: "macbook-m3",
    title: 'MacBook Pro M3 14"',
    price: 1_250_000,
    category: "electronique",
    subCategory: "Ordinateurs",
    country: "CI",
    city: "Cocody, Abidjan",
    image: macbookImg,
    badge: "pro",
    seller: "TechShop CI",
    postedAt: "Il y a 1h",
    description:
      "MacBook Pro 14 pouces, puce M3, 16 Go RAM, 512 Go SSD. État neuf, à peine utilisé. Idéal pour graphistes et développeurs.",
  },
  {
    id: "rolex-datejust",
    title: "Montre de luxe automatique",
    price: 7_400_000,
    category: "mode",
    subCategory: "Accessoires",
    country: "CM",
    city: "Yaoundé",
    image: watchImg,
    badge: "business",
    seller: "Boutique Élégance",
    postedAt: "Il y a 3h",
    description:
      "Montre automatique de luxe, bracelet acier, mouvement suisse. Authentique avec certificat et boîte d'origine.",
  },
  {
    id: "studio-ngor",
    title: "Studio meublé à Ngor",
    price: 45_000,
    priceSuffix: "/ nuit",
    category: "immobilier",
    subCategory: "Appartements",
    country: "SN",
    city: "Ngor, Dakar",
    image: studioImg,
    badge: "pro",
    seller: "Dakar Stays",
    postedAt: "Il y a 6h",
    description:
      "Joli studio entièrement meublé à 5 minutes de la plage de Ngor. Wifi haut débit, climatisation, cuisine équipée. Idéal court séjour.",
  },
];

export const formatFcfa = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value).replaceAll(",", ".") + " FCFA";

export const getListing = (id: string) => LISTINGS.find((l) => l.id === id);
