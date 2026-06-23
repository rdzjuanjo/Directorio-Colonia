// sessions.js — Mapa en memoria de sesiones SSE activas: sessionId→emitter, chatId→sessionId; evita race conditions en reconexiones
'use strict';

const { EventEmitter } = require('events');

const bySession = new Map();     // sessionId → emitter
const chatToSession = new Map(); // chatId → sessionId activo
const sessionToChat = new Map(); // sessionId → chatId

module.exports = {
  register(chatId, sessionId) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(5);
    bySession.set(sessionId, emitter);
    chatToSession.set(chatId, sessionId);
    sessionToChat.set(sessionId, chatId);
    return emitter;
  },

  getBySession(sessionId) {
    return bySession.get(sessionId) ?? null;
  },

  getChatId(sessionId) {
    return sessionToChat.get(sessionId) ?? null;
  },

  deleteSession(chatId, sessionId) {
    // Solo borra el mapeo chatId→sessionId si sigue apuntando a ESTA sesión
    if (chatToSession.get(chatId) === sessionId) {
      chatToSession.delete(chatId);
    }
    bySession.delete(sessionId);
    sessionToChat.delete(sessionId);
  },
};
