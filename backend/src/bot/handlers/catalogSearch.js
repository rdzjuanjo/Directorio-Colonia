'use strict';

const sender = require('../../sender');
const conversations = require('../../db/models/conversations');
const businesses = require('../../db/models/businesses');
const menu = require('../../db/models/menu');
const db = require('../../db');
const { searchCatalog } = require('../../services/catalogLlm');

const PUBLIC_URL = process.env.PUBLIC_URL || '';

const CATEGORIES = [
  { label: '🍕 Comida preparada', value: 'comida' },
  { label: '🛒 Abarrotes', value: 'abarrotes' },
  { label: '🥩 Carnicería', value: 'carniceria' },
  { label: '🥖 Panadería', value: 'panaderia' },
  { label: '💊 Farmacia', value: 'farmacia' },
  { label: '🏪 Miscelánea', value: 'miscelanea' },
];

function waIdToPhone(whatsappId) {
  if (!whatsappId) return null;
  return whatsappId.split('@')[0];
}

function formatHours(hoursJson) {
  if (!hoursJson) return null;
  const h = typeof hoursJson === 'string' ? JSON.parse(hoursJson) : hoursJson;
  if (!h || Object.keys(h).length === 0) return null;
  const labels = { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' };
  const parts = Object.entries(h)
    .filter(([, v]) => v && v.open && v.from && v.to)
    .map(([k, v]) => `${labels[k] || k}: ${v.from}–${v.to}`);
  return parts.length ? parts.join(', ') : null;
}

async function logEvent(eventType, whatsappId, { businessId = null, queryText = null } = {}) {
  try {
    await db('bot_catalog_events').insert({
      event_type: eventType,
      whatsapp_id: String(whatsappId),
      business_id: businessId || null,
      query_text: queryText || null,
    });
  } catch (e) {
    console.error('[catalog analytics]', e.message);
  }
}

async function showCatalogMenu(chatId, customerName) {
  const greeting = customerName
    ? `¡Hola, *${customerName}*! ¿Qué estás buscando hoy?`
    : '¡Hola! ¿Qué estás buscando hoy?';
  const buttons = [
    ...CATEGORIES.map((c) => ({ label: c.label, data: `cat:${c.value}` })),
    { label: '🌐 Ver directorio completo', data: 'show_directory' },
  ];
  await sender.sendButtons(
    chatId,
    `${greeting}\n\nO escribe directamente qué buscás 👇`,
    buttons
  );
}

async function showBusinessesByCategory(chatId, category) {
  const allActive = await businesses.findActive();
  const matches = allActive.filter((b) => b.category === category);
  if (!matches.length) {
    await sender.sendButtons(
      chatId,
      'No hay negocios disponibles en esa categoría por ahora.',
      [{ label: '⬅ Ver categorías', data: 'back_to_categories' }]
    );
    return;
  }
  const open = matches.filter((b) => businesses.isOpen(b));
  const closed = matches.filter((b) => !businesses.isOpen(b));
  const items = [
    ...open.map((b) => ({ label: `🟢 ${b.name}`, data: `biz:${b.id}` })),
    ...closed.map((b) => ({ label: `🔴 ${b.name} (cerrado ahora)`, data: `biz:${b.id}` })),
    { label: '⬅ Ver categorías', data: 'back_to_categories' },
  ];
  const catLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
  await sender.sendList(chatId, `Negocios en ${catLabel}:`, items);
}

async function showBusinessDetail(chatId, bizId, ctx) {
  const biz = await businesses.findById(bizId);
  if (!biz) {
    await sender.sendButtons(
      chatId,
      'No encontré ese negocio.',
      [{ label: '⬅ Ver categorías', data: 'back_to_categories' }]
    );
    return false;
  }

  const isOpen = businesses.isOpen(biz);
  const highlight = (ctx.shownBusinesses || []).find((b) => b.id === bizId)?.highlight;

  // Encabezado del negocio
  const header = [
    `*${biz.name}*`,
    highlight ? `_${highlight}_` : null,
    !isOpen ? '\n⚠️ _Cerrado ahora_' : null,
  ].filter(Boolean).join('\n');

  // Productos agrupados por categoría
  const categories = await menu.getCategoriesWithItems(biz.id, true);
  const activeCategories = categories.filter((c) => c.items.length > 0);

  const menuLines = [];
  for (const cat of activeCategories) {
    menuLines.push(`\n*${cat.name}*`);
    for (const item of cat.items) {
      const price = item.price != null ? ` — $${parseFloat(item.price).toFixed(2)}` : '';
      menuLines.push(`• ${item.name}${price}`);
    }
  }

  if (menuLines.length === 0) menuLines.push('\n_Sin productos disponibles por el momento._');

  const catalogUrl = `${PUBLIC_URL}/catalog/${biz.id}`;
  const fullText = header + menuLines.join('\n') + `\n\nPuedes ver el menú en ${catalogUrl}`;
  await sender.sendText(chatId, fullText);

  // Botones de acción
  const phone = waIdToPhone(biz.whatsapp_id);
  const actionButtons = [];
  if (phone) actionButtons.push({ label: '📞 Contactar al negocio', data: `contact_biz:${biz.id}` });
  if (biz.address_text) actionButtons.push({ label: '📍 Ver dirección', data: `show_address:${biz.id}` });
  actionButtons.push({ label: '⬅ Ver categorías', data: 'back_to_categories' });

  await sender.sendButtons(chatId, '¿Algo más?', actionButtons);
  return true;
}

async function runLlmSearch(chatId, query, customerName) {
  await sender.sendText(chatId, '🔍 Buscando...').catch(() => {});

  let result;
  try {
    result = await searchCatalog(query);
  } catch (err) {
    console.error('[catalogSearch] LLM error:', err.message);
    await sender.sendButtons(
      chatId,
      'Hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
      [{ label: '⬅ Ver categorías', data: 'back_to_categories' }]
    );
    return;
  }

  const intent = result.intent || 'search';

  // Saludo o pregunta → responder y mostrar el menú
  if (intent === 'greeting' || intent === 'question') {
    const response = (result.response_message && result.response_message !== 'null')
      ? result.response_message
      : (intent === 'greeting' ? '¡Hola! 👋 ¿En qué te puedo ayudar?' : 'Con gusto te ayudo. ¿Qué estás buscando?');
    await sender.sendText(chatId, response);
    await showCatalogMenu(chatId, customerName);
    await conversations.set(chatId, 'catalog_search', [], {});
    return;
  }

  // Búsqueda → mostrar negocios
  if (!result.businesses || result.businesses.length === 0) {
    const rawMsg = result.no_results_message || result.message;
    const msg = (rawMsg && rawMsg !== 'null')
      ? rawMsg
      : 'No encontré negocios que coincidan. Intenta con otras palabras.';
    await sender.sendButtons(chatId, msg,
      [{ label: '⬅ Ver categorías', data: 'back_to_categories' }]);
    await conversations.set(chatId, 'catalog_search', [], { lastQuery: query, shownBusinesses: [] });
    return;
  }

  // Verificar que los IDs devueltos por el LLM existan en la BD
  const bizRecords = await Promise.all(
    result.businesses.map((b) => businesses.findById(parseInt(b.id, 10)))
  );
  const valid = result.businesses
    .map((b, i) => ({ llm: b, db: bizRecords[i] }))
    .filter(({ db: dbRecord }) => dbRecord != null);

  if (!valid.length) {
    await sender.sendButtons(
      chatId,
      result.no_results_message || 'No encontré negocios disponibles.',
      [{ label: '⬅ Ver categorías', data: 'back_to_categories' }]
    );
    await conversations.set(chatId, 'catalog_search', [], { lastQuery: query, shownBusinesses: [] });
    return;
  }

  const buttons = [
    ...valid.map(({ llm, db: dbRecord }) => ({ label: dbRecord.name, data: `biz:${llm.id}` })),
    { label: '⬅ Ver categorías', data: 'back_to_categories' },
  ];

  const displayMsg = (result.message && result.message !== 'null')
    ? result.message
    : 'Aquí están los negocios que encontré:';
  await sender.sendButtons(chatId, displayMsg, buttons);
  await conversations.set(chatId, 'catalog_search', [], {
    lastQuery: query,
    shownBusinesses: valid.map(({ llm }) => ({ id: parseInt(llm.id, 10), highlight: llm.highlight })),
  });
}

module.exports = {
  showCatalogMenu,
  async handle({ chatId, text, callbackData, conv, customer }) {
    const ctx = conv.context_json || {};

    // ── Navegación por categorías ─────────────────────────────────────────
    if (callbackData?.startsWith('cat:')) {
      const category = callbackData.replace('cat:', '');
      await showBusinessesByCategory(chatId, category);
      await conversations.set(chatId, 'catalog_search', [], {
        browsingCategory: category,
        shownBusinesses: [],
      });
      return;
    }

    // ── Selección de negocio ──────────────────────────────────────────────
    if (callbackData?.startsWith('biz:')) {
      const bizId = parseInt(callbackData.split(':')[1], 10);
      await logEvent('business_viewed', chatId, { businessId: bizId });
      const shown = await showBusinessDetail(chatId, bizId, ctx);
      if (shown) {
        await conversations.set(chatId, 'viewing_business', [], { ...ctx, businessId: bizId });
      }
      return;
    }

    // ── Contactar negocio ─────────────────────────────────────────────────
    if (callbackData?.startsWith('contact_biz:')) {
      const bizId = parseInt(callbackData.split(':')[1], 10);
      const biz = await businesses.findById(bizId);
      if (biz) {
        const phone = waIdToPhone(biz.whatsapp_id);
        if (phone) {
          await sender.sendText(chatId, `📱 *${biz.name}*\n+${phone}`);
          await sender.sendContact(chatId, biz.name, phone);
          await logEvent('contact_shared', chatId, { businessId: bizId });
        }
      }
      await sender.sendButtons(chatId, '¿Algo más?', [
        { label: '📋 Ver menú', data: `biz:${bizId}` },
        { label: '⬅ Ver categorías', data: 'back_to_categories' },
      ]);
      return;
    }

    // ── Ver dirección ─────────────────────────────────────────────────────
    if (callbackData?.startsWith('show_address:')) {
      const bizId = parseInt(callbackData.split(':')[1], 10);
      const biz = await businesses.findById(bizId);
      if (biz) {
        if (!biz.address_text) {
          await sender.sendText(chatId, 'No hay dirección registrada para este negocio.');
        } else if (biz.lat && biz.lng) {
          await sender.sendLocation(chatId, parseFloat(biz.lat), parseFloat(biz.lng), biz.name);
          await sender.sendText(chatId, `📍 *${biz.name}*\n${biz.address_text}`);
        } else {
          await sender.sendText(chatId, `📍 *${biz.name}*\n${biz.address_text}`);
        }
        const phone = waIdToPhone(biz.whatsapp_id);
        const buttons = [];
        if (phone) buttons.push({ label: '📞 Contactar al negocio', data: `contact_biz:${bizId}` });
        buttons.push({ label: '📋 Ver menú', data: `biz:${bizId}` });
        buttons.push({ label: '⬅ Ver categorías', data: 'back_to_categories' });
        await sender.sendButtons(chatId, '¿Algo más?', buttons);
      }
      return;
    }

    // ── Ver directorio web ────────────────────────────────────────────────
    if (callbackData === 'show_directory') {
      await sender.sendText(
        chatId,
        `Aquí está el directorio de todos los negocios de la colonia:\n${PUBLIC_URL}/directorio`
      );
      return;
    }

    // ── Volver a categorías ───────────────────────────────────────────────
    if (callbackData === 'back_to_categories') {
      await showCatalogMenu(chatId, customer?.name);
      await conversations.set(chatId, 'catalog_search', [], {});
      return;
    }

    // ── Texto libre → clasificación LLM (saludo / pregunta / búsqueda) ──────
    const query = (text || '').trim();
    if (query) {
      await logEvent('search', chatId, { queryText: query });
      await runLlmSearch(chatId, query, customer?.name);
      return;
    }

    // ── Estado inicial / sin input reconocido ─────────────────────────────
    await showCatalogMenu(chatId, customer?.name);
    await conversations.set(chatId, 'catalog_search', [], {});
  },
};
