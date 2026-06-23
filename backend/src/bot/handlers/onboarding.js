// onboarding.js — Registro de nuevo cliente: captura nombre, detecta preguntas frecuentes y responde FAQ antes de solicitar ubicación
'use strict';

const customers = require('../../db/models/customers');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');

const WELCOME_TEXT =
  '👋 ¡Bienvenido a <b>Tienda Esquina</b>!\n\n' +
  'Aquí puedes encontrar todos los negocios de nuestra comunidad:\n' +
  '🍕 Comida preparada · 🛒 Abarrotes · 🥩 Carnicerías\n' +
  '🥖 Panaderías · 💊 Farmacias · 🏪 Misceláneas\n\n' +
  'Escribe lo que buscas, busca por categoría, o consulta el menú y datos de cada negocio.\n\n' +
  '💬 ¿Tienes alguna pregunta sobre cómo funciona? Escríbela aquí.\n' +
  'O si prefieres, dime tu nombre para que pueda atenderte mejor 😊';

const FAQ = [
  {
    keywords: ['envío', 'envio', 'entrega', 'domicilio', 'repartidor', 'delivery', 'costo envío', 'cobra'],
    answer:
      '🛵 Los pedidos con entrega a domicilio incluyen un costo de envío fijo.\n' +
      'También puedes elegir <b>retiro en tienda</b> si el negocio lo permite — sin costo extra.\n\n' +
      'El pago se hace por transferencia bancaria directamente al negocio.',
  },
  {
    keywords: ['precio', 'costo', 'cuesta', 'cobran', 'gratuito', 'gratis', 'pago', 'cómo pago', 'como pago'],
    answer:
      '💳 El directorio es completamente <b>gratuito</b> para consultar.\n' +
      'Al hacer un pedido, pagas directamente al negocio por transferencia bancaria.\n' +
      'Un repartidor lleva tu pedido y el negocio confirma el pago antes de prepararlo.',
  },
  {
    keywords: ['funciona', 'funcionar', 'para qué', 'para que', 'qué es', 'que es', 'sirve', 'cómo usar', 'como usar'],
    answer:
      '📋 Así funciona el directorio:\n\n' +
      '1️⃣ Buscas un negocio por nombre o categoría\n' +
      '2️⃣ Ves su menú y precios\n' +
      '3️⃣ Agregas productos a tu carrito\n' +
      '4️⃣ Pagas por transferencia al negocio\n' +
      '5️⃣ Un repartidor lleva tu pedido\n\n' +
      'Todo desde este chat de WhatsApp 🙌',
  },
  {
    keywords: ['negocios', 'negocio', 'tiendas', 'locales', 'hay', 'tienen', 'disponible', 'catálogo', 'catalogo'],
    answer:
      '🏪 En el directorio encontrarás negocios locales: comida preparada, abarrotes, carnicerías, panaderías, farmacias y más.\n\n' +
      'Escribe el nombre o tipo de lo que buscas y te muestro las opciones disponibles.',
  },
  {
    keywords: ['horario', 'hora', 'abierto', 'cerrado', 'cuándo', 'cuando'],
    answer:
      '🕐 Cada negocio tiene su propio horario de atención.\n' +
      'Al buscarlo verás si está abierto o cerrado en este momento.',
  },
];

const QUESTION_STARTERS = [
  'cómo', 'como', 'qué', 'que', 'cuándo', 'cuando', 'dónde', 'donde',
  'quién', 'quien', 'cuál', 'cual', 'cuánto', 'cuanto', 'cuántos', 'cuantos',
  'hay', 'tienen', 'puedo', 'sirve', 'funciona', 'es que', 'me pueden', 'se puede',
  'para qué', 'para que', 'cómo es', 'por qué', 'por que',
];

function isQuestion(text) {
  if (!text) return false;
  if (text.includes('?')) return true;
  const lower = text.toLowerCase().trim();
  return QUESTION_STARTERS.some((w) => lower.startsWith(w));
}

function findFaqAnswer(text) {
  const lower = text.toLowerCase();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.answer;
  }
  return null;
}

async function sendWelcome(chatId) {
  await sender.sendText(chatId, WELCOME_TEXT);
}

async function handle({ chatId, text, location, conv }) {
  const state = conv.state;

  if (state === 'onboarding_name') {
    if (!text || text.trim().length < 2) {
      await sender.sendText(chatId, '¿Cómo te llamas? 😊');
      return;
    }

    // Si parece una pregunta, responder y volver a pedir el nombre
    if (isQuestion(text)) {
      const answer = findFaqAnswer(text);
      const response = answer
        || '¡Buena pregunta! Tienda Esquina te permite encontrar negocios locales, ver sus menús y hacer pedidos desde WhatsApp.\n\nSi tienes más dudas, escríbelas aquí.';
      await sender.sendText(chatId, response + '\n\n¿Y tú, cómo te llamas? 😊');
      return;
    }

    const name = text.trim();

    // MODO CATÁLOGO: saltar ubicación
    if (process.env.BOT_MODE === 'catalog') {
      await customers.create({ whatsapp_id: String(chatId), name });
      await conversations.set(chatId, 'catalog_search', [], {});
      return require('./catalogSearch').handle({
        chatId, text: null, callbackData: null, location: null,
        conv: { state: 'catalog_search', cart_json: [], context_json: {} },
        customer: { name },
      });
    }

    await conversations.set(chatId, 'onboarding_location', [], { name });
    await sender.requestLocation(
      chatId,
      `Mucho gusto, <b>${name}</b>! 📍\n\nCompárteme tu ubicación para saber dónde entregar tus pedidos.`,
    );
    return;
  }

  if (state === 'onboarding_location') {
    const name = conv.context_json.name;

    if (location) {
      await customers.create({
        whatsapp_id: String(chatId),
        name,
        default_lat: location.latitude,
        default_lng: location.longitude,
        default_address_label: 'Mi dirección',
      });
      await conversations.set(chatId, 'idle', [], {});
      await sender.removeKeyboard(
        chatId,
        `✅ Listo, <b>${name}</b>! Tu dirección fue guardada.\n\nEscribe qué buscas o usa /categorias para ver los negocios disponibles.`,
      );
      return;
    }

    if (text) {
      await customers.create({ whatsapp_id: String(chatId), name, default_address_label: text.trim() });
      await conversations.set(chatId, 'idle', [], {});
      await sender.removeKeyboard(
        chatId,
        `✅ Listo, <b>${name}</b>! Dirección guardada como: <i>${text.trim()}</i>\n\nEscribe qué buscas o usa /categorias.`,
      );
      return;
    }

    await sender.requestLocation(chatId, 'Por favor comparte tu ubicación o escribe tu dirección.');
  }
}

module.exports = { handle, sendWelcome };
