const businesses = require('../../db/models/businesses');
const conversations = require('../../db/models/conversations');
const sender = require('../../sender');

async function handle({ chatId, text, callbackData, conv, customer }) {
  if (callbackData?.startsWith('biz_closed:')) {
    const id = parseInt(callbackData.replace('biz_closed:', ''));
    const biz = await businesses.findById(id);
    const hours = biz?.hours_json || {};
    const day = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
    await sender.sendButtons(chatId,
      `🔴 <b>${biz.name}</b> está cerrado ahora.\n\nHorario de hoy (${day}): ${formatHours(hours)}`,
      [{ label: '⬅️ Volver', data: 'show_categories' }]);
    return;
  }

  if (callbackData?.startsWith('biz:')) {
    const id = parseInt(callbackData.replace('biz:', ''));
    const biz = await businesses.findById(id);
    if (!biz || !businesses.isOpen(biz)) {
      await sender.sendText(chatId, 'Este negocio ya no está disponible.');
      return;
    }
    await conversations.set(chatId, 'browsing_menu', [], { businessId: id });
    const menuHandler = require('./menu');
    await menuHandler.handle({ chatId, conv: { state: 'browsing_menu', cart_json: [], context_json: { businessId: id } }, customer });
    return;
  }

  // fallback al idle
  const idleHandler = require('./idle');
  await idleHandler.handle({ chatId, text, callbackData, conv, customer });
}

function formatHours(hours) {
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  const s = hours[day];
  if (!s || !s.open) return 'Cerrado';
  return `${s.from} - ${s.to}`;
}

module.exports = { handle };
