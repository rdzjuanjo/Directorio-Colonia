'use strict';

const sessions = require('./sessions');
const sessionStore = require('./asyncSessionStore');

// Emite solo a la sesión que inició el request actual (capturada en AsyncLocalStorage).
// Si esa sesión ya cerró (el usuario recargó), el mensaje se descarta silenciosamente.
function emit(chatId, payload) {
  const sessionId = sessionStore.getStore();
  if (!sessionId) return;
  const emitter = sessions.getBySession(sessionId);
  if (!emitter) return;
  emitter.emit('message', payload);
}

function toHtml(text) {
  if (!text) return '';
  return text
    .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
    .replace(/_([^_\n]+)_/g, '<i>$1</i>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}

module.exports = {
  sendText: async (chatId, html) => {
    emit(chatId, { type: 'text', html: toHtml(html) });
  },

  sendButtons: async (chatId, html, buttons) => {
    const flat = buttons.flat();
    emit(chatId, {
      type: 'buttons',
      html: toHtml(html),
      buttons: flat.map((b) => ({ label: b.label, data: b.data })),
    });
  },

  sendList: async (chatId, html, items) => {
    emit(chatId, {
      type: 'list',
      html: toHtml(html),
      items: items.map((i) => ({ label: i.label, data: i.data })),
    });
  },

  sendPhoto: async (chatId, url, caption) => {
    emit(chatId, { type: 'photo', url, html: toHtml(caption) });
  },

  sendLocation: async (chatId, lat, lng, name) => {
    emit(chatId, { type: 'location_send', lat, lng, name: name || '' });
  },

  requestLocation: async (chatId, html) => {
    emit(chatId, { type: 'location_request', html: toHtml(html) });
  },

  removeKeyboard: async (chatId, html) => {
    if (html) emit(chatId, { type: 'text', html: toHtml(html) });
  },

  sendContact: async () => {},
  answerCallback: async () => {},
  setClient: () => {},
  setWebhook: async () => ({ ok: true }),
};
