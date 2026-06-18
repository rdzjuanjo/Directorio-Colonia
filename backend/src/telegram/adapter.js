/**
 * Interfaz común para mensajería.
 * Swap este módulo por src/whatsapp/adapter.js en producción
 * manteniendo la misma API pública.
 */
const sender = require('./sender');

module.exports = {
  sendText: (chatId, text) => sender.sendText(chatId, text),
  sendButtons: (chatId, text, buttons) => sender.sendButtons(chatId, text, buttons),
  sendList: (chatId, text, items) => sender.sendList(chatId, text, items),
  sendPhoto: (chatId, photoUrl, caption) => sender.sendPhoto(chatId, photoUrl, caption),
  requestLocation: (chatId, text) => sender.requestLocation(chatId, text),
  removeKeyboard: (chatId, text) => sender.removeKeyboard(chatId, text),
};
