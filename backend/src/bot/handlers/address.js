const customers = require('../../db/models/customers');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');
const { placeOrder } = require('../../orders/state-machine');

async function handle({ chatId, text, callbackData, location, conv, customer }) {
  const ctx = conv.context_json || {};
  const cart = conv.cart_json || [];

  if (callbackData === 'confirm_order') {
    if (customer.default_lat && customer.default_lng) {
      await conversations.set(chatId, 'confirm_address', cart, ctx);
      await sender.sendButtons(chatId,
        `📍 ¿Entregamos en <b>${customer.default_address_label || 'tu dirección guardada'}</b>?`,
        [
          { label: '✅ Sí, entregar ahí', data: 'use_saved_address' },
          { label: '📍 Usar otra dirección', data: 'new_address' },
        ]);
      return;
    }
    await conversations.set(chatId, 'confirm_address', cart, { ...ctx, addressStep: 'request' });
    await sender.requestLocation(chatId, '📍 Comparte tu ubicación de entrega:');
    return;
  }

  if (callbackData === 'use_saved_address') {
    await placeOrder(chatId, cart, ctx.businessId, {
      address_text: customer.default_address_label,
      address_lat: customer.default_lat,
      address_lng: customer.default_lng,
    });
    // placeOrder ya transiciona a awaiting_payment con orderId en el contexto
    return;
  }

  if (callbackData === 'new_address') {
    await conversations.set(chatId, 'confirm_address', cart, { ...ctx, addressStep: 'request' });
    await sender.requestLocation(chatId, '📍 Comparte tu nueva ubicación:');
    return;
  }

  if (location && ctx.addressStep === 'request') {
    await conversations.set(chatId, 'confirm_address', cart, {
      ...ctx, addressStep: 'save_prompt', newLat: location.latitude, newLng: location.longitude,
    });
    await sender.removeKeyboard(chatId, '¿Quieres guardar esta como tu dirección habitual?');
    await sender.sendButtons(chatId, ' ',
      [
        { label: '💾 Sí, guardar como default', data: 'save_address_yes' },
        { label: '🔄 No, solo esta vez', data: 'save_address_no' },
      ]);
    return;
  }

  if (callbackData === 'save_address_yes' && ctx.addressStep === 'save_prompt') {
    await customers.update(chatId, {
      default_lat: ctx.newLat, default_lng: ctx.newLng, default_address_label: 'Mi dirección',
    });
    await finishWithLocation(chatId, cart, ctx);
    return;
  }

  if (callbackData === 'save_address_no' && ctx.addressStep === 'save_prompt') {
    await finishWithLocation(chatId, cart, ctx);
    return;
  }
}

async function finishWithLocation(chatId, cart, ctx) {
  await placeOrder(chatId, cart, ctx.businessId, {
    address_text: `Lat: ${ctx.newLat}, Lng: ${ctx.newLng}`,
    address_lat: ctx.newLat,
    address_lng: ctx.newLng,
  });
  // placeOrder ya transiciona a awaiting_payment con orderId en el contexto
}

module.exports = { handle };
