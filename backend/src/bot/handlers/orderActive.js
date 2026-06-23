const orders = require('../../db/models/orders');
const sender = require('../../sender');

const STATUS_LABELS = {
  pending_payment: '⏳ Esperando pago',
  payment_claimed: '💳 Pago enviado — esperando confirmación del negocio',
  confirmed: '✅ Pago confirmado — el negocio está preparando tu pedido',
  preparing: '👨‍🍳 En preparación',
  modified_pending: '⚠️ El negocio modificó tu pedido — revisa y confirma',
  ready: '📦 Tu pedido está listo — buscando repartidor',
  rider_assigned: '🛵 Repartidor asignado — va en camino al negocio',
  in_delivery: '🛵 Tu pedido va en camino a tu domicilio',
  delivered: '✅ Pedido entregado',
};

async function handle({ chatId, text, callbackData, conv }) {
  const orderId = conv.context_json?.orderId;
  if (!orderId) return;

  const order = await orders.findWithItems(orderId);
  if (!order) return;

  if (callbackData === 'accept_modification') {
    const orderFsm = require('../../orders/state-machine');
    await orderFsm.transition(orderId, 'confirmed');
    await sender.sendText(chatId, '✅ Modificación aceptada. Tu pedido sigue en preparación.');
    return;
  }

  if (callbackData === 'reject_modification') {
    const orderFsm = require('../../orders/state-machine');
    await orderFsm.transition(orderId, 'cancelled', { cancelledBy: 'customer' });
    await sender.sendText(chatId, '❌ Pedido cancelado.');
    return;
  }

  if (callbackData === 'switch_to_pickup') {
    // Bypasa state-machine intencionalmente: el cambio a pickup mid-flight requiere
    // actualizar delivery_type + recalcular total en una sola transacción atómica
    // sin disparar las notificaciones normales del flujo de delivery.
    const db = require('../../db');
    await db('orders').where({ id: orderId }).update({
      delivery_type: 'pickup',
      delivery_fee: 0,
      total: db.raw('subtotal'),
      status: 'confirmed',
      updated_at: db.fn.now(),
    });
    const loc = order.business_address_text ? `\n📍 ${order.business_address_text}` : '';
    await sender.sendText(chatId,
      `✅ Pedido #${orderId} cambiado a retiro en tienda.\n\n🏪 ${order.business_name}${loc}\n\nTe avisamos cuando esté listo para recoger.`);
    await sender.sendText(order.business_whatsapp_id,
      `🏪 Pedido #${orderId} ahora es retiro en tienda (sin repartidor). Márcalo como LISTO cuando esté listo para que el cliente venga.`);
    return;
  }

  if (callbackData === 'keep_waiting') {
    await sender.sendText(chatId, '⏳ De acuerdo, seguimos buscando repartidor para tu pedido.');
    return;
  }

  if (callbackData === 'order_status') {
    const label = STATUS_LABELS[order.status] || order.status;
    await sender.sendText(chatId, `📦 Estado de tu pedido #${orderId}:\n${label}`);
    return;
  }

  await sender.sendButtons(chatId,
    `📦 Pedido #${orderId}\nEstado: <b>${STATUS_LABELS[order.status] || order.status}</b>`,
    [{ label: '🔄 Ver estado', data: 'order_status' }]);
}

module.exports = { handle };
