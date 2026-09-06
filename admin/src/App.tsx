import React, { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { SpotsPanel } from './Dashboard';
import { UsersPanel } from './UsersPanel';
import { BlockedPhonesPanel } from './BlockedPhonesPanel';
import { KebabFinderPanel } from './KebabFinderPanel';

function authErrorMessage(error: unknown): string {
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
    default:
      return 'Une erreur est survenue. Réessaie.';
  }
}

function NotConfiguredScreen() {
  return (
    <div className="center-screen">
      <div className="card">
        <h1><img src="/logo-mark.png" alt="" className="brand-logo" /> Graillance Admin</h1>
        <p className="muted">
          Firebase n'est pas configuré. Renseigne les variables <code>VITE_FIREBASE_*</code> (voir{' '}
          <code>admin/.env.example</code>) dans les variables d'environnement de ce déploiement,
          puis redéploie.
        </p>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signUp') {
        await createUserWithEmailAndPassword(auth!, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth!, email.trim(), password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth!, new GoogleAuthProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1><img src="/logo-mark.png" alt="" className="brand-logo" /> Graillance Admin</h1>
        <p className="muted">
          {mode === 'signIn'
            ? 'Connecte-toi avec ton compte admin.'
            : 'Crée un premier compte, puis ajoute son uid à la collection `admins` dans Firestore.'}
        </p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? '...' : mode === 'signIn' ? 'Se connecter' : 'Créer le compte'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ marginTop: 10 }}
          onClick={google}
          disabled={loading}
        >
          Continuer avec Google
        </button>
        <p className="muted" style={{ marginTop: 14, marginBottom: 0, textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ border: 'none', background: 'none', textDecoration: 'underline', padding: 0 }}
            onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          >
            {mode === 'signIn' ? 'Créer un compte' : "J'ai déjà un compte"}
          </button>
        </p>
      </form>
    </div>
  );
}

function AccessDeniedScreen({ user }: { user: User }) {
  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: 460 }}>
        <h1>Accès refusé</h1>
        <p className="muted">
          Ton compte ({user.email}) est bien authentifié mais n'est pas admin. Dans la console
          Firebase, va dans <strong>Firestore Database</strong>, ouvre (ou crée) la collection{' '}
          <code>admins</code>, et ajoute un document dont l'ID est exactement :
        </p>
        <p
          className="muted"
          style={{
            background: '#f5f5f5',
            padding: '10px 12px',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 13,
            wordBreak: 'break-all',
          }}
        >
          {user.uid}
        </p>
        <p className="muted">Le contenu du document n'a pas d'importance, seule son existence compte. Recharge cette page ensuite.</p>
        <button className="btn btn-secondary btn-block" onClick={() => signOut(auth!)}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setAdminChecked(false);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, 'admins', user.uid)).then((snap) => {
      if (cancelled) return;
      setIsAdmin(snap.exists());
      setAdminChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isFirebaseConfigured) return <NotConfiguredScreen />;
  if (authLoading) return <div className="center-screen">Chargement...</div>;
  if (!user) return <LoginScreen />;
  if (!adminChecked) return <div className="center-screen">Vérification des droits...</div>;
  if (!isAdmin) return <AccessDeniedScreen user={user} />;

  return <AdminHome user={user} />;
}

type Tab = 'spots' | 'users' | 'phones' | 'kebabs';

export function AdminHome({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('spots');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'spots', label: 'Restaurants' },
    { key: 'kebabs', label: 'Trouver des kebabs' },
    { key: 'users', label: 'Utilisateurs' },
    { key: 'phones', label: 'Numéros bloqués' },
  ];

  return (
    <div>
      <div className="topbar">
        <h1><img src="/logo-mark.png" alt="" className="brand-logo" /> Graillance Admin</h1>
        <div className="user">
          {user.email}{' '}
          <button
            className="btn-secondary"
            style={{ marginLeft: 10, border: 'none', background: 'none', textDecoration: 'underline' }}
            onClick={() => signOut(auth!)}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'tab-btn-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'spots' && <SpotsPanel />}
      {tab === 'kebabs' && <KebabFinderPanel />}
      {tab === 'users' && <UsersPanel currentUser={user} />}
      {tab === 'phones' && <BlockedPhonesPanel />}
    </div>
  );
}
