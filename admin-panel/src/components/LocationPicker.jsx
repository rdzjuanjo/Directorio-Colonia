// LocationPicker.jsx — Mapa Leaflet para fijar la ubicación del negocio arrastrando un pin; devuelve lat/lng al formulario padre
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default marker icon broken by Vite's asset bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow, iconRetinaUrl: markerIcon });

const CENTER = [20.6422, -103.3122]; // Tlaquepaque, Jalisco

export default function LocationPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initial = lat && lng ? [parseFloat(lat), parseFloat(lng)] : CENTER;
    const map = L.map(containerRef.current, { center: initial, zoom: 16 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(initial, { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const { lat: la, lng: lo } = marker.getLatLng();
      onChange({ lat: la, lng: lo });
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function useGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      markerRef.current?.setLatLng(ll);
      mapRef.current?.setView(ll, 17);
      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  const hasCoords = lat != null && lat !== '' && lng != null && lng !== '';

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height: 220, borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">
          {hasCoords
            ? `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`
            : 'Haz clic en el mapa o arrastra el pin'}
        </span>
        <button
          type="button"
          onClick={useGPS}
          className="text-xs text-blue-600 hover:underline"
        >
          📍 Usar mi ubicación
        </button>
      </div>
    </div>
  );
}
