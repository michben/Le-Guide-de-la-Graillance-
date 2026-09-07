export type Badge = 'halal' | 'avs' | 'achahada';

export type UserRank = 'Grailleur Bronze' | 'Validateur' | 'Premium';

export type Category =
  | 'Pizza'
  | 'Kebab'
  | 'Sushi'
  | 'Burger'
  | 'Halal'
  | 'Tacos'
  | 'Poulet'
  | 'Asiatique';

export interface Review {
  id: string;
  author: string;
  authorUid?: string;
  authorRank: UserRank;
  rating: number;
  comment: string;
  ticketPhoto: boolean;
  dishPhoto: boolean;
  ticketPhotoUrl?: string;
  dishPhotoUrl?: string;
  ticketAmount?: string;
  date: string;
}

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
  reviews: Review[];
}

export interface CurrentUser {
  uid: string | null;
  name: string;
  reviewsPosted: number;
  rank: UserRank;
  isPremium: boolean;
  photoUrl?: string;
}
