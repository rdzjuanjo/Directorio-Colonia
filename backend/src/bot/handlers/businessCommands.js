// businessCommands.js — Comandos WhatsApp del dueño del negocio: CONFIRMAR, RECHAZAR, LISTO + menú de ayuda
const orders = require('../../db/models/orders');
const sender = require('../../sender');
const orderFsm = require('../../orders/state-machine');
const disputes = require('../../db/models/disputes');

async function handle({ chatId, text, callbackData, businessUser }) {
  const upperText = text?.toUpperCase().trim();

  const confirmarMatch = upperText?.match(/^CONFIRMAR\s+(\d+)$/);
  if (confirmarMatch) {
    const orderId = parseInt(confirmarMatch[1]);
    await orderFsm.transition(orderId, 'confirmed');
    await sender.sendText(chatId, `✅ Pedido #${orderId} confirmado. El cliente ha sido notificado.`);
    return;
  }

  const rechazarMatch = upperText?.match(/^RECHAZAR\s+(\d+)$/);
  if (rechazarMatch) {
    const orderId = parseInt(rechazarMatch[1]);
    await disputes.log({ order_id: orderId, type: 'payment_rejected_by_business', description: 'Negocio rechazó el pago', reported_by: 'business' });
    await orderFsm.transition(orderId, 'disputed');
    await sender.sendText(chatId, `⚠️ Pedido #${orderId} marcado como disputado. Se notificó al administrador.`);
    return;
  }

  const listoMatch = upperText?.match(/^LISTO\s+(\d+)$/);
  if (listoMatch) {
    const orderId = parseInt(listoMatch[1]);
    const order = await orders.findById(orderId);
    await orderFsm.transition(orderId, 'ready');
    const msg = order?.delivery_type === 'pickup'
      ? `✅ Pedido #${orderId} listo para retiro en tienda. Se notificó al cliente.`
      : `✅ Pedido #${orderId} marcado como listo. Buscando repartidor...`;
    await sender.sendText(chatId, msg);
    return;
  }

  if (callbackData?.startsWith('confirm_payment:')) {
    const orderId = parseInt(callbackData.replace('confirm_payment:', ''));
    await orderFsm.transition(orderId, 'confirmed');
    await sender.sendText(chatId, `✅ Pedido #${orderId} confirmado.`);
    return;
  }

  await sender.sendText(chatId,
    `Comandos del negocio:\n` +
    `• <b>CONFIRMAR #</b> — Confirmar pago recibido\n` +
    `• <b>RECHAZAR #</b> — Rechazar pago (disputa)\n` +
    `• <b>LISTO #</b> — Pedido listo para recoger`);
}

module.exports = { handle };
