import {
  collection,
  doc,
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
