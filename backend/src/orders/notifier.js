// notifier.js — Envía mensajes de WhatsApp a cliente, negocio y repartidor en cada transición de estado del pedido
const ordersDb = require('../db/models/orders');
const ridersDb = require('../db/models/riders');
const sender = require('../sender');

async function notify(orderId, status, orderData) {
  const order = orderData || (await ordersDb.findWithItems(orderId));

  switch (status) {
    case 'payment_claimed':
      await sender.sendButtons(
        order.business_whatsapp_id,
        `💳 <b>Nuevo pago reportado</b>\n\nPedido #${orderId}\nCliente: ${order.customer_name}\nTotal: $${parseFloat(order.total).toFixed(2)}\n\nVerifica en tu banco y confirma.`,
        [[{ label: `✅ CONFIRMAR ${orderId}`, data: `confirm_payment:${orderId}` }, { label: `❌ RECHAZAR ${orderId}`, data: `reject_payment:${orderId}` }]]
      );
      break;

    case 'confirmed':
      await sender.sendText(order.customer_whatsapp_id,
        `✅ <b>Pago confirmado!</b>\nTu pedido #${orderId} está siendo preparado.`);
      break;

    case 'preparing':
      await sender.sendText(order.customer_whatsapp_id,
        `👨‍🍳 Tu pedido #${orderId} está en preparación.`);
      break;

    case 'modified_pending': {
      const items = order.items || [];
      const itemList = items.map((i) => `• ${i.item_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n');
      await sender.sendButtons(order.customer_whatsapp_id,
        `⚠️ <b>El negocio modificó tu pedido #${orderId}</b>\n\nNuevo detalle:\n${itemList}\n\nTotal: $${parseFloat(order.total).toFixed(2)}\n\n¿Aceptas el pedido modificado?`,
        [[{ label: '✅ Aceptar', data: 'accept_modification' }, { label: '❌ Cancelar', data: 'reject_modification' }]]
      );
      break;
    }

    case 'ready':
      await sender.sendText(order.customer_whatsapp_id,
        `📦 Tu pedido #${orderId} está listo. Buscando repartidor...`);
      break;

    case 'pickup_ready': {
      const loc = order.business_address_text ? `\n📍 ${order.business_address_text}` : '';
      await sender.sendText(order.customer_whatsapp_id,
        `📦 Tu pedido #${orderId} está listo. ¡Podés venir a buscarlo!\n\n🏪 ${order.business_name}${loc}`);
      await sender.sendText(order.business_whatsapp_id,
        `✅ Pedido #${orderId} marcado como listo. Avisado al cliente para que venga a retirarlo.`);
      break;
    }

    case 'rider_assigned': {
      const rider = await ridersDb.findById(order.rider_id);
      await sender.sendText(order.customer_whatsapp_id,
        `🛵 <b>${rider?.name || 'El repartidor'}</b> va en camino al negocio a recoger tu pedido #${orderId}.`);
      if (rider) {
        await sender.sendButtons(rider.whatsapp_id,
          `📦 <b>Nuevo pedido asignado: #${orderId}</b>\n\n🏪 Recoger en: ${order.business_name}\n📍 Entregar en: ${order.address_text}\n💰 Total pedido: $${parseFloat(order.total).toFixed(2)}`,
          [[{ label: '✅ Aceptar', data: `accept_order:${orderId}` }, { label: '❌ Rechazar', data: `reject_order:${orderId}` }]]
        );
      }
      break;
    }

    case 'in_delivery':
      await sender.sendText(order.customer_whatsapp_id,
        `🛵 Tu pedido #${orderId} fue recogido y va en camino a tu domicilio.`);
      break;

    case 'delivered':
      await sender.sendText(order.customer_whatsapp_id,
        `✅ <b>Pedido #${orderId} entregado!</b>\n\nGracias por tu compra. ¿Cómo estuvo el servicio?`);
      break;

    case 'cancelled':
      await sender.sendText(order.customer_whatsapp_id, `❌ Pedido #${orderId} cancelado.`);
      if (order.business_whatsapp_id) {
        await sender.sendText(order.business_whatsapp_id, `❌ Pedido #${orderId} cancelado por el cliente.`);
      }
      break;

    case 'disputed':
      await sender.sendText(order.customer_whatsapp_id,
        `⚠️ El negocio no pudo confirmar tu pago en el pedido #${orderId}. Un administrador revisará el caso.`);
      break;
  }
}

async function onPickupAtStoreCreated(orderId) {
  const order = await ordersDb.findWithItems(orderId);
  const itemList = order.items.map((i) => `• ${i.item_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n');
  const loc = order.business_address_text ? `\n📍 ${order.business_address_text}` : '';
  await sender.sendText(order.customer_whatsapp_id,
    `✅ <b>Pedido #${orderId} confirmado!</b>\n\n${itemList}\n\nTotal: <b>$${parseFloat(order.total).toFixed(2)}</b>\n\n🏪 ${order.business_name}${loc}\n\nTe avisamos cuando esté listo para recoger.`);
  await sender.sendButtons(order.business_whatsapp_id,
    `🏪 <b>Nuevo pedido para retirar en tienda #${orderId}</b>\n\nCliente: ${order.customer_name}\n${itemList}\n\nTotal: $${parseFloat(order.total).toFixed(2)}\n\n💵 El cliente paga personalmente en tienda.`,
    [[{ label: `✅ CONFIRMAR ${orderId}`, data: `confirm_payment:${orderId}` }]]
  );
}

async function onOrderCreated(orderId) {
  const order = await ordersDb.findWithItems(orderId);
  const itemList = order.items.map((i) => `• ${i.item_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n');
  await sender.sendButtons(
    order.customer_whatsapp_id,
    `🛒 <b>Pedido #${orderId} creado!</b>\n\n${itemList}\n\nTotal: <b>$${parseFloat(order.total).toFixed(2)}</b>\n\n` +
    `💳 Banco: <b>${order.bank_name}</b>\nCLABE: <code>${order.clabe}</code>\nTitular: <b>${order.account_holder}</b>\nReferencia: <b>#${orderId}</b>\n\n` +
    `Transferí el monto exacto y avisá cuando esté listo.`,
    [{ label: '✅ Ya pagué', data: 'paid' }]
  );
}

module.exports = { notify, onOrderCreated, onPickupAtStoreCreated };
