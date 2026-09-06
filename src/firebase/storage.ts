import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a locally-picked image (a file:// URI on native, blob:/data: on web) to
 * Firebase Storage and returns its public download URL. Requires Cloud Storage for
 * Firebase to be enabled on the project (Firebase Console > Build > Storage > Get started) —
 * without it, `storage` is still defined (same app instance) but every call here rejects.
 */
export async function uploadReviewPhoto(localUri: string, path: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage non configuré.');
  }
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(fileRef);
}
