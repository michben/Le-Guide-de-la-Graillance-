/**
 * One-off admin script: pushes the mock spots (src/data/spots.ts) into Firestore.
 * Uses the Admin SDK (bypasses firestore.rules) via a service account key.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json npm run seed:firestore
 *
 * Get a service account key from Firebase Console > Project settings > Service accounts
 * > Generate new private key. Never commit that file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SPOTS } from '../src/data/spots';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath || !existsSync(keyPath)) {
  console.error(
    'GOOGLE_APPLICATION_CREDENTIALS is not set or the file does not exist.\n' +
      'Download a service account key from Firebase Console > Project settings > ' +
      'Service accounts > Generate new private key, then run:\n\n' +
      '  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run seed:firestore\n'
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  const batch = db.batch();
  for (const spot of SPOTS) {
    const ref = db.collection('spots').doc(spot.id);
    batch.set(ref, spot);
  }
  await batch.commit();
  console.log(`Seeded ${SPOTS.length} spots into Firestore project "${serviceAccount.project_id}".`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
