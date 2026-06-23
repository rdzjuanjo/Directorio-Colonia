'use strict';

const { AsyncLocalStorage } = require('node:async_hooks');

// Propaga el sessionId por toda la cadena async de un request de webchat.
// Permite que webchat-sender descarte mensajes de ops en vuelo cuya sesión ya cerró.
module.exports = new AsyncLocalStorage();
