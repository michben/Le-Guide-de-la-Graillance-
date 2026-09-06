import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { backendUrl, db } from './firebase';

interface AdminUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  providerIds: string[];
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
  isAdmin: boolean;
}

function CreateAdminForm({ currentUser, onCreated }: { currentUser: User; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`${backendUrl}/admin-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ email: email.trim(), password, displayName: displayName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la création.');
      setSuccess(`Compte admin créé : ${data.email}`);
      setEmail('');
      setPassword('');
      setDisplayName('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Créer un compte admin</h2>
      <p className="empty-state" style={{ padding: 0, textAlign: 'left', marginBottom: 14 }}>
        Crée directement un compte avec mot de passe et droits admin — pas besoin que la personne
        s'inscrive elle-même.
      </p>
      <div className="field">
        <label htmlFor="new-admin-name">Nom (optionnel)</label>
        <input id="new-admin-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="new-admin-email">Email</label>
        <input
          id="new-admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="new-admin-password">Mot de passe</label>
        <input
          id="new-admin-password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      {success && <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>{success}</p>}
      <button className="btn" type="submit" disabled={saving}>
        {saving ? '...' : 'Créer le compte admin'}
      </button>
    </form>
  );
}

export function UsersPanel({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    if (!backendUrl) {
      setError("VITE_ADMIN_BACKEND_URL n'est pas configuré (voir README).");
      return;
    }
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`${backendUrl}/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du chargement.');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du chargement.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAdmin = async (u: AdminUser) => {
    if (!db) return;
    setBusyUid(u.uid);
    try {
      if (u.isAdmin) {
        await deleteDoc(doc(db, 'admins', u.uid));
      } else {
        await setDoc(doc(db, 'admins', u.uid), {
          email: u.email,
          addedBy: currentUser.uid,
          addedAt: new Date().toISOString(),
        });
      }
      setUsers((prev) => prev && prev.map((x) => (x.uid === u.uid ? { ...x, isAdmin: !x.isAdmin } : x)));
    } catch (err) {
      window.alert("Échec de la mise à jour des droits admin.");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="layout">
      <CreateAdminForm currentUser={currentUser} onCreated={load} />

      <div className="panel">
        <h2>Utilisateurs {users ? `(${users.length})` : ''}</h2>
        {error && <p className="error-text">{error}</p>}
        {!users && !error ? (
          <p className="empty-state">Chargement...</p>
        ) : users && users.length === 0 ? (
          <p className="empty-state">Aucun utilisateur pour l'instant.</p>
        ) : (
          <div className="spot-list">
            {users?.map((u) => (
              <div className="spot-card" key={u.uid}>
                <div className="info">
                  <h3>{u.displayName || u.email || u.phoneNumber || u.uid}</h3>
                  <div className="meta">
                    {u.email || '—'} {u.phoneNumber ? `· ${u.phoneNumber}` : ''}
                  </div>
                  <div className="meta">
                    Inscrit·e via {u.providerIds.join(', ') || 'inconnu'} · Créé le{' '}
                    {new Date(u.creationTime).toLocaleDateString('fr-FR')}
                  </div>
                  {u.isAdmin && (
                    <span className="badge-pill badge-avs" style={{ marginTop: 6, display: 'inline-block' }}>
                      👑 Admin
                    </span>
                  )}
                </div>
                <div className="actions">
                  <button
                    className={u.isAdmin ? 'btn btn-danger' : 'btn btn-secondary'}
                    disabled={busyUid === u.uid}
                    onClick={() => toggleAdmin(u)}
                  >
                    {u.isAdmin ? 'Retirer admin' : 'Rendre admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
