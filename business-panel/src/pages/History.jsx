import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_ES = { delivered:'Entregado', cancelled:'Cancelado', disputed:'Disputa' };

export default function History() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { api.orders('delivered,cancelled,disputed').then(setOrders); }, []);

  const total = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.total), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial de pedidos</h1>
      <div className="bg-white rounded-xl shadow p-4 inline-block">
        <p className="text-sm text-gray-500">Total entregado</p>
        <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead className="bg-gray-100">
            <tr>{['#','Total','Estado','Fecha'].map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono">#{o.id}</td>
                <td className="px-3 py-2">${parseFloat(o.total).toFixed(2)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'disputed' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                    {STATUS_ES[o.status] || o.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
