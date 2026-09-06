import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { Review, Spot } from '../types';

const SPOTS_COLLECTION = 'spots';

function toSpot(id: string, data: Record<string, unknown>): Spot {
  return {
    id,
    name: String(data.name ?? ''),
    category: (data.category as Spot['category']) ?? 'Burger',
    address: String(data.address ?? ''),
    distanceKm: Number(data.distanceKm ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    badges: Array.isArray(data.badges) ? (data.badges as Spot['badges']) : [],
    hours: String(data.hours ?? ''),
    specialties: Array.isArray(data.specialties) ? (data.specialties as string[]) : [],
    priceRange: String(data.priceRange ?? '€'),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    reviews: Array.isArray(data.reviews) ? (data.reviews as Review[]) : [],
  };
}

/**
 * Subscribes to the `spots` collection in real time. Returns an unsubscribe function.
 * Firestore must be configured (see isFirebaseConfigured) before calling this.
 */
export function subscribeToSpots(
  onData: (spots: Spot[]) => void,
  onError: (error: Error) => void
) {
  if (!db) {
    onError(new Error('Firestore non configuré.'));
    return () => {};
  }
  const q = query(collection(db, SPOTS_COLLECTION), orderBy('name'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => toSpot(d.id, d.data())));
    },
    (error) => onError(error)
  );
}

/**
 * Subscribes to whether `uid` is in the `admins` collection. Returns an unsubscribe function.
 * Used to gate admin-only actions (delete review/spot/user) inside the main app.
 */
export function subscribeIsAdmin(uid: string, onData: (isAdmin: boolean) => void) {
  if (!db) {
    onData(false);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'admins', uid),
    (snap) => onData(snap.exists()),
    () => onData(false)
  );
}

/**
 * Checks the public `blockedPhones` denylist before a phone number is used to sign in.
 * This is a client-side check only — a modified client could bypass it. It stops normal
 * app usage from sending an SMS to a blocked number, but isn't a substitute for a
 * server-side Firebase Blocking Function for airtight enforcement.
 */
export async function isPhoneBlocked(phoneNumber: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'blockedPhones', phoneNumber));
  return snap.exists();
}

/**
 * Appends a review to a spot and recomputes its rating/reviewCount atomically.
 */
export async function addReviewToFirestore(
  spotId: string,
  review: Omit<Review, 'id' | 'date'>
) {
  if (!db) {
    throw new Error('Firestore non configuré.');
  }
  const spotRef = doc(db, SPOTS_COLLECTION, spotId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(spotRef);
    if (!snap.exists()) {
      throw new Error('Spot introuvable.');
    }
    const data = snap.data();
    const currentReviews: Review[] = Array.isArray(data.reviews) ? data.reviews : [];
    const currentRating = Number(data.rating ?? 0);
    const currentCount = Number(data.reviewCount ?? 0);

    const newReview: Review = {
      ...review,
      id: `${spotId}-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };

    const newCount = currentCount + 1;
    const newRating = Number(
      ((currentRating * currentCount + review.rating) / newCount).toFixed(1)
    );

    transaction.update(spotRef, {
      reviews: [newReview, ...currentReviews],
      reviewCount: newCount,
      rating: newRating,
    });
  });
}

/**
 * Removes one review from a spot and recomputes its rating/reviewCount. Admin-only per
 * Firestore rules (isAdmin()) — a non-admin write to this collection is rejected server-side.
 */
export async function deleteReviewFromFirestore(spotId: string, reviewId: string) {
  if (!db) {
    throw new Error('Firestore non configuré.');
  }
  const spotRef = doc(db, SPOTS_COLLECTION, spotId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(spotRef);
    if (!snap.exists()) {
      throw new Error('Spot introuvable.');
    }
    const data = snap.data();
    const currentReviews: Review[] = Array.isArray(data.reviews) ? data.reviews : [];
    const remaining = currentReviews.filter((r) => r.id !== reviewId);
    if (remaining.length === currentReviews.length) return;

    const newCount = remaining.length;
    const newRating =
      newCount === 0
        ? 0
        : Number((remaining.reduce((sum, r) => sum + r.rating, 0) / newCount).toFixed(1));

    transaction.update(spotRef, {
      reviews: remaining,
      reviewCount: newCount,
      rating: newRating,
    });
  });
}

/** Deletes a spot entirely. Admin-only per Firestore rules. */
export async function deleteSpotFromFirestore(spotId: string) {
  if (!db) {
    throw new Error('Firestore non configuré.');
  }
  await deleteDoc(doc(db, SPOTS_COLLECTION, spotId));
}
