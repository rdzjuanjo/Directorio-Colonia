const businesses = require('../../db/models/businesses');
const conversations = require('../../db/models/conversations');
const sender = require('../../telegram/sender');

const CATEGORIES = [
  { label: '🍕 Comida preparada', value: 'comida' },
  { label: '🛒 Abarrotes', value: 'abarrotes' },
  { label: '🥩 Carnicería', value: 'carniceria' },
  { label: '🥖 Panadería', value: 'panaderia' },
  { label: '💊 Farmacia', value: 'farmacia' },
  { label: '🏪 Miscelánea', value: 'miscelanea' },
];

async function handle({ chatId, text, callbackData, conv, customer }) {
  // Delegar selección de negocio al handler de búsqueda
  if (callbackData?.startsWith('biz:') || callbackData?.startsWith('biz_closed:')) {
    const searchHandler = require('./search');
    return searchHandler.handle({ chatId, text, callbackData, conv, customer });
  }

  if (callbackData?.startsWith('cat:')) {
    const category = callbackData.replace('cat:', '');
    return showBusinessesByCategory(chatId, category, conv);
  }

  if (callbackData === 'show_categories' || text === '/categorias' || text === '/start') {
    await sender.sendList(chatId, '¿Qué tipo de negocio buscas?',
      CATEGORIES.map((c) => ({ label: c.label, data: `cat:${c.value}` })));
    return;
  }

  if (text) {
    const allActive = await businesses.findActive();
    const query = text.toLowerCase();
    const matches = allActive.filter((b) =>
      b.name.toLowerCase().includes(query) || b.category.toLowerCase().includes(query) || b.description?.toLowerCase().includes(query)
    );

    if (!matches.length) {
      await sender.sendButtons(chatId,
        `No encontré negocios para "<b>${text}</b>".\n¿Quieres ver por categorías?`,
        [{ label: '📋 Ver categorías', data: 'show_categories' }]);
      return;
    }

    return showBusinessList(chatId, matches, conv);
  }

  await sender.sendButtons(chatId,
    `Hola <b>${customer?.name}</b>! ¿Qué deseas hacer?`,
    [
      { label: '🔍 Buscar negocios', data: 'show_categories' },
      { label: '📋 Ver categorías', data: 'show_categories' },
    ]);
}

async function showBusinessesByCategory(chatId, category, conv) {
  const allActive = await businesses.findActive();
  const matches = allActive.filter((b) => b.category === category);
  if (!matches.length) {
    await sender.sendText(chatId, 'No hay negocios disponibles en esa categoría por ahora.');
    return;
  }
  return showBusinessList(chatId, matches, conv);
}

async function showBusinessList(chatId, businessList, conv) {
  const open = businessList.filter((b) => businesses.isOpen(b));
  const closed = businessList.filter((b) => !businesses.isOpen(b));

  let text = open.length
    ? `Negocios disponibles ahora (${open.length}):`
    : 'No hay negocios abiertos en este momento.';

  const items = [
    ...open.map((b) => ({ label: `🟢 ${b.name}`, data: `biz:${b.id}` })),
    ...closed.map((b) => ({ label: `🔴 ${b.name} (cerrado)`, data: `biz_closed:${b.id}` })),
  ];

  await sender.sendList(chatId, text, items);
}

module.exports = { handle };
