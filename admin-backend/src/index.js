const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var is required (the full service account JSON).');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
});

const db = admin.firestore();
const auth = admin.auth();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://graillance-admin.onrender.com,http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);

/** Verifies the caller's Firebase ID token and that they're in the admins collection. */
async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });

  try {
    const decoded = await auth.verifyIdToken(token);
    const adminDoc = await db.collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Not an admin.' });
    }
    req.uid = decoded.uid;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = [];
    let pageToken;
    do {
      const page = await auth.listUsers(1000, pageToken);
      users.push(...page.users);
      pageToken = page.pageToken;
    } while (pageToken);

    const adminSnap = await db.collection('admins').get();
    const adminUids = new Set(adminSnap.docs.map((d) => d.id));

    res.json(
      users.map((u) => ({
        uid: u.uid,
        email: u.email || null,
        phoneNumber: u.phoneNumber || null,
        displayName: u.displayName || null,
        providerIds: u.providerData.map((p) => p.providerId),
        disabled: u.disabled,
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
        isAdmin: adminUids.has(u.uid),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

app.post('/admin-accounts', requireAdmin, async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters.' });
  }

  try {
    const userRecord = await auth.createUser({ email, password, displayName: displayName || undefined });
    await db.collection('admins').doc(userRecord.uid).set({
      email,
      addedBy: req.uid,
      addedAt: new Date().toISOString(),
    });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (err) {
    console.error(err);
    const message = err.code === 'auth/email-already-exists' ? 'Un compte existe déjà avec cet email.' : 'Échec de la création du compte.';
    res.status(400).json({ error: message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`admin-backend listening on ${port}`));
