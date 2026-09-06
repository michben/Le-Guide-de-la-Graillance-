import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

interface FoundSpot {
  osmId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  hours: string;
  added: boolean;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatAddress(tags: Record<string, string>) {
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.join(', ') || 'Adresse non précisée (OpenStreetMap)';
}

export function KebabFinderPanel() {
  const [address, setAddress] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FoundSpot[] | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);
    if (!address.trim()) return;
    setSearching(true);
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) {
        setError("Adresse introuvable. Essaie d'être plus précis (rue, ville).");
        return;
      }
      const lat = Number(geoData[0].lat);
      const lng = Number(geoData[0].lon);
      setOrigin({ lat, lng, label: geoData[0].display_name });

      const radiusM = Math.round(radiusKm * 1000);
      const overpassQuery = `[out:json][timeout:25];(node["amenity"="fast_food"]["cuisine"~"kebab",i](around:${radiusM},${lat},${lng});node["shop"="kebab"](around:${radiusM},${lat},${lng});node["name"~"kebab",i](around:${radiusM},${lat},${lng}););out body;`;

      const opRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });
      if (!opRes.ok) throw new Error('overpass-error');
      const opData = await opRes.json();

      const found: FoundSpot[] = (opData.elements || []).map((el: any) => ({
        osmId: el.id,
        name: el.tags?.name || 'Kebab (nom inconnu)',
        address: formatAddress(el.tags || {}),
        lat: el.lat,
        lng: el.lon,
        distanceKm: Math.round(haversineKm(lat, lng, el.lat, el.lon) * 10) / 10,
        hours: el.tags?.opening_hours || '',
        added: false,
      }));
      found.sort((a, b) => a.distanceKm - b.distanceKm);
      setResults(found);
    } catch (err) {
      setError("Échec de la recherche (OpenStreetMap indisponible ?). Réessaie dans un instant.");
    } finally {
      setSearching(false);
    }
  };

  const addResult = async (spot: FoundSpot) => {
    if (!db) return;
    await addDoc(collection(db, 'spots'), {
      name: spot.name,
      category: 'Kebab',
      address: spot.address,
      distanceKm: 1,
      rating: 0,
      reviewCount: 0,
      badges: [],
      hours: spot.hours,
      specialties: [],
      priceRange: '€',
      lat: spot.lat,
      lng: spot.lng,
      reviews: [],
    });
    setResults((prev) => prev && prev.map((r) => (r.osmId === spot.osmId ? { ...r, added: true } : r)));
  };

  return (
    <div className="layout">
      <form className="panel" onSubmit={search}>
        <h2>Trouver des kebabs à proximité</h2>
        <p className="empty-state" style={{ padding: 0, textAlign: 'left', marginBottom: 14 }}>
          Cherche dans OpenStreetMap les spots kebab autour d'une adresse. Le statut halal n'étant
          pas fiable sur OpenStreetMap, aucun badge n'est ajouté automatiquement — à toi de les
          cocher si tu confirmes.
        </p>
        <div className="field">
          <label htmlFor="kf-address">Adresse de référence</label>
          <input
            id="kf-address"
            type="text"
            placeholder="Ex. Place de la République, Paris"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="kf-radius">Rayon (km)</label>
          <input
            id="kf-radius"
            type="number"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={searching}>
          {searching ? 'Recherche...' : 'Chercher des kebabs'}
        </button>
      </form>

      <div className="panel">
        <h2>Résultats {results ? `(${results.length})` : ''}</h2>
        {origin && <p className="empty-state" style={{ padding: 0, textAlign: 'left' }}>📍 {origin.label}</p>}
        {!results ? (
          <p className="empty-state">Lance une recherche pour voir les résultats.</p>
        ) : results.length === 0 ? (
          <p className="empty-state">Aucun kebab trouvé dans ce rayon.</p>
        ) : (
          <div className="spot-list">
            {results.map((r) => (
              <div className="spot-card" key={r.osmId}>
                <div className="info">
                  <h3>{r.name}</h3>
                  <div className="meta">{r.distanceKm} km · {r.address}</div>
                  {r.hours && <div className="meta">Horaires OSM : {r.hours}</div>}
                </div>
                <div className="actions">
                  <button className="btn" disabled={r.added} onClick={() => addResult(r)}>
                    {r.added ? 'Ajouté ✓' : 'Ajouter'}
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
