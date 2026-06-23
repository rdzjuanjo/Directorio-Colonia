// menu.js — Navegación del menú de un negocio: muestra categorías e ítems, permite agregar productos al carrito
const menu = require('../../db/models/menu');
const businesses = require('../../db/models/businesses');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');

async function handle({ chatId, text, callbackData, conv, customer }) {
  const ctx = conv.context_json || {};
  const cart = conv.cart_json || [];
  const businessId = ctx.businessId;

  if (!businessId) {
    await conversations.set(chatId, 'idle', [], {});
    return;
  }

  if (callbackData?.startsWith('item:')) {
    const itemId = parseInt(callbackData.replace('item:', ''));
    const item = await menu.findItemById(itemId);
    if (!item || !item.available) {
      await sender.sendText(chatId, 'Este producto ya no está disponible.');
      return;
    }
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: parseFloat(item.price), qty: 1 });
    }
    await conversations.set(chatId, 'browsing_menu', cart, ctx);
    if (item.photo_url) {
      const photoUrl = item.photo_url.startsWith('http') ? item.photo_url : `${process.env.PUBLIC_URL || 'http://localhost:3000'}${item.photo_url}`;
      await sender.sendPhoto(chatId, photoUrl, `${item.name} — $${parseFloat(item.price).toFixed(2)}`);
    }
    await sender.sendButtons(chatId,
      `✅ <b>${item.name}</b> agregado al carrito.\n\nTotal carrito: $${cartTotal(cart).toFixed(2)}`,
      [
        { label: '🛒 Ver carrito', data: 'view_cart' },
        { label: '📋 Seguir comprando', data: 'show_menu' },
      ]);
    return;
  }

  if (callbackData === 'show_menu' || !callbackData) {
    const biz = await businesses.findById(businessId);
    const categories = await menu.getCategoriesWithItems(businessId, true);

    if (!categories.length) {
      await sender.sendText(chatId, 'Este negocio no tiene productos disponibles ahora.');
      return;
    }

    const catalogUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/catalog/${businessId}`;
    let menuText = `🏪 <b>${biz.name}</b>\n📋 Catálogo: ${catalogUrl}\n\n`;
    for (const cat of categories) {
      if (!cat.items.length) continue;
      menuText += `<b>${cat.name}</b>\n`;
      for (const item of cat.items) {
        menuText += `  • ${item.name} — $${parseFloat(item.price).toFixed(2)}\n`;
      }
      menuText += '\n';
    }
    menuText += 'Selecciona un producto para agregarlo:';

    const allItems = categories.flatMap((c) => c.items);
    const itemButtons = allItems.map((i) => ({ label: `${i.name} $${parseFloat(i.price).toFixed(2)}`, data: `item:${i.id}` }));

    if (cart.length) {
      itemButtons.push({ label: `🛒 Ver carrito (${cart.length} items)`, data: 'view_cart' });
    }

    await sender.sendList(chatId, menuText, itemButtons);
    return;
  }

  if (callbackData === 'view_cart') {
    await conversations.set(chatId, 'cart', cart, ctx);
    await showCart(chatId, cart, ctx);
    return;
  }
}

async function showCart(chatId, cart, ctx) {
  if (!cart.length) {
    await sender.sendButtons(chatId, 'Tu carrito está vacío.', [{ label: '📋 Ver menú', data: 'show_menu' }]);
    return;
  }

  const { getConfig } = require('../../utils/getConfig');
  const deliveryFee = parseFloat(await getConfig('delivery_fee', '0'));

  let text = '🛒 <b>Tu carrito:</b>\n\n';
  for (const item of cart) {
    text += `• ${item.name} x${item.qty} — $${(item.price * item.qty).toFixed(2)}\n`;
  }
  text += `\nSubtotal: $${cartTotal(cart).toFixed(2)}`;
  text += `\nEnvío: $${deliveryFee.toFixed(2)}`;
  text += `\n<b>Total: $${(cartTotal(cart) + deliveryFee).toFixed(2)}</b>`;

  await sender.sendButtons(chatId, text, [
    [{ label: '✅ Confirmar pedido', data: 'confirm_order' }, { label: '🗑️ Vaciar carrito', data: 'clear_cart' }],
    [{ label: '📋 Seguir comprando', data: 'show_menu' }],
  ]);
}

function cartTotal(cart) {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

module.exports = { handle, showCart, cartTotal };
