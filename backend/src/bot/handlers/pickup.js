// pickup.js — Flujo de retiro en tienda: muestra la dirección del negocio, elige método de pago y crea el pedido con delivery_type=pickup
const conversations = require('../../db/models/conversations');
const businesses = require('../../db/models/businesses');
const sender = require('../../sender');
const { placeOrder } = require('../../orders/state-machine');

async function handle({ chatId, callbackData, conv, customer }) {
  const ctx = conv.context_json || {};
  const cart = conv.cart_json || [];

  // Llegada inicial desde cart.js
  if (callbackData === 'start_pickup') {
    const biz = await businesses.findById(ctx.businessId);
    const addressLine = biz?.address_text ? `\n📍 ${biz.address_text}` : '';
    await sender.sendButtons(chatId,
      `🏪 <b>${biz?.name || 'El negocio'}${addressLine}</b>\n\n¿Cómo vas a pagar?`,
      [
        { label: '💳 Transferencia bancaria', data: 'pickup_payment:transfer' },
        { label: '💵 Pagar en tienda', data: 'pickup_payment:at_store' },
      ]);
    return;
  }

  if (callbackData === 'pickup_payment:transfer') {
    // Pickup + transferencia: mismo flujo de pago que delivery pero sin costo de envío
    await placeOrder(chatId, cart, ctx.businessId, { address_text: 'Retiro en tienda' }, {
      deliveryType: 'pickup',
      paymentMethod: 'transfer',
    });
    return;
  }

  if (callbackData === 'pickup_payment:at_store') {
    // Pickup + pago en tienda: confirma directo, sin paso de pago
    await placeOrder(chatId, cart, ctx.businessId, { address_text: 'Retiro en tienda' }, {
      deliveryType: 'pickup',
      paymentMethod: 'at_store',
    });
    return;
  }
}

module.exports = { handle };
