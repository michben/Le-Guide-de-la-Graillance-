import React, { createContext, useContext, useMemo, useState } from 'react';
import { CurrentUser, Review, Spot, UserRank } from '../types';
import { SPOTS } from '../data/spots';

function rankForCount(count: number): UserRank {
  if (count >= 10) return 'Premium';
  if (count >= 3) return 'Validateur';
  return 'Grailleur Bronze';
}

interface AppContextValue {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  location: string | null;
  setLocation: (loc: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  spots: Spot[];
  addReview: (spotId: string, review: Omit<Review, 'id' | 'date' | 'authorRank'>) => void;
  user: CurrentUser;
  isPremium: boolean;
  setPremium: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>(SPOTS);
  const [reviewsPosted, setReviewsPosted] = useState(2);
  const [isPremium, setIsPremium] = useState(false);

  const rank = isPremium ? 'Premium' : rankForCount(reviewsPosted);

  const user: CurrentUser = useMemo(
    () => ({
      name: 'Toi',
      reviewsPosted,
      rank,
      isPremium,
    }),
    [reviewsPosted, rank, isPremium]
  );

  const addReview: AppContextValue['addReview'] = (spotId, review) => {
    setSpots((prev) =>
      prev.map((spot) =>
        spot.id === spotId
          ? {
              ...spot,
              reviewCount: spot.reviewCount + 1,
              rating: Number(
                ((spot.rating * spot.reviewCount + review.rating) / (spot.reviewCount + 1)).toFixed(1)
              ),
              reviews: [
                {
                  ...review,
                  id: `${spotId}-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 10),
                  authorRank: rank,
                },
                ...spot.reviews,
              ],
            }
          : spot
      )
    );
    setReviewsPosted((n) => n + 1);
  };

  const value: AppContextValue = {
    isLoggedIn,
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
    location,
    setLocation,
    selectedCategory,
    setSelectedCategory,
    spots,
    addReview,
    user,
    isPremium,
    setPremium: setIsPremium,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
