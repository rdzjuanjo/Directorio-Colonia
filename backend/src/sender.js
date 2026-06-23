'use strict';

const wa = require('./whatsapp/sender');
const wc = require('./webchat/webchat-sender');

const isWeb = (id) => String(id).startsWith('webchat:');

module.exports = {
  setClient:       (c)            => wa.setClient(c),
  setWebhook:      (u)            => wa.setWebhook(u),
  answerCallback:  (id)           => wa.answerCallback(id),
  sendText:        (id, text)     => isWeb(id) ? wc.sendText(id, text)          : wa.sendText(id, text),
  sendButtons:     (id, text, b)  => isWeb(id) ? wc.sendButtons(id, text, b)    : wa.sendButtons(id, text, b),
  sendList:        (id, text, i)  => isWeb(id) ? wc.sendList(id, text, i)       : wa.sendList(id, text, i),
  sendPhoto:       (id, url, cap)      => isWeb(id) ? wc.sendPhoto(id, url, cap)          : wa.sendPhoto(id, url, cap),
  sendLocation:    (id, lat, lng, nm) => isWeb(id) ? wc.sendLocation(id, lat, lng, nm)   : wa.sendLocation(id, lat, lng, nm),
  requestLocation: (id, text)         => isWeb(id) ? wc.requestLocation(id, text)        : wa.requestLocation(id, text),
  removeKeyboard:  (id, text)     => isWeb(id) ? wc.removeKeyboard(id, text)    : wa.removeKeyboard(id, text),
  sendContact:     (id, n, p)     => isWeb(id) ? Promise.resolve()              : wa.sendContact(id, n, p),
};
