export type Badge = 'halal' | 'avs' | 'achahada';

export const ALL_BADGES: { key: Badge; label: string; emoji: string }[] = [
  { key: 'halal', label: 'Halal', emoji: '🕌' },
  { key: 'avs', label: 'AVS', emoji: '✅' },
  { key: 'achahada', label: 'Achahada', emoji: '☪️' },
];

export const CATEGORIES = [
  'Pizza',
  'Kebab',
  'Sushi',
  'Burger',
  'Tacos',
  'Poulet',
  'Asiatique',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Spot {
  id: string;
  name: string;
  category: Category;
  address: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  badges: Badge[];
  hours: string;
  specialties: string[];
  priceRange: string;
  lat: number;
  lng: number;
  reviews: unknown[];
}

export type SpotFormValues = Omit<Spot, 'id' | 'rating' | 'reviewCount' | 'reviews'>;

export const EMPTY_FORM: SpotFormValues = {
  name: '',
  category: 'Burger',
  address: '',
  distanceKm: 0,
  badges: [],
  hours: '',
  specialties: [],
  priceRange: '€',
  lat: 0,
  lng: 0,
};
