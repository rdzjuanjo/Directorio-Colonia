const riders = require('../../db/models/riders');
const orders = require('../../db/models/orders');
const sender = require('../../sender');
const orderFsm = require('../../orders/state-machine');

const COMMANDS = {
  'INICIO TURNO': async (chatId, rider) => {
    await riders.updateStatus(chatId, 'waiting');
    await sender.sendText(chatId, '✅ Turno iniciado. Estás disponible para recibir pedidos.');
  },
  DISPONIBLE: async (chatId, rider) => {
    await riders.updateStatus(chatId, 'waiting');
    await sender.sendText(chatId, '✅ Estado actualizado: Disponible.');
  },
  'FIN TURNO': async (chatId, rider) => {
    await riders.updateStatus(chatId, 'off_duty');
    await sender.sendText(chatId, '👋 Turno finalizado. Hasta pronto!');
  },
  LLEGUE: async (chatId, rider) => {
    await riders.updateStatus(chatId, 'waiting_at_business');
    await sender.sendText(chatId, '📍 Confirmado, estás en el negocio. El pedido te estará listo pronto.');
  },
};

async function handle({ chatId, text, callbackData, rider }) {
  const upperText = text?.toUpperCase().trim();

  if (COMMANDS[upperText]) {
    await COMMANDS[upperText](chatId, rider);
    return;
  }

  const recogerMatch = upperText?.match(/^RECOGER\s+(\d+)$/);
  if (recogerMatch) {
    const orderId = parseInt(recogerMatch[1]);
    await orderFsm.transition(orderId, 'in_delivery');
    await riders.updateStatus(chatId, 'delivering');
    await sender.sendText(chatId, `✅ Pedido #${orderId} recogido. ¡En camino al domicilio!`);
    return;
  }

  const entregarMatch = upperText?.match(/^ENTREGAR\s+(\d+)$/);
  if (entregarMatch) {
    const orderId = parseInt(entregarMatch[1]);
    await orderFsm.transition(orderId, 'delivered');
    await riders.updateStatus(chatId, 'waiting');
    await sender.sendText(chatId, `✅ Pedido #${orderId} entregado. ¡Buen trabajo! Estado: Disponible.`);
    return;
  }

  if (callbackData?.startsWith('accept_order:')) {
    const orderId = parseInt(callbackData.replace('accept_order:', ''));
    await orderFsm.assignRider(orderId, rider.id);
    await sender.sendText(chatId, `✅ Pedido #${orderId} aceptado.`);
    return;
  }

  if (callbackData?.startsWith('reject_order:')) {
    const orderId = parseInt(callbackData.replace('reject_order:', ''));
    await orderFsm.tryNextRider(orderId);
    await sender.sendText(chatId, 'Pedido rechazado. Se buscará otro repartidor.');
    return;
  }

  await sender.sendText(chatId,
    `Comandos disponibles:\n` +
    `• <b>INICIO TURNO</b> — Comenzar turno\n` +
    `• <b>FIN TURNO</b> — Terminar turno\n` +
    `• <b>LLEGUE</b> — Llegué al negocio\n` +
    `• <b>RECOGER #</b> — Recoger pedido\n` +
    `• <b>ENTREGAR #</b> — Confirmar entrega`);
}

module.exports = { handle };
