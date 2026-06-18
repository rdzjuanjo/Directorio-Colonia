const conversations = require('../../db/models/conversations');
const businesses = require('../../db/models/businesses');
const sender = require('../../sender');
const { showCart } = require('./menu');

async function handle({ chatId, text, callbackData, conv, customer }) {
  const ctx = conv.context_json || {};
  const cart = conv.cart_json || [];

  if (callbackData === 'clear_cart') {
    await conversations.set(chatId, 'browsing_menu', [], ctx);
    await sender.sendButtons(chatId, '🗑️ Carrito vaciado.', [{ label: '📋 Ver menú', data: 'show_menu' }]);
    return;
  }

  if (callbackData === 'view_cart') {
    await showCart(chatId, cart, ctx);
    return;
  }

  if (callbackData === 'confirm_order') {
    const biz = await businesses.findById(ctx.businessId);
    if (biz?.accepts_pickup) {
      await conversations.set(chatId, 'confirm_delivery_type', cart, ctx);
      await sender.sendButtons(chatId,
        '¿Cómo querés recibir tu pedido?',
        [
          { label: '🚚 Envío a domicilio', data: 'pickup_type:delivery' },
          { label: '🏪 Recoger en tienda', data: 'pickup_type:pickup' },
        ]);
    } else {
      const addressHandler = require('./address');
      await addressHandler.handle({ chatId, callbackData: 'confirm_order', conv, customer });
    }
    return;
  }

  // Estado confirm_delivery_type
  if (callbackData === 'pickup_type:delivery') {
    const addressHandler = require('./address');
    await addressHandler.handle({ chatId, callbackData: 'confirm_order', conv, customer });
    return;
  }

  if (callbackData === 'pickup_type:pickup') {
    const pickupHandler = require('./pickup');
    await conversations.set(chatId, 'confirm_pickup', cart, { ...ctx, pickupType: 'pickup' });
    await pickupHandler.handle({ chatId, callbackData: 'start_pickup', conv: { ...conv, context_json: { ...ctx, pickupType: 'pickup' } }, customer });
    return;
  }

  await showCart(chatId, cart, ctx);
}

module.exports = { handle };
