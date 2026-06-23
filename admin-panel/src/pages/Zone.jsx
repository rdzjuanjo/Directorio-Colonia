import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';

// Tlaquepaque, Jalisco
const CENTER = [20.6422, -103.3122];
const POLY_STYLE  = { color: '#2563eb', weight: 2.5, fillOpacity: 0.12, fillColor: '#3b82f6' };
const DRAFT_STYLE = { color: '#2563eb', dashArray: '6 5', weight: 2, opacity: 0.7 };

export default function Zone() {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const polygonRef   = useRef(null); // saved polygon layer
  const draftLineRef = useRef(null); // polyline shown while drawing
  const markersRef   = useRef([]);   // click markers while drawing
  const draftPtsRef  = useRef([]);   // draft points [[lat,lng],...]
  const finalPtsRef  = useRef([]);   // finalized polygon points
  const modeRef      = useRef('view');

  const [mode, setMode]       = useState('view');   // 'view' | 'drawing'
  const [draftLen, setDraftLen] = useState(0);
  const [hasZone, setHasZone] = useState(false);
  const [dirty, setDirty]     = useState(false);    // unsaved changes
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  /* ── helpers ───────────────────────────────────────────────────────────── */

  function clearMarkers(map) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (draftLineRef.current) { map.removeLayer(draftLineRef.current); draftLineRef.current = null; }
  }

  function redrawDraft(map) {
    clearMarkers(map);
    const pts = draftPtsRef.current;
    pts.forEach((pt) => {
      const m = L.circleMarker(pt, { radius: 5, color: '#2563eb', fillOpacity: 1, weight: 1 }).addTo(map);
      markersRef.current.push(m);
    });
    if (pts.length > 1) {
      draftLineRef.current = L.polyline(pts, DRAFT_STYLE).addTo(map);
    }
  }

  function showPolygon(map, pts) {
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    if (pts.length >= 3) {
      polygonRef.current = L.polygon(pts, POLY_STYLE).addTo(map);
      setHasZone(true);
    }
  }

  /* ── map init ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    const map = L.map(containerRef.current, { center: CENTER, zoom: 15 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Load existing zone
    api.config().then((cfgs) => {
      const row = cfgs.find((c) => c.key === 'delivery_zone');
      if (row?.value) {
        try {
          const pts = JSON.parse(row.value);
          if (Array.isArray(pts) && pts.length >= 3) {
            finalPtsRef.current = pts;
            showPolygon(map, pts);
            map.fitBounds(L.polygon(pts).getBounds(), { padding: [40, 40] });
          }
        } catch (e) {
          console.error('[Zone] delivery_zone inválido en config:', e);
          setMsg('⚠️ La zona guardada tiene formato inválido. Redibujá para corregirla.');
        }
      }
    });

    map.on('click', (e) => {
      if (modeRef.current !== 'drawing') return;
      draftPtsRef.current = [...draftPtsRef.current, [e.latlng.lat, e.latlng.lng]];
      setDraftLen(draftPtsRef.current.length);
      redrawDraft(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── actions ───────────────────────────────────────────────────────────── */

  function startDrawing() {
    const map = mapRef.current;
    if (!map) return;
    // Remove existing polygon while drawing
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    clearMarkers(map);
    draftPtsRef.current = [];
    setDraftLen(0);
    setHasZone(false);
    modeRef.current = 'drawing';
    setMode('drawing');
    setMsg('Haz clic en el mapa para agregar puntos. Necesitás al menos 3 para cerrar el polígono.');
  }

  function finishDrawing() {
    const map = mapRef.current;
    if (!map) return;
    if (draftPtsRef.current.length < 3) {
      setMsg('Agregá al menos 3 puntos antes de terminar.');
      return;
    }
    const pts = [...draftPtsRef.current];
    clearMarkers(map);
    showPolygon(map, pts);
    finalPtsRef.current = pts;
    modeRef.current = 'view';
    setMode('view');
    setDirty(true);
    setMsg('Polígono listo. Presioná Guardar para aplicarlo.');
  }

  function undoLastPoint() {
    const map = mapRef.current;
    if (!map || draftPtsRef.current.length === 0) return;
    draftPtsRef.current = draftPtsRef.current.slice(0, -1);
    setDraftLen(draftPtsRef.current.length);
    redrawDraft(map);
  }

  function cancelDrawing() {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers(map);
    draftPtsRef.current = [];
    setDraftLen(0);
    modeRef.current = 'view';
    setMode('view');
    // Restore previous polygon if any
    if (finalPtsRef.current.length >= 3) {
      showPolygon(map, finalPtsRef.current);
    }
    setMsg('');
  }

  function clearZone() {
    const map = mapRef.current;
    if (!map) return;
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    clearMarkers(map);
    finalPtsRef.current = [];
    draftPtsRef.current = [];
    setDraftLen(0);
    setHasZone(false);
    setDirty(true);
    setMsg('Zona eliminada. Presioná Guardar para confirmar.');
  }

  async function save() {
    setSaving(true);
    setMsg('');
    const value = finalPtsRef.current.length >= 3 ? JSON.stringify(finalPtsRef.current) : '';
    await api.updateConfig('delivery_zone', value);
    setSaving(false);
    setDirty(false);
    setMsg(value ? '✅ Zona guardada correctamente.' : '✅ Zona de cobertura eliminada.');
  }

  /* ── render ─────────────────────────────────────────────────────────────── */

  const isDrawing = mode === 'drawing';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Zona de entrega</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Trazá el polígono de cobertura. Pedidos fuera de la zona se ofrecen como retiro en tienda.
          </p>
        </div>
        <div className="flex gap-2">
          {!isDrawing && (
            <>
              <button
                onClick={startDrawing}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                ✏️ {hasZone ? 'Redibujar' : 'Dibujar zona'}
              </button>
              {hasZone && (
                <button
                  onClick={clearZone}
                  className="border border-red-300 text-red-600 px-4 py-2 rounded text-sm hover:bg-red-50">
                  🗑️ Eliminar zona
                </button>
              )}
              {dirty && (
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-gray-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                  {saving ? 'Guardando…' : '💾 Guardar'}
                </button>
              )}
            </>
          )}
          {isDrawing && (
            <>
              <span className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded self-center">
                {draftLen} punto{draftLen !== 1 ? 's' : ''}
              </span>
              {draftLen > 0 && (
                <button onClick={undoLastPoint}
                  className="border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                  ↩ Deshacer
                </button>
              )}
              <button
                onClick={finishDrawing}
                disabled={draftLen < 3}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-40 hover:bg-blue-700">
                ✅ Cerrar polígono
              </button>
              <button onClick={cancelDrawing}
                className="border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2 rounded ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {msg}
        </div>
      )}

      {!hasZone && !isDrawing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          ⚠️ Sin zona configurada — los pedidos se entregan a cualquier dirección.
        </div>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden shadow border border-gray-200">
        <div
          ref={containerRef}
          style={{ height: '520px', cursor: isDrawing ? 'crosshair' : 'grab' }}
        />
      </div>

      <p className="text-xs text-gray-400">
        Mapa © OpenStreetMap contributors. Coordenadas en formato [latitud, longitud].
      </p>
    </div>
  );
}
