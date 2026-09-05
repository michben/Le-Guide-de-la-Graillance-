import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CurrentUser, Review, Spot, UserRank } from '../types';
import { SPOTS } from '../data/spots';
import { isFirebaseConfigured } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmail,
  signOut as firebaseSignOut,
  signUpWithEmail,
  User,
} from '../firebase/auth';
import { addReviewToFirestore, subscribeToSpots } from '../firebase/firestore';

function rankForCount(count: number): UserRank {
  if (count >= 10) return 'Premium';
  if (count >= 3) return 'Validateur';
  return 'Grailleur Bronze';
}

interface AppContextValue {
  isLoggedIn: boolean;
  authLoading: boolean;
  isFirebaseConfigured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  logout: () => Promise<void>;
  location: string | null;
  setLocation: (loc: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  spots: Spot[];
  spotsLoading: boolean;
  spotsError: string | null;
  addReview: (spotId: string, review: Omit<Review, 'id' | 'date' | 'authorRank'>) => Promise<void>;
  user: CurrentUser;
  isPremium: boolean;
  setPremium: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>(isFirebaseConfigured ? [] : SPOTS);
  const [spotsLoading, setSpotsLoading] = useState(isFirebaseConfigured);
  const [spotsError, setSpotsError] = useState<string | null>(null);
  const [reviewsPosted, setReviewsPosted] = useState(2);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((u) => {
      setFirebaseUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const isLoggedIn = isFirebaseConfigured ? Boolean(firebaseUser) : isDemoLoggedIn;

  useEffect(() => {
    if (!isFirebaseConfigured || !isLoggedIn) return;
    setSpotsLoading(true);
    const unsubscribe = subscribeToSpots(
      (data) => {
        setSpots(data);
        setSpotsLoading(false);
        setSpotsError(null);
      },
      (error) => {
        setSpotsError(error.message);
        setSpotsLoading(false);
      }
    );
    return unsubscribe;
  }, [isLoggedIn]);

  const rank = isPremium ? 'Premium' : rankForCount(reviewsPosted);

  const user: CurrentUser = useMemo(
    () => ({
      name: firebaseUser?.displayName || firebaseUser?.email || 'Toi',
      reviewsPosted,
      rank,
      isPremium,
    }),
    [firebaseUser, reviewsPosted, rank, isPremium]
  );

  const addReview: AppContextValue['addReview'] = async (spotId, review) => {
    const reviewWithRank = { ...review, authorRank: rank };

    if (isFirebaseConfigured) {
      await addReviewToFirestore(spotId, reviewWithRank);
      // spots state updates via the onSnapshot listener once Firestore confirms the write.
    } else {
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
                    ...reviewWithRank,
                    id: `${spotId}-${Date.now()}`,
                    date: new Date().toISOString().slice(0, 10),
                  },
                  ...spot.reviews,
                ],
              }
            : spot
        )
      );
    }
    setReviewsPosted((n) => n + 1);
  };

  const value: AppContextValue = {
    isLoggedIn,
    authLoading,
    isFirebaseConfigured,
    signUp: async (email, password, displayName) => {
      await signUpWithEmail(email, password, displayName);
    },
    signIn: async (email, password) => {
      await signInWithEmail(email, password);
    },
    demoLogin: () => setIsDemoLoggedIn(true),
    logout: async () => {
      if (isFirebaseConfigured) {
        await firebaseSignOut();
      }
      setIsDemoLoggedIn(false);
    },
    location,
    setLocation,
    selectedCategory,
    setSelectedCategory,
    spots,
    spotsLoading,
    spotsError,
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
