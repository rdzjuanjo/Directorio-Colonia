const redis = require('../redis');

let waClient = null;

function setClient(client) {
  waClient = client;
}

// WhatsApp usa *negrita* e _italica_ en lugar de HTML
function htmlToWa(text) {
  return (text || '')
    .replace(/<b>(.*?)<\/b>/gi, '*$1*')
    .replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, '');
}

async function storeButtonMap(chatId, dataArray) {
  await redis.set(`wa:bmap:${chatId}`, JSON.stringify(dataArray), { EX: 1800 });
}

function numberedList(text, items) {
  let msg = htmlToWa(text) + '\n';
  items.forEach((item, i) => {
    msg += `\n${i + 1}. ${item.label}`;
  });
  msg += '\n\n_Respondé con el número_';
  return msg;
}

module.exports = {
  setClient,

  sendText: async (chatId, text) => {
    if (!waClient) return;
    await waClient.sendMessage(chatId, htmlToWa(text));
  },

  sendButtons: async (chatId, text, buttons) => {
    if (!waClient) return;
    const flat = buttons.flat();
    await storeButtonMap(chatId, flat.map((b) => b.data));
    await waClient.sendMessage(chatId, numberedList(text, flat));
  },

  sendList: async (chatId, text, items) => {
    if (!waClient) return;
    await storeButtonMap(chatId, items.map((i) => i.data));
    await waClient.sendMessage(chatId, numberedList(text, items));
  },

  sendPhoto: async (chatId, photoUrl, caption) => {
    if (!waClient) return;
    const { MessageMedia } = require('whatsapp-web.js');
    try {
      const media = await MessageMedia.fromUrl(photoUrl, { unsafeMime: true });
      await waClient.sendMessage(chatId, media, { caption: htmlToWa(caption) });
    } catch {
      // Si la foto no es accesible públicamente, solo enviar caption
      await waClient.sendMessage(chatId, `📸 ${htmlToWa(caption || '')}`);
    }
  },

  sendLocation: async (chatId, lat, lng, name) => {
    if (!waClient) return;
    const { Location } = require('whatsapp-web.js');
    await waClient.sendMessage(chatId, new Location(lat, lng, name || ''));
  },

  requestLocation: async (chatId, text) => {
    if (!waClient) return;
    await waClient.sendMessage(
      chatId,
      htmlToWa(text) + '\n\n_Tocá el clip 📎 → Ubicación y compartila_'
    );
  },

  removeKeyboard: async (chatId, text) => {
    if (!waClient) return;
    await waClient.sendMessage(chatId, htmlToWa(text));
  },

  sendContact: async (chatId, name, phone) => {
    if (!waClient) return;
    const { MessageMedia } = require('whatsapp-web.js');
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN;CHARSET=UTF-8:${name}`,
      `TEL;TYPE=CELL,VOICE:+${phone}`,
      'END:VCARD',
    ].join('\n');
    await waClient.sendMessage(
      chatId,
      new MessageMedia('text/x-vcard', Buffer.from(vcard).toString('base64'), `${name}.vcf`)
    );
  },

  // No-ops — no aplican en WhatsApp
  answerCallback: async () => {},
  setWebhook:     async () => ({ ok: true }),
};
