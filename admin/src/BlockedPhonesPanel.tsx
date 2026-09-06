import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

interface BlockedPhone {
  id: string;
  phone: string;
  reason: string;
  blockedAt: string;
}

function sanitizePhone(raw: string) {
  return raw.trim().replace(/[\s().-]/g, '');
}

export function BlockedPhonesPanel() {
  const [entries, setEntries] = useState<BlockedPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, 'blockedPhones'), (snap) => {
      setEntries(
        snap.docs.map((d) => ({
          id: d.id,
          phone: String(d.data().phone ?? d.id),
          reason: String(d.data().reason ?? ''),
          blockedAt: String(d.data().blockedAt ?? ''),
        }))
      );
      setLoading(false);
    });
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = sanitizePhone(phone);
    if (!clean.startsWith('+')) {
      setError('Format international requis, ex. +33612345678.');
      return;
    }
    if (!db) return;
    await setDoc(doc(db, 'blockedPhones', clean), {
      phone: clean,
      reason: reason.trim(),
      blockedAt: new Date().toISOString(),
    });
    setPhone('');
    setReason('');
  };

  const remove = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'blockedPhones', id));
  };

  return (
    <div className="layout">
      <form className="panel" onSubmit={add}>
        <h2>Bloquer un numéro</h2>
        <p className="empty-state" style={{ padding: 0, textAlign: 'left', marginBottom: 14 }}>
          Empêche ce numéro de recevoir un code SMS depuis l'appli (vérifié avant l'envoi). Pour un
          blocage garanti même en cas de contournement côté client, il faudra en plus une Cloud
          Function côté Firebase (nécessite le plan Blaze) — voir le README.
        </p>
        <div className="field">
          <label htmlFor="block-phone">Numéro (format international)</label>
          <input
            id="block-phone"
            type="text"
            placeholder="+33612345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="block-reason">Raison (optionnel)</label>
          <input id="block-reason" type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit">
          Bloquer ce numéro
        </button>
      </form>

      <div className="panel">
        <h2>Numéros bloqués ({entries.length})</h2>
        {loading ? (
          <p className="empty-state">Chargement...</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">Aucun numéro bloqué.</p>
        ) : (
          <div className="spot-list">
            {entries.map((entry) => (
              <div className="spot-card" key={entry.id}>
                <div className="info">
                  <h3>{entry.phone}</h3>
                  {entry.reason && <div className="meta">{entry.reason}</div>}
                  {entry.blockedAt && (
                    <div className="meta">Bloqué le {new Date(entry.blockedAt).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
                <div className="actions">
                  <button className="btn btn-danger" onClick={() => remove(entry.id)}>
                    Débloquer
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
