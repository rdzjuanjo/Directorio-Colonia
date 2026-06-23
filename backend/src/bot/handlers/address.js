const customers = require('../../db/models/customers');
const businesses = require('../../db/models/businesses');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');
const { placeOrder } = require('../../orders/state-machine');
const { pointInPolygon, getDeliveryZone } = require('../../utils/geoUtils');

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
    if (await isOutsideZone(customer.default_lat, customer.default_lng)) {
      return handleOutsideZone(chatId, cart, ctx);
    }
    await placeOrder(chatId, cart, ctx.businessId, {
      address_text: customer.default_address_label,
      address_lat: customer.default_lat,
      address_lng: customer.default_lng,
    });
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

async function isOutsideZone(lat, lng) {
  const zone = await getDeliveryZone();
  if (!zone) return false; // sin zona configurada → todo permitido
  return !pointInPolygon(lat, lng, zone);
}

async function finishWithLocation(chatId, cart, ctx) {
  if (await isOutsideZone(ctx.newLat, ctx.newLng)) {
    return handleOutsideZone(chatId, cart, ctx);
  }
  await placeOrder(chatId, cart, ctx.businessId, {
    address_text: 'Mi dirección',
    address_lat: ctx.newLat,
    address_lng: ctx.newLng,
  });
}

async function handleOutsideZone(chatId, cart, ctx) {
  const biz = await businesses.findById(ctx.businessId);
  if (biz?.accepts_pickup) {
    await sender.sendText(chatId,
      '⚠️ Tu dirección está fuera de nuestra zona de entrega.\n\nSin embargo, podés recoger tu pedido directamente en el negocio:');
    const pickupHandler = require('./pickup');
    const newCtx = { ...ctx, pickupType: 'pickup' };
    await conversations.set(chatId, 'confirm_pickup', cart, newCtx);
    await pickupHandler.handle({
      chatId,
      callbackData: 'start_pickup',
      conv: { context_json: newCtx, cart_json: cart },
    });
  } else {
    await conversations.set(chatId, 'idle', [], {});
    await sender.sendText(chatId,
      '⚠️ Lo sentimos, tu dirección está fuera de nuestra zona de entrega y este negocio no ofrece retiro en tienda.\n\nPodés buscar otro negocio escribiendo lo que buscás.');
  }
}

module.exports = { handle };
