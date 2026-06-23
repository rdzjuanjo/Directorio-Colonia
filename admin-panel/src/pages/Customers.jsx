import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api.js';

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toISO(from), to: toISO(to) };
}

function formatDate(iso) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState(defaultRange());
  const [pending, setPending] = useState(defaultRange());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchAll(from, to) {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([api.customers(), api.customerStats(from, to)]);
      setCustomers(list);
      setStats(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(range.from, range.to); }, []);

  function applyRange() {
    setRange(pending);
    fetchAll(pending.from, pending.to);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">👥 Usuarios del bot</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500 mb-1">Total registrados</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats ? stats.total : '—'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500 mb-1">En el período</div>
          <div className="text-3xl font-bold text-green-600">
            {stats ? stats.byDay.reduce((a, r) => a + r.count, 0) : '—'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500 mb-1">Activos (no baneados)</div>
          <div className="text-3xl font-bold text-gray-700">
            {customers.length ? customers.filter((c) => !c.banned).length : '—'}
          </div>
        </div>
      </div>

      {/* Selector de período */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input type="date" value={pending.from} onChange={(e) => setPending((p) => ({ ...p, from: e.target.value }))}
            className="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input type="date" value={pending.to} onChange={(e) => setPending((p) => ({ ...p, to: e.target.value }))}
            className="border rounded px-2 py-1 text-sm" />
        </div>
        <button onClick={applyRange}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
          Aplicar
        </button>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Registros por día</h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Cargando...</div>
        ) : stats?.byDay?.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Registros']} labelFormatter={(l) => `Fecha: ${l}`} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorReg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            Sin registros en este período
          </div>
        )}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold text-gray-700">
          Lista de usuarios ({customers.length})
        </div>
        {loading ? (
          <div className="p-6 text-gray-400 text-center">Cargando...</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-gray-400 text-center">No hay usuarios registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Nombre</th>
                <th className="text-left px-5 py-3">Teléfono</th>
                <th className="text-left px-5 py-3">Registrado</th>
                <th className="text-left px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone || c.whatsapp_id}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    {c.banned
                      ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Baneado</span>
                      : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Activo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
