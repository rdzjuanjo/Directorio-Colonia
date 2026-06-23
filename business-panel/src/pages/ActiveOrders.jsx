// ActiveOrders.jsx — Pedidos activos: tarjetas con borde de color según estado, modal de detalle y acciones de confirmar pago y marcar listo
import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = {
  pending_payment: 'Esperando pago',
  payment_claimed: 'Pago enviado',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  modified_pending: 'Modificado — esperando cliente',
  ready: 'Listo para recoger',
};

const STATUS_ACCENT = {
  pending_payment:  '#F59E0B',
  payment_claimed:  '#3B82F6',
  confirmed:        '#10B981',
  preparing:        '#8B5CF6',
  modified_pending: '#EF4444',
  ready:            '#10B981',
};

const STATUS_BADGE = {
  pending_payment:  { bg: '#FEF3C7', text: '#92400E' },
  payment_claimed:  { bg: '#DBEAFE', text: '#1E40AF' },
  confirmed:        { bg: '#D1FAE5', text: '#065F46' },
  preparing:        { bg: '#F3E8FF', text: '#6B21A8' },
  modified_pending: { bg: '#FFE4E6', text: '#9F1239' },
  ready:            { bg: '#D1FAE5', text: '#065F46' },
};

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

  const activeFiltered = orders.filter((o) => !['delivered', 'cancelled', 'disputed'].includes(o.status));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#78716C' }}>Operaciones</p>
        <h1 className="text-2xl font-semibold" style={{ color: '#1C1917' }}>Pedidos activos</h1>
        <div className="mt-2 h-px" style={{ background: '#E3DDD4' }} />
      </div>

      {activeFiltered.length === 0 ? (
        <div className="py-12 text-center rounded-xl" style={{ background: '#FDFBF8', border: '1px solid #E3DDD4' }}>
          <p className="text-sm" style={{ color: '#78716C' }}>Sin pedidos activos en este momento.</p>
          <p className="text-xs mt-1" style={{ color: '#A8A29E' }}>Esta pantalla se actualiza cada 15 segundos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeFiltered.map((o) => {
            const accent = STATUS_ACCENT[o.status] || '#D97706';
            const badge = STATUS_BADGE[o.status] || { bg: '#F3F4F6', text: '#374151' };
            return (
              <div key={o.id} className="rounded-xl overflow-hidden flex"
                style={{ background: '#FDFBF8', border: '1px solid #E3DDD4' }}>
                {/* Left status bar — the signature element */}
                <div className="w-1 flex-shrink-0" style={{ background: accent }} />
                <div className="flex-1 px-4 py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: '#1C1917' }}>Pedido #{o.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: badge.bg, color: badge.text }}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#78716C' }}>
                      {new Date(o.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      <span className="font-medium" style={{ color: '#1C1917' }}>${parseFloat(o.total).toFixed(2)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => openOrder(o)}
                    className="text-sm font-semibold px-4 py-1.5 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: '#2B1A10', color: '#fff' }}
                  >
                    Ver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order detail modal */}
      {selected && !editItems && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#FDFBF8' }}
            onClick={(e) => e.stopPropagation()}>
            {/* Modal header accent */}
            <div className="h-1" style={{ background: STATUS_ACCENT[selected.status] || '#D97706' }} />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg" style={{ color: '#1C1917' }}>Pedido #{selected.id}</h2>
                  <p className="text-sm mt-0.5" style={{ color: '#78716C' }}>
                    {STATUS_LABEL[selected.status] || selected.status}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-lg leading-none p-1"
                  style={{ color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Items */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E3DDD4' }}>
                {(selected.items || []).map((i, idx) => (
                  <div key={i.id} className="flex justify-between text-sm px-4 py-2.5"
                    style={{ borderTop: idx > 0 ? '1px solid #F0ECE6' : 'none' }}>
                    <span style={{ color: '#1C1917' }}>{i.item_name} <span style={{ color: '#78716C' }}>×{i.quantity}</span></span>
                    <span className="font-medium" style={{ color: '#1C1917' }}>${(i.unit_price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm px-4 py-2.5 font-semibold"
                  style={{ borderTop: '1px solid #E3DDD4', background: '#F5F2EC' }}>
                  <span>Total</span>
                  <span>${parseFloat(selected.total).toFixed(2)}</span>
                </div>
              </div>

              {selected.address_text && (
                <p className="text-sm" style={{ color: '#78716C' }}>📍 {selected.address_text}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {selected.status === 'payment_claimed' && (
                  <>
                    <button onClick={confirmPayment}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ background: '#059669', color: '#fff' }}>
                      Confirmar pago
                    </button>
                    <button onClick={() => setEditItems(JSON.parse(JSON.stringify(selected.items)))}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ background: '#F5F2EC', color: '#1C1917', border: '1px solid #E3DDD4' }}>
                      Modificar pedido
                    </button>
                  </>
                )}
                {selected.status === 'preparing' && (
                  <>
                    <button onClick={markReady}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ background: '#2563EB', color: '#fff' }}>
                      Marcar como listo
                    </button>
                    <button onClick={() => setEditItems(JSON.parse(JSON.stringify(selected.items)))}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ background: '#F5F2EC', color: '#1C1917', border: '1px solid #E3DDD4' }}>
                      Modificar pedido
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit items modal */}
      {editItems && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#FDFBF8' }}>
            <div className="h-1" style={{ background: '#EA580C' }} />
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-lg" style={{ color: '#1C1917' }}>Modificar pedido #{selected.id}</h2>
              <div className="space-y-2">
                {editItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1" style={{ color: '#1C1917' }}>{item.item_name}</span>
                    <input type="number" min="0" value={item.quantity}
                      onChange={(e) => {
                        const next = [...editItems];
                        next[idx] = { ...next[idx], quantity: parseInt(e.target.value) };
                        setEditItems(next);
                      }}
                      className="w-16 text-center rounded-lg text-sm"
                      style={{ border: '1px solid #E3DDD4', background: '#F5F2EC', padding: '4px 8px' }}
                    />
                    <span className="w-16 text-right" style={{ color: '#78716C' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                      className="text-sm" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveModification}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: '#EA580C', color: '#fff' }}>
                  Enviar modificación
                </button>
                <button onClick={() => setEditItems(null)}
                  className="px-4 py-2 rounded-lg text-sm" style={{ color: '#78716C', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
