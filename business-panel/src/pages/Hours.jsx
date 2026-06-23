// Hours.jsx — Configuración de horarios de atención: activa/desactiva cada día y define hora de apertura y cierre
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const DAYS = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' }, { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_HOURS = Object.fromEntries(DAYS.map(({ key }) => [key, { open: false, from: '09:00', to: '21:00' }]));

export default function Hours() {
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.me().then((biz) => {
      if (biz?.hours_json && Object.keys(biz.hours_json).length) {
        setHours({ ...DEFAULT_HOURS, ...biz.hours_json });
      }
    });
  }, []);

  async function save() {
    await api.updateMe({ hours_json: hours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(day, field, value) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-bold">Horarios de atención</h1>
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        {DAYS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <input type="checkbox" checked={hours[key]?.open || false}
              onChange={(e) => update(key, 'open', e.target.checked)} className="w-4 h-4" />
            <span className="w-24 text-sm font-medium">{label}</span>
            {hours[key]?.open ? (
              <>
                <input type="time" value={hours[key].from || '09:00'} onChange={(e) => update(key, 'from', e.target.value)}
                  className="border rounded px-2 py-1 text-sm" />
                <span className="text-gray-400">—</span>
                <input type="time" value={hours[key].to || '21:00'} onChange={(e) => update(key, 'to', e.target.value)}
                  className="border rounded px-2 py-1 text-sm" />
              </>
            ) : (
              <span className="text-gray-400 text-sm">Cerrado</span>
            )}
          </div>
        ))}
      </div>
      <button onClick={save} className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
        {saved ? '✅ Guardado' : 'Guardar horarios'}
      </button>
    </div>
  );
}
