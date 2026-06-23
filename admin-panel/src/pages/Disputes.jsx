// Disputes.jsx — Gestión de disputas: listado de disputas abiertas, resolución y posible baneo del cliente involucrado
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const TYPE_ES = {
  payment_rejected_by_business: 'Pago rechazado por negocio',
  payment_claimed_not_received: 'Cliente dice pagar, negocio no confirma',
  customer_report: 'Reporte de cliente',
  business_report: 'Reporte de negocio',
};

export default function Disputes() {
  const [list, setList] = useState([]);

  useEffect(() => { api.disputes().then(setList); }, []);

  async function resolve(id) {
    await api.resolveDispute(id);
    api.disputes().then(setList);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Disputas</h1>
      {list.length === 0 ? (
        <p className="text-gray-500">No hay disputas registradas.</p>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <div key={d.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${d.resolved ? 'border-green-400 opacity-60' : 'border-red-400'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{TYPE_ES[d.type] || d.type}</p>
                  <p className="text-xs text-gray-500">Pedido #{d.order_id} · {new Date(d.created_at).toLocaleString()}</p>
                  {d.description && <p className="text-sm mt-1">{d.description}</p>}
                </div>
                {!d.resolved && (
                  <button onClick={() => resolve(d.id)} className="text-green-600 text-sm hover:underline ml-4 shrink-0">✓ Resolver</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
