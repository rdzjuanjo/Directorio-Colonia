// Analytics.jsx — Analíticas del negocio: ingresos, pedidos por período y productos más vendidos (recharts)
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
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

export default function Analytics() {
  const [range, setRange] = useState(defaultRange());
  const [pending, setPending] = useState(defaultRange());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchData(from, to) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analytics(from, to);
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

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 Analíticas</h1>

      {/* Date range picker */}
      <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
        <span className="text-sm text-gray-600 font-medium">Rango:</span>
        <input
          type="date" value={pending.from} max={pending.to}
          onChange={(e) => setPending((r) => ({ ...r, from: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date" value={pending.to} min={pending.from} max={toISO(new Date())}
          onChange={(e) => setPending((r) => ({ ...r, to: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={apply} disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50">
          {loading ? 'Cargando…' : 'Aplicar'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Pedidos entregados" value={data.totals.orders} accent="orange" />
            <KpiCard label="Ingresos totales" value={fmt(data.totals.revenue)} accent="orange" />
            <KpiCard label="Ticket promedio" value={fmt(data.totals.avg_ticket)} accent="orange" />
          </div>

          {/* Bar chart — pedidos por día */}
          <ChartCard title="Pedidos por día">
            {data.ordersByDay.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.ordersByDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, 'Pedidos']} />
                  <Bar dataKey="orders" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Area chart — ingresos por día */}
          <ChartCard title="Ingresos por día ($)">
            {data.ordersByDay.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.ordersByDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Ingresos']} />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Top 3 productos */}
          <ChartCard title="Top 3 productos más vendidos">
            {data.topProducts.length === 0 ? <Empty /> : (
              <div className="space-y-3 py-2">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4">
                    <span className="text-2xl w-8">{MEDALS[i]}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-sm text-gray-500">{p.qty} unidades vendidas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{fmt(p.revenue)}</div>
                      <div className="text-xs text-gray-400">ingresos</div>
                    </div>
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

function Empty() {
  return <p className="text-center text-gray-400 py-8 text-sm">Sin pedidos entregados en este período.</p>;
}
