import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api.js';

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: toISO(from), to: toISO(to) };
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CatalogStats() {
  const [range, setRange] = useState(defaultRange());
  const [pending, setPending] = useState(defaultRange());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchData(from, to) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.catalogAnalytics(from, to);
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(range.from, range.to); }, []);

  function apply() {
    setRange(pending);
    fetchData(pending.from, pending.to);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🤖 Bot catálogo</h1>

      {/* Date range picker */}
      <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
        <span className="text-sm text-gray-600 font-medium">Rango:</span>
        <input
          type="date" value={pending.from} max={pending.to}
          onChange={(e) => setPending((r) => ({ ...r, from: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date" value={pending.to} min={pending.from} max={toISO(new Date())}
          onChange={(e) => setPending((r) => ({ ...r, to: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={apply} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50">
          {loading ? 'Cargando…' : 'Aplicar'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Búsquedas" value={data.totals.searches} />
            <KpiCard label="Usuarios únicos" value={data.totals.unique_users} />
            <KpiCard label="Negocios vistos" value={data.totals.business_views} />
            <KpiCard label="Contactos compartidos" value={data.totals.contacts_shared} />
          </div>

          {/* Bar chart — búsquedas por día */}
          <ChartCard title="Búsquedas por día">
            {data.searchesByDay.length === 0 ? <Empty text="Sin búsquedas en este período." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.searchesByDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, 'Búsquedas']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Top negocios */}
          <ChartCard title="Negocios más consultados">
            {data.topBusinesses.length === 0 ? <Empty text="Sin datos en este período." /> : (
              <div className="space-y-3 py-2">
                {data.topBusinesses.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-4">
                    <span className="text-2xl w-8">{MEDALS[i] || `${i + 1}.`}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{b.name}</div>
                      <div className="text-sm text-gray-500">{b.views} vista{b.views !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{b.contacts}</div>
                      <div className="text-xs text-gray-400">contactos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* Top búsquedas */}
          <ChartCard title="Búsquedas más frecuentes">
            {data.topQueries.length === 0 ? <Empty text="Sin búsquedas de texto en este período." /> : (
              <div className="space-y-2 py-2">
                {data.topQueries.map((q, i) => (
                  <div key={q.query} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-6 text-right">{i + 1}.</span>
                    <div className="flex-1 text-gray-700 text-sm">"{q.query}"</div>
                    <span className="text-sm font-semibold text-gray-800">{q.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-center text-gray-400 py-8 text-sm">{text}</p>;
}
