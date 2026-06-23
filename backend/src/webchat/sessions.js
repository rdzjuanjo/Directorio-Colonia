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
  delete(chatId) {
    sessions.delete(chatId);
  },
};
