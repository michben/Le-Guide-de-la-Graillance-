import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 900;
const JPEG_QUALITY = 0.5;

/**
 * Resizes + compresses a locally-picked photo and returns it as a data: URI, small enough to
 * store directly inside the Firestore review document. Free by construction — no Storage bucket,
 * no Blaze plan, just the Firestore (Spark/free tier) the app already runs on. Each photo should
 * land well under ~150 KB, keeping a review (two photos) comfortably under Firestore's 1 MB
 * per-document limit.
 */
export async function compressPhotoToDataUrl(localUri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(localUri).resize({ width: MAX_WIDTH }).renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) {
    throw new Error('Compression de la photo impossible.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}
