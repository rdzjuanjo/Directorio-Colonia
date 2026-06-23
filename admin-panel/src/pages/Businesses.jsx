// Businesses.jsx — CRUD de negocios: formulario con mapa de ubicación, selector de ícono SVG y configuración de horarios
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import LocationPicker from '../components/LocationPicker.jsx';
import IconPicker from '../components/IconPicker.jsx';

const empty = {
  name: '', category: 'comida', description: '',
  clabe: '', bank_name: '', account_holder: '',
  whatsapp_id: '', email: '', password: '',
  lat: '', lng: '', icon_key: '',
};

export default function Businesses() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.businesses().then(setList); }, []);

  async function save() {
    setSaving(true);
    if (form.id) {
      await api.updateBusiness(form.id, form);
    } else {
      await api.createBusiness(form);
    }
    setForm(null);
    api.businesses().then(setList);
    setSaving(false);
  }

  const field = (key, label, type = 'text') => (
    <div key={key}>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="w-full border rounded px-2 py-1 text-sm"
        type={type}
        value={form[key] || ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Negocios</h1>
        <button
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm"
          onClick={() => setForm({ ...empty })}
        >
          + Agregar
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((b) => (
          <div key={b.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">
                {b.name}{' '}
                <span className={`text-xs ml-2 px-2 py-0.5 rounded ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                  {b.active ? 'Activo' : 'Inactivo'}
                </span>
              </p>
              <p className="text-xs text-gray-500">{b.category} · CLABE: {b.clabe}</p>
            </div>
            <div className="flex gap-2">
              <button className="text-blue-600 text-sm hover:underline" onClick={() => setForm(b)}>Editar</button>
              {!b.banned && (
                <button className="text-red-500 text-sm hover:underline" onClick={async () => { await api.banBusiness(b.id); api.businesses().then(setList); }}>
                  Banear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setForm(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3 overflow-y-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg">{form.id ? 'Editar' : 'Nuevo'} negocio</h2>

            {field('name', 'Nombre del negocio')}

            <div>
              <label className="text-xs text-gray-600">Categoría</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {['comida', 'abarrotes', 'carniceria', 'panaderia', 'farmacia', 'miscelanea'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {field('description', 'Descripción')}

            <div>
              <label className="text-xs text-gray-600">Ubicación en el mapa</label>
              <div className="mt-1">
                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
                />
              </div>
            </div>

            <IconPicker
              value={form.icon_key || ''}
              category={form.category}
              onChange={(key) => setForm((f) => ({ ...f, icon_key: key }))}
            />

            {field('clabe', 'CLABE (18 dígitos)')}
            {field('bank_name', 'Banco')}
            {field('account_holder', 'Titular de la cuenta')}
            {field('whatsapp_id', 'WhatsApp del negocio (ej: 521234567890@c.us)')}
            {!form.id && field('email', 'Email de acceso al panel')}
            {!form.id && field('password', 'Contraseña del panel', 'password')}

            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setForm(null)} className="text-gray-500 text-sm hover:underline">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
