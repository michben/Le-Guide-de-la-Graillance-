import { Platform } from 'react-native';
import {
  ConfirmationResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export type { User, ConfirmationResult };

/** A verifier that can satisfy Firebase's phone-auth challenge: an ApplicationVerifier
 * on web (RecaptchaVerifier) or a FirebaseRecaptchaVerifierModal ref on native. */
export type PhoneAppVerifier = Parameters<typeof firebaseSignInWithPhoneNumber>[2];

function requireAuth() {
  if (!auth) {
    throw new Error(
      'Firebase Auth non configuré. Renseigne les variables EXPO_PUBLIC_FIREBASE_* dans .env.'
    );
  }
  return auth;
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function signOut() {
  await firebaseSignOut(requireAuth());
}

/** Web only: opens the Google account picker in a popup. */
export async function signInWithGooglePopup() {
  const credential = await signInWithPopup(requireAuth(), new GoogleAuthProvider());
  return credential.user;
}

/** Native only: exchange the ID token from expo-auth-session's Google flow for a Firebase session. */
export async function signInWithGoogleIdToken(idToken: string) {
  const credential = await signInWithCredential(requireAuth(), GoogleAuthProvider.credential(idToken));
  return credential.user;
}

let webRecaptchaVerifier: import('firebase/auth').RecaptchaVerifier | undefined;

/** Web only: lazily creates a single invisible reCAPTCHA bound to a hidden DOM node. */
async function getWebRecaptchaVerifier() {
  const { RecaptchaVerifier } = await import('firebase/auth');
  if (!webRecaptchaVerifier) {
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }
    webRecaptchaVerifier = new RecaptchaVerifier(requireAuth(), container, { size: 'invisible' });
  }
  return webRecaptchaVerifier;
}

/**
 * Sends an SMS verification code. On web, the reCAPTCHA is created and managed internally.
 * On native, pass the ref from a mounted <FirebaseRecaptchaVerifierModal> (expo-firebase-recaptcha)
 * as `nativeVerifier`.
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  nativeVerifier?: PhoneAppVerifier
): Promise<ConfirmationResult> {
  const verifier = Platform.OS === 'web' ? await getWebRecaptchaVerifier() : nativeVerifier;
  if (!verifier) {
    throw new Error('Vérificateur reCAPTCHA manquant pour la connexion par téléphone.');
  }
  return firebaseSignInWithPhoneNumber(requireAuth(), phoneNumber, verifier);
}

export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string) {
  const credential = await confirmation.confirm(code);
  return credential.user;
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/weak-password':
      return 'Mot de passe trop court (6 caractères minimum).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives, réessaie dans quelques minutes.';
    case 'auth/invalid-phone-number':
      return 'Numéro de téléphone invalide (format international, ex. +33612345678).';
    case 'auth/invalid-verification-code':
      return 'Code incorrect.';
    case 'auth/code-expired':
      return 'Ce code a expiré, redemande-en un.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Connexion annulée.';
    default:
      return "Une erreur est survenue. Réessaie.";
  }
}
