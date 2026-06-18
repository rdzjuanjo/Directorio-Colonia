import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function Stat({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded-xl p-6 flex flex-col gap-2`}>
      <span className="text-4xl font-bold">{value ?? '—'}</span>
      <span className="text-sm opacity-80">{label}</span>
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Pedidos hoy" value={stats?.orders_today} color="bg-blue-600" />
        <Stat label="Pedidos activos" value={stats?.active_orders} color="bg-orange-500" />
        <Stat label="Repartidores disponibles" value={stats?.active_riders} color="bg-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-3">Pedidos activos</h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-500">No hay pedidos activos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow text-sm">
              <thead className="bg-gray-100">
                <tr>{['#', 'Cliente', 'Negocio', 'Total', 'Estado', 'Hora'].map((h) => (
                  <th key={h} className="text-left px-4 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {activeOrders.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">#{o.id}</td>
                    <td className="px-4 py-2">{o.customer_name || o.customer_id}</td>
                    <td className="px-4 py-2">{o.business_name || o.business_id}</td>
                    <td className="px-4 py-2">${parseFloat(o.total).toFixed(2)}</td>
                    <td className="px-4 py-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td className="px-4 py-2 text-gray-500">{new Date(o.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
