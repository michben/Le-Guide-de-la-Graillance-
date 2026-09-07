import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  displayName?: string;
  photoUrl?: string;
}

/** Subscribes to a user's profile document (users/{uid}). Returns an unsubscribe function. */
export function subscribeUserProfile(uid: string, onData: (profile: UserProfile | null) => void) {
  if (!db) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => onData(snap.exists() ? (snap.data() as UserProfile) : null),
    () => onData(null)
  );
}

/** Creates/merges fields into a user's own profile document. */
export async function updateUserProfile(uid: string, data: UserProfile) {
  if (!db) {
    throw new Error('Firestore non configuré.');
  }
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}
