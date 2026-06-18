import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_ES = { off_duty:'Fuera de turno', waiting:'Disponible', going_to_business:'Yendo al negocio', waiting_at_business:'En el negocio', delivering:'Entregando' };
const STATUS_COLOR = { off_duty:'bg-gray-100', waiting:'bg-green-100 text-green-700', going_to_business:'bg-yellow-100 text-yellow-700', waiting_at_business:'bg-blue-100 text-blue-700', delivering:'bg-orange-100 text-orange-700' };
const empty = { name:'', whatsapp_id:'' };

export default function Riders() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => { api.riders().then(setList); }, []);

  async function save() {
    if (form.id) { await api.updateRider(form.id, form); } else { await api.createRider(form); }
    setForm(null);
    api.riders().then(setList);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Repartidores</h1>
        <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm" onClick={() => setForm({ ...empty })}>+ Agregar</button>
      </div>
      <div className="grid gap-3">
        {list.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">🛵 {r.name}</p>
              <p className="text-xs text-gray-500">WhatsApp: {r.whatsapp_id}</p>
              <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${STATUS_COLOR[r.status] || 'bg-gray-100'}`}>{STATUS_ES[r.status] || r.status}</span>
              {r.current_lat && <p className="text-xs text-gray-400 mt-1">📍 {parseFloat(r.current_lat).toFixed(4)}, {parseFloat(r.current_lng).toFixed(4)}</p>}
            </div>
            <div className="flex gap-2">
              <button className="text-blue-600 text-sm hover:underline" onClick={() => setForm(r)}>Editar</button>
              {!r.banned && <button className="text-red-500 text-sm hover:underline" onClick={async () => { await api.banRider(r.id); api.riders().then(setList); }}>Banear</button>}
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setForm(null)}>
          <div className="bg-white rounded-xl p-6 w-80 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold">{form.id ? 'Editar' : 'Nuevo'} repartidor</h2>
            <div>
              <label className="text-xs text-gray-600">Nombre</label>
              <input className="w-full border rounded px-2 py-1 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600">WhatsApp ID (ej: 521234567890@c.us)</label>
              <input className="w-full border rounded px-2 py-1 text-sm" value={form.whatsapp_id} onChange={(e) => setForm({ ...form, whatsapp_id: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-gray-900 text-white px-4 py-2 rounded text-sm">Guardar</button>
              <button onClick={() => setForm(null)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
