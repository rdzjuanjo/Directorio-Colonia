const conversations = require('../../db/models/conversations');
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
    const addressHandler = require('./address');
    await addressHandler.handle({ chatId, callbackData, conv, customer });
    return;
  }

  await showCart(chatId, cart, ctx);
}

module.exports = { handle };
