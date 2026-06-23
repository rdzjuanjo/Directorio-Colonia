// Dashboard.jsx — Vista general en tiempo real: KPIs de pedidos/repartidores y tabla de pedidos activos con badges de estado
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = {
  pending_payment: 'Esperando pago',
  payment_claimed: 'Pago reportado',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  modified_pending: 'Modificado — pendiente',
  ready: 'Listo',
  rider_assigned: 'Repartidor asignado',
  in_delivery: 'En camino',
};

const STATUS_COLOR = {
  pending_payment: { bg: '#FEF3C7', text: '#92400E' },
  payment_claimed: { bg: '#DBEAFE', text: '#1E40AF' },
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  preparing: { bg: '#F3E8FF', text: '#6B21A8' },
  modified_pending: { bg: '#FFE4E6', text: '#9F1239' },
  ready: { bg: '#D1FAE5', text: '#065F46' },
  rider_assigned: { bg: '#DBEAFE', text: '#1E40AF' },
  in_delivery: { bg: '#FEF3C7', text: '#92400E' },
};

function Stat({ label, value, accent, section }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FDFBF8', border: '1px solid #E3DDD4' }}>
      <div className="h-1" style={{ background: accent }} />
      <div className="px-5 py-4">
        <span className="text-3xl font-bold" style={{ color: '#1C1917' }}>{value ?? '—'}</span>
        <p className="text-xs font-medium mt-1.5 uppercase tracking-wide" style={{ color: '#78716C' }}>{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    api.stats().then(setStats);
    api.orders().then(setActiveOrders);
    const iv = setInterval(() => {
      api.stats().then(setStats);
      api.orders().then(setActiveOrders);
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="space-y-7 max-w-5xl">
      {/* Page header */}
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#78716C' }}>Vista general</p>
        <h1 className="text-2xl font-semibold" style={{ color: '#1C1917' }}>Dashboard</h1>
        <div className="mt-2 h-px" style={{ background: '#E3DDD4' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Pedidos hoy" value={stats?.orders_today} accent="#1A2B1A" />
        <Stat label="Pedidos activos" value={stats?.active_orders} accent="#D97706" />
        <Stat label="Repartidores disponibles" value={stats?.active_riders} accent="#16A34A" />
      </div>

      {/* Active orders */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: '#1C1917' }}>Pedidos activos</h2>
        {activeOrders.length === 0 ? (
          <p className="text-sm py-6 text-center rounded-xl" style={{ color: '#78716C', background: '#FDFBF8', border: '1px solid #E3DDD4' }}>
            No hay pedidos activos en este momento.
          </p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E3DDD4' }}>
            <table className="w-full text-sm" style={{ background: '#FDFBF8' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E3DDD4', background: '#F5F2EC' }}>
                  {['#', 'Cliente', 'Negocio', 'Total', 'Estado', 'Hora'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#78716C' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((o, i) => {
                  const sc = STATUS_COLOR[o.status] || { bg: '#F3F4F6', text: '#374151' };
                  return (
                    <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid #F0ECE6' : 'none' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#78716C' }}>#{o.id}</td>
                      <td className="px-4 py-3 font-medium">{o.customer_name || o.customer_id}</td>
                      <td className="px-4 py-3" style={{ color: '#78716C' }}>{o.business_name || o.business_id}</td>
                      <td className="px-4 py-3 font-medium">${parseFloat(o.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#78716C' }}>{new Date(o.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
