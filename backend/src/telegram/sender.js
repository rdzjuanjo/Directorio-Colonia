const https = require('https');

const BASE_URL = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function apiCall(method, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendText: (chatId, text, extra = {}) =>
    apiCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra }),

  sendButtons: (chatId, text, buttons) =>
    apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buttons.map((row) =>
          Array.isArray(row)
            ? row.map((b) => ({ text: b.label, callback_data: b.data }))
            : [{ text: row.label, callback_data: row.data }]
        ),
      },
    }),

  sendList: (chatId, text, items) =>
    apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: items.map((item) => [{ text: item.label, callback_data: item.data }]),
      },
    }),

  sendPhoto: (chatId, photoUrl, caption) =>
    apiCall('sendPhoto', { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' }),

  requestLocation: (chatId, text) =>
    apiCall('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: {
        keyboard: [[{ text: '📍 Compartir mi ubicación', request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }),

  removeKeyboard: (chatId, text) =>
    apiCall('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: { remove_keyboard: true },
    }),

  answerCallback: (callbackQueryId, text = '') =>
    apiCall('answerCallbackQuery', { callback_query_id: callbackQueryId, text }),

  setWebhook: (url, secret) =>
    apiCall('setWebhook', { url, secret_token: secret }),
};
