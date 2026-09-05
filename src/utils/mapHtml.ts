import { Spot } from '../types';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletAssets';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  rating: number;
  category: string;
}

export function spotsToMarkers(spots: Spot[]): MapMarker[] {
  return spots.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    name: s.name,
    rating: s.rating,
    category: s.category,
  }));
}

/**
 * Self-contained HTML page rendering an OpenStreetMap/Leaflet map with one marker per spot.
 * Leaflet's JS/CSS are inlined (see leafletAssets.ts) so only the OSM tile requests need
 * network at runtime — the mapping library itself works even if a CDN is unreachable.
 * Markers use an emoji divIcon rather than Leaflet's default image icon, since the default
 * icon's path auto-detection doesn't work for an inlined (non-<script src>) Leaflet.
 * Tapping a marker's popup button posts `{ type: 'selectSpot', id }` back to the host
 * (React Native WebView on native, window.parent on web) so the caller can navigate.
 */
export function buildMapHtml(markers: MapMarker[]): string {
  const points = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  const center = points.length
    ? {
        lat: points.reduce((sum, m) => sum + m.lat, 0) / points.length,
        lng: points.reduce((sum, m) => sum + m.lng, 0) / points.length,
      }
    : { lat: 46.6, lng: 2.2 }; // roughly the center of France as a fallback

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>${LEAFLET_CSS}</style>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #DCEEDC; }
    .spot-pin { font-size: 28px; line-height: 1; transform: translate(-50%, -100%); }
    .spot-popup { font-family: -apple-system, Roboto, sans-serif; }
    .spot-popup h3 { margin: 0 0 4px; font-size: 14px; }
    .spot-popup p { margin: 0 0 8px; font-size: 12px; color: #6B655F; }
    .spot-popup button {
      background: #FF5A36; color: #fff; border: none; border-radius: 8px;
      padding: 6px 10px; font-weight: 700; font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>${LEAFLET_JS}</script>
  <script>
    var markers = ${JSON.stringify(points)};
    var map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lng}], ${points.length > 1 ? 13 : 14});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var pinIcon = L.divIcon({
      html: '<div class="spot-pin">📍</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });

    function send(payload) {
      var msg = JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent) {
        window.parent.postMessage(msg, '*');
      }
    }

    var bounds = [];
    markers.forEach(function (m) {
      var marker = L.marker([m.lat, m.lng], { icon: pinIcon }).addTo(map);
      var el = document.createElement('div');
      el.className = 'spot-popup';
      el.innerHTML = '<h3>' + m.name + '</h3><p>⭐ ' + m.rating + ' · ' + m.category + '</p>';
      var btn = document.createElement('button');
      btn.textContent = 'Voir le spot';
      btn.onclick = function () { send({ type: 'selectSpot', id: m.id }); };
      el.appendChild(btn);
      marker.bindPopup(el);
      bounds.push([m.lat, m.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  </script>
</body>
</html>`;
}
