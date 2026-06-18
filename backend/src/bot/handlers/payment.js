const orders = require('../../db/models/orders');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');
const orderFsm = require('../../orders/state-machine');

async function handle({ chatId, text, callbackData, conv, customer }) {
  const ctx = conv.context_json || {};
  const orderId = ctx.orderId;

  if (!orderId) {
    await conversations.set(chatId, 'idle', [], {});
    return;
  }

  const order = await orders.findWithItems(orderId);

  if (callbackData === 'paid' || text?.toLowerCase().includes('ya pagué') || text?.toLowerCase().includes('ya pague')) {
    await orderFsm.transition(orderId, 'payment_claimed');
    await conversations.set(chatId, 'order_active', [], { orderId });
    await sender.sendText(chatId,
      '✅ Gracias! Le avisamos al negocio que realizaste la transferencia.\n\nTe notificaremos cuando confirmen el pago.');
    return;
  }

  // Mostrar instrucciones de pago
  const text2 = `💳 <b>Instrucciones de pago:</b>\n\n` +
    `Transfiere exactamente <b>$${parseFloat(order.total).toFixed(2)}</b> a:\n\n` +
    `🏦 Banco: <b>${order.bank_name}</b>\n` +
    `💳 CLABE: <code>${order.clabe}</code>\n` +
    `👤 Titular: <b>${order.account_holder}</b>\n` +
    `📋 Referencia: <b>#${orderId}</b>\n\n` +
    `Una vez transferido, toca el botón o escribe <i>"ya pagué"</i>.`;

  await sender.sendButtons(chatId, text2, [{ label: '✅ Ya pagué', data: 'paid' }]);
}

module.exports = { handle };
