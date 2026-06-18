const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inyectar el sender de WhatsApp ANTES de que fsm.js lo cargue,
// usando el mismo patrón de simulate.js / test-flow.js
const waSender = require('./sender');
const senderPath = require.resolve('../telegram/sender');
require(senderPath);
require.cache[senderPath].exports = waSender;

const { handleUpdate } = require('../bot/fsm');
const redis = require('../redis');

async function getButtonMap(chatId) {
  const data = await redis.get(`wa:bmap:${chatId}`);
  return data ? JSON.parse(data) : null;
}

let _msgId = 1;

function buildMessage(chatId, text) {
  return {
    message: {
      message_id: _msgId++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: 'Usuario' },
      text,
      date: Math.floor(Date.now() / 1000),
    },
  };
}

function buildCallback(chatId, data) {
  return {
    callback_query: {
      id: String(_msgId++),
      from: { id: chatId },
      message: { message_id: _msgId++, chat: { id: chatId } },
      data,
    },
  };
}

function buildLocation(chatId, latitude, longitude) {
  return {
    message: {
      message_id: _msgId++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: 'Usuario' },
      location: { latitude, longitude },
      date: Math.floor(Date.now() / 1000),
    },
  };
}

function startWhatsApp() {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  waSender.setClient(client);

  client.on('qr', (qr) => {
    console.log('\n📱 Escaneá el QR con WhatsApp para conectar el bot:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp bot conectado y listo');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación WhatsApp:', msg);
  });

  client.on('message', async (msg) => {
    // Ignorar mensajes de grupos y del propio bot
    if (msg.from.endsWith('@g.us')) return;
    if (msg.fromMe) return;

    const chatId = msg.from; // formato: "521234567890@c.us"

    // Ubicación compartida
    if (msg.type === 'location' || msg.location) {
      await handleUpdate(buildLocation(chatId, msg.location.latitude, msg.location.longitude))
        .catch(console.error);
      return;
    }

    const text = (msg.body || '').trim();
    if (!text) return;

    // Número → resolver contra mapa de botones activo
    if (/^\d+$/.test(text)) {
      const map = await getButtonMap(chatId);
      if (map) {
        const idx = parseInt(text, 10) - 1;
        if (idx >= 0 && idx < map.length) {
          await handleUpdate(buildCallback(chatId, map[idx])).catch(console.error);
          return;
        }
      }
    }

    // Texto libre → mensaje normal
    await handleUpdate(buildMessage(chatId, text)).catch(console.error);
  });

  client.initialize();
  return client;
}

module.exports = { startWhatsApp };
