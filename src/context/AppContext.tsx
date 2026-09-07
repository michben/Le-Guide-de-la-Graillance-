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
import {
  addReviewToFirestore,
  deleteReviewFromFirestore,
  deleteSpotFromFirestore,
  subscribeIsAdmin,
  subscribeToSpots,
} from '../firebase/firestore';
import { subscribeUserProfile, updateUserProfile, UserProfile } from '../firebase/users';

const ADMIN_BACKEND_URL = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;

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
  isAdmin: boolean;
  deleteReview: (spotId: string, reviewId: string) => Promise<void>;
  deleteSpot: (spotId: string) => Promise<void>;
  deleteUserAccount: (uid: string) => Promise<void>;
  updateProfilePhoto: (dataUrl: string) => Promise<void>;
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
  const [demoReviewsPosted, setDemoReviewsPosted] = useState(2);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((u) => {
      setFirebaseUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setIsAdmin(false);
      return;
    }
    return subscribeIsAdmin(firebaseUser.uid, setIsAdmin);
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }
    return subscribeUserProfile(firebaseUser.uid, setProfile);
  }, [firebaseUser]);

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

  // Real count of reviews this account actually posted (matched by authorUid), instead of a
  // local counter that reset on every reload. Demo mode (no real backend) keeps its own counter
  // since there's no account to match reviews against.
  const reviewsPosted = useMemo(() => {
    if (!isFirebaseConfigured || !firebaseUser) return demoReviewsPosted;
    return spots.reduce(
      (sum, spot) => sum + spot.reviews.filter((r) => r.authorUid === firebaseUser.uid).length,
      0
    );
  }, [spots, firebaseUser, demoReviewsPosted]);

  const rank = isPremium ? 'Premium' : rankForCount(reviewsPosted);

  const user: CurrentUser = useMemo(
    () => ({
      uid: firebaseUser?.uid ?? null,
      name: firebaseUser?.displayName || firebaseUser?.email || 'Toi',
      reviewsPosted,
      rank,
      isPremium,
      photoUrl: profile?.photoUrl,
    }),
    [firebaseUser, reviewsPosted, rank, isPremium, profile]
  );

  const addReview: AppContextValue['addReview'] = async (spotId, review) => {
    const reviewWithRank = { ...review, authorRank: rank, authorUid: firebaseUser?.uid };

    if (isFirebaseConfigured) {
      await addReviewToFirestore(spotId, reviewWithRank);
      // spots state + reviewsPosted update via the onSnapshot listener once Firestore confirms the write.
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
      setDemoReviewsPosted((n) => n + 1);
    }
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
    isAdmin,
    deleteReview: (spotId, reviewId) => deleteReviewFromFirestore(spotId, reviewId),
    deleteSpot: (spotId) => deleteSpotFromFirestore(spotId),
    deleteUserAccount: async (uid) => {
      if (!ADMIN_BACKEND_URL) {
        throw new Error('Backend admin non configuré (EXPO_PUBLIC_ADMIN_BACKEND_URL manquant).');
      }
      if (!firebaseUser) {
        throw new Error('Non authentifié.');
      }
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`${ADMIN_BACKEND_URL}/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error || 'Échec de la suppression du compte.');
      }
    },
    updateProfilePhoto: async (dataUrl) => {
      if (!firebaseUser) {
        throw new Error('Non authentifié.');
      }
      await updateUserProfile(firebaseUser.uid, { photoUrl: dataUrl });
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
