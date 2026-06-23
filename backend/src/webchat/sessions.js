'use strict';

const { EventEmitter } = require('events');
const sessions = new Map();

module.exports = {
  create(chatId) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(5);
    sessions.set(chatId, emitter);
    return emitter;
  },
  get(chatId) {
    return sessions.get(chatId) ?? null;
  },
  // Solo borra si el emitter sigue siendo el que pidió el delete (evita race condition en recarga)
  deleteIfMatch(chatId, emitter) {
    if (sessions.get(chatId) === emitter) {
      sessions.delete(chatId);
    }
  },
};
