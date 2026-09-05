import React, { useEffect, useMemo, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ALL_BADGES, Badge, CATEGORIES, EMPTY_FORM, Spot, SpotFormValues } from './types';

function toSpot(id: string, data: Record<string, unknown>): Spot {
  return {
    id,
    name: String(data.name ?? ''),
    category: (data.category as Spot['category']) ?? 'Burger',
    address: String(data.address ?? ''),
    distanceKm: Number(data.distanceKm ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    badges: Array.isArray(data.badges) ? (data.badges as Badge[]) : [],
    hours: String(data.hours ?? ''),
    specialties: Array.isArray(data.specialties) ? (data.specialties as string[]) : [],
    priceRange: String(data.priceRange ?? '€'),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
}

function SpotForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Spot | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<SpotFormValues>(
    initial
      ? {
          name: initial.name,
          category: initial.category,
          address: initial.address,
          distanceKm: initial.distanceKm,
          badges: initial.badges,
          hours: initial.hours,
          specialties: initial.specialties,
          priceRange: initial.priceRange,
          lat: initial.lat,
          lng: initial.lng,
        }
      : EMPTY_FORM
  );
  const [specialtiesText, setSpecialtiesText] = useState(initial?.specialties.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBadge = (badge: Badge) => {
    setValues((v) => ({
      ...v,
      badges: v.badges.includes(badge) ? v.badges.filter((b) => b !== badge) : [...v.badges, badge],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setError(null);
    setSaving(true);
    const payload: SpotFormValues = {
      ...values,
      specialties: specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (initial) {
        await updateDoc(doc(db, 'spots', initial.id), payload as Record<string, unknown>);
      } else {
        await addDoc(collection(db, 'spots'), {
          ...payload,
          rating: 0,
          reviewCount: 0,
          reviews: [],
        });
      }
      onSaved();
    } catch (err) {
      setError("Échec de l'enregistrement. Vérifie que ton compte est bien admin.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{initial ? `Modifier "${initial.name}"` : 'Ajouter un restaurant'}</h2>

      <div className="field">
        <label htmlFor="name">Nom</label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </div>

      <div className="form-row-2">
        <div className="field">
          <label htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value as Spot['category'] }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priceRange">Gamme de prix</label>
          <select
            id="priceRange"
            value={values.priceRange}
            onChange={(e) => setValues((v) => ({ ...v, priceRange: e.target.value }))}
          >
            <option value="€">€</option>
            <option value="€€">€€</option>
            <option value="€€€">€€€</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="address">Adresse</label>
        <input
          id="address"
          type="text"
          value={values.address}
          onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="hours">Horaires</label>
        <input
          id="hours"
          type="text"
          placeholder="11h - 23h"
          value={values.hours}
          onChange={(e) => setValues((v) => ({ ...v, hours: e.target.value }))}
        />
      </div>

      <div className="field">
        <label htmlFor="specialties">Spécialités (séparées par des virgules)</label>
        <textarea
          id="specialties"
          value={specialtiesText}
          onChange={(e) => setSpecialtiesText(e.target.value)}
          placeholder="Kebab maison, Frites maison, Sauce blanche"
        />
      </div>

      <div className="form-row-2">
        <div className="field">
          <label htmlFor="lat">Latitude</label>
          <input
            id="lat"
            type="number"
            step="any"
            value={values.lat}
            onChange={(e) => setValues((v) => ({ ...v, lat: Number(e.target.value) }))}
          />
        </div>
        <div className="field">
          <label htmlFor="lng">Longitude</label>
          <input
            id="lng"
            type="number"
            step="any"
            value={values.lng}
            onChange={(e) => setValues((v) => ({ ...v, lng: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="distanceKm">Distance affichée (km) — approximative pour l'instant</label>
        <input
          id="distanceKm"
          type="number"
          step="0.1"
          value={values.distanceKm}
          onChange={(e) => setValues((v) => ({ ...v, distanceKm: Number(e.target.value) }))}
        />
      </div>

      <div className="field">
        <label>Certifications</label>
        <div className="checkbox-row">
          {ALL_BADGES.map((b) => (
            <label key={b.key}>
              <input
                type="checkbox"
                checked={values.badges.includes(b.key)}
                onChange={() => toggleBadge(b.key)}
              />
              {b.emoji} {b.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? '...' : initial ? 'Enregistrer' : 'Ajouter le restaurant'}
        </button>
        {initial && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

export function Dashboard({ user }: { user: User }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Spot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [badgeFilter, setBadgeFilter] = useState<string>('');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'spots'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      setSpots(snap.docs.map((d) => toSpot(d.id, d.data())));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      spots.filter((s) => {
        if (categoryFilter && s.category !== categoryFilter) return false;
        if (badgeFilter && !s.badges.includes(badgeFilter as Badge)) return false;
        return true;
      }),
    [spots, categoryFilter, badgeFilter]
  );

  const remove = async (spot: Spot) => {
    if (!db) return;
    if (!window.confirm(`Supprimer "${spot.name}" ?`)) return;
    await deleteDoc(doc(db, 'spots', spot.id));
  };

  return (
    <div>
      <div className="topbar">
        <h1>🍔 Graillance Admin</h1>
        <div className="user">
          {user.email}{' '}
          <button className="btn-secondary" style={{ marginLeft: 10, border: 'none', background: 'none', textDecoration: 'underline' }} onClick={() => signOut(auth!)}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="layout">
        <SpotForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />

        <div className="panel">
          <h2>Restaurants ({filtered.length})</h2>
          <div className="filters">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={badgeFilter} onChange={(e) => setBadgeFilter(e.target.value)}>
              <option value="">Tous les badges</option>
              {ALL_BADGES.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.emoji} {b.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="empty-state">Aucun restaurant. Ajoute-en un avec le formulaire à gauche.</p>
          ) : (
            <div className="spot-list">
              {filtered.map((spot) => (
                <div className="spot-card" key={spot.id}>
                  <div className="info">
                    <h3>{spot.name}</h3>
                    <div className="meta">
                      {spot.category} · {spot.priceRange} · ⭐ {spot.rating} ({spot.reviewCount} avis)
                    </div>
                    <div className="meta">{spot.address}</div>
                    <div>
                      {spot.badges.map((b) => (
                        <span key={b} className={`badge-pill badge-${b}`}>
                          {ALL_BADGES.find((x) => x.key === b)?.emoji} {ALL_BADGES.find((x) => x.key === b)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn btn-secondary" onClick={() => setEditing(spot)}>
                      Modifier
                    </button>
                    <button className="btn btn-danger" onClick={() => remove(spot)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
