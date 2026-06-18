import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = { pending_payment:'Esperando pago', payment_claimed:'Pago enviado', confirmed:'Confirmado', preparing:'Preparando', modified_pending:'Modificado — esperando cliente', ready:'Listo para recoger' };

export default function ActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editItems, setEditItems] = useState(null);

  const reload = () => api.orders('pending_payment,payment_claimed,confirmed,preparing,modified_pending,ready').then(setOrders);

  useEffect(() => { reload(); const iv = setInterval(reload, 15000); return () => clearInterval(iv); }, []);

  async function openOrder(o) {
    const full = await api.order(o.id);
    setSelected(full);
  }

  async function confirmPayment() {
    await api.confirmPayment(selected.id);
    setSelected(null); reload();
  }

  async function markReady() {
    await api.markReady(selected.id);
    setSelected(null); reload();
  }

  async function saveModification() {
    await api.updateOrderItems(selected.id, editItems);
    setEditItems(null); setSelected(null); reload();
  }

  const activeFiltered = orders.filter((o) => !['delivered','cancelled','disputed'].includes(o.status));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos activos</h1>
      {activeFiltered.length === 0 ? <p className="text-gray-500">No hay pedidos activos ahora.</p> : (
        <div className="space-y-3">
          {activeFiltered.map((o) => (
            <div key={o.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">Pedido #{o.id}</p>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString()} · ${parseFloat(o.total).toFixed(2)}</p>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{STATUS_LABEL[o.status] || o.status}</span>
              </div>
              <button onClick={() => openOrder(o)} className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm">Ver</button>
            </div>
          ))}
        </div>
      )}

      {selected && !editItems && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Pedido #{selected.id}</h2>
            <p className="text-sm text-gray-500">Estado: <b>{STATUS_LABEL[selected.status] || selected.status}</b></p>
            <div className="border rounded p-3 space-y-1">
              {(selected.items || []).map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.item_name} x{i.quantity}</span>
                  <span>${(i.unit_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between text-sm font-semibold">
                <span>Total</span><span>${parseFloat(selected.total).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm">📍 {selected.address_text}</p>
            <div className="flex flex-wrap gap-2">
              {selected.status === 'payment_claimed' && (
                <>
                  <button onClick={confirmPayment} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">✅ Confirmar pago</button>
                  <button onClick={() => setEditItems(JSON.parse(JSON.stringify(selected.items)))} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm">✏️ Modificar pedido</button>
                </>
              )}
              {selected.status === 'preparing' && (
                <>
                  <button onClick={markReady} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">📦 Marcar como listo</button>
                  <button onClick={() => setEditItems(JSON.parse(JSON.stringify(selected.items)))} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm">✏️ Modificar pedido</button>
                </>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 text-sm hover:underline">Cerrar</button>
          </div>
        </div>
      )}

      {editItems && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="font-bold text-lg">Modificar pedido #{selected.id}</h2>
            {editItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1">{item.item_name}</span>
                <input type="number" min="0" value={item.quantity} onChange={(e) => {
                  const next = [...editItems];
                  next[idx] = { ...next[idx], quantity: parseInt(e.target.value) };
                  setEditItems(next);
                }} className="w-16 border rounded px-2 py-1 text-center" />
                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-red-500 hover:underline">✕</button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={saveModification} className="bg-orange-600 text-white px-4 py-2 rounded text-sm">Enviar modificación</button>
              <button onClick={() => setEditItems(null)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
