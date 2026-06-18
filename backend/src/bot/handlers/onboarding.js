const customers = require('../../db/models/customers');
const conversations = require('../../db/models/conversations');
const sender = require('../../telegram/sender');

async function handle({ chatId, text, location, conv }) {
  const state = conv.state;

  if (state === 'onboarding_name') {
    if (!text || text.startsWith('/') || text.trim().length < 2) {
      await sender.sendText(chatId, '👋 Hola! Soy el bot de pedidos de la colonia.\n\n¿Cuál es tu nombre?');
      return;
    }
    await conversations.set(chatId, 'onboarding_location', [], { name: text.trim() });
    await sender.requestLocation(chatId, `Mucho gusto, <b>${text.trim()}</b>! 📍\n\nComparteme tu ubicación para saber dónde entregar tus pedidos.`);
    return;
  }

  if (state === 'onboarding_location') {
    const name = conv.context_json.name;

    if (location) {
      await customers.create({
        telegram_id: String(chatId),
        name,
        default_lat: location.latitude,
        default_lng: location.longitude,
        default_address_label: 'Mi dirección',
      });
      await conversations.set(chatId, 'idle', [], {});
      await sender.removeKeyboard(chatId, `✅ Listo, <b>${name}</b>! Tu dirección fue guardada.\n\nEscribe qué buscas o usa /categorias para ver los negocios disponibles.`);
      return;
    }

    if (text) {
      await customers.create({ telegram_id: String(chatId), name, default_address_label: text.trim() });
      await conversations.set(chatId, 'idle', [], {});
      await sender.removeKeyboard(chatId, `✅ Listo, <b>${name}</b>! Dirección guardada como: <i>${text.trim()}</i>\n\nEscribe qué buscas o usa /categorias.`);
      return;
    }

    await sender.requestLocation(chatId, 'Por favor comparte tu ubicación o escribe tu dirección.');
  }
}

module.exports = { handle };
