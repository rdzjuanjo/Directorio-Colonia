// Orders.jsx — Gestión completa de pedidos: tabla con filtros por estado, detalle de pedido y acciones de admin
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUSES = ['pending_payment','payment_claimed','confirmed','preparing','modified_pending','ready','rider_assigned','in_delivery','delivered','cancelled','disputed'];
const STATUS_ES = { pending_payment:'Esp. pago', payment_claimed:'Pago enviado', confirmed:'Confirmado', preparing:'Preparando', modified_pending:'Modificado', ready:'Listo', rider_assigned:'Repartidor asignado', in_delivery:'En camino', delivered:'Entregado', cancelled:'Cancelado', disputed:'Disputa' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    api.ordersAll(filter).then(setOrders);
    api.riders().then(setRiders);
  }, [filter]);

  async function changeStatus(id, status) {
    await api.setOrderStatus(id, status);
    api.ordersAll(filter).then(setOrders);
    setSelected(null);
  }

  async function assign(riderId) {
    await api.assignRider(riderId, selected.id);
    api.ordersAll(filter).then(setOrders);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <select className="border rounded px-3 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Todos</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_ES[s]}</option>)}
      </select>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead className="bg-gray-100">
            <tr>{['#','Cliente','Negocio','Total','Estado','Fecha',''].map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono">#{o.id}</td>
                <td className="px-3 py-2">{o.customer_id}</td>
                <td className="px-3 py-2">{o.business_id}</td>
                <td className="px-3 py-2">${parseFloat(o.total).toFixed(2)}</td>
                <td className="px-3 py-2 text-xs"><span className="bg-gray-100 px-2 py-0.5 rounded">{STATUS_ES[o.status] || o.status}</span></td>
                <td className="px-3 py-2 text-gray-500 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-3 py-2"><button className="text-blue-600 hover:underline text-xs" onClick={() => setSelected(o)}>Gestionar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Pedido #{selected.id}</h2>
            <p className="text-sm text-gray-600">Estado: <b>{STATUS_ES[selected.status]}</b></p>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Cambiar estado:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(selected.id, s)}
                    className="text-xs bg-gray-100 hover:bg-blue-100 px-2 py-1 rounded">{STATUS_ES[s]}</button>
                ))}
              </div>
              {selected.status === 'ready' && (
                <>
                  <p className="text-sm font-semibold mt-2">Asignar repartidor:</p>
                  <div className="flex flex-col gap-1">
                    {riders.filter((r) => r.status === 'waiting').map((r) => (
                      <button key={r.id} onClick={() => assign(r.id)}
                        className="text-xs bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded text-left">🛵 {r.name}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 text-sm hover:underline">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
