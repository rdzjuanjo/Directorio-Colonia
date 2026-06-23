require('dotenv').config();
const readline = require('readline');
const path = require('path');

// ─── Personas de prueba ───────────────────────────────────────────────────────
// negocio y repartidor usan los whatsapp_ids reales de la DB para que las
// notificaciones del notifier (que envía a business_whatsapp_id / rider.whatsapp_id)
// aparezcan correctamente en el simulador.
const PERSONAS = {
  cliente:     111111111,   // nuevo usuario — pasará por onboarding
  negocio:     3312345678,  // pollos el pollo (businesses.whatsapp_id)
  repartidor:  345211335,   // repartilio    (riders.whatsapp_id)
};

// ─── Mock de sender — intercepta mensajes del bot ────────────────────────────
function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '');
}

function personaName(chatId) {
  return Object.entries(PERSONAS).find(([, id]) => id === chatId)?.[0] ?? String(chatId);
}

function box(chatId, lines) {
  const who = personaName(chatId);
  const header = `Bot → ${who}`;
  const width = Math.max(header.length + 4, ...lines.map((l) => l.length + 4));
  const hr = '─'.repeat(width);
  console.log(`\n┌${hr}┐`);
  console.log(`│  ${header.padEnd(width - 2)}│`);
  console.log(`├${hr}┤`);
  for (const line of lines) {
    for (const sub of line.split('\n')) {
      console.log(`│  ${sub.padEnd(width - 2)}│`);
    }
  }
  console.log(`└${hr}┘`);
}

const mockSender = {
  sendText: async (chatId, text, extra = {}) => {
    box(chatId, [stripHtml(text)]);
  },

  sendButtons: async (chatId, text, buttons) => {
    const lines = [stripHtml(text), ''];
    for (const row of buttons) {
      const cols = Array.isArray(row) ? row : [row];
      lines.push(cols.map((b) => `[${b.label}  →  cb:${b.data}]`).join('  '));
    }
    box(chatId, lines);
  },

  sendList: async (chatId, text, items) => {
    const lines = [stripHtml(text), ''];
    for (const item of items) {
      lines.push(`[${item.label}  →  cb:${item.data}]`);
    }
    box(chatId, lines);
  },

  sendPhoto: async (chatId, photoUrl, caption) => {
    box(chatId, [`📸 ${photoUrl}`, stripHtml(caption || '')]);
  },

  sendLocation: async (chatId, lat, lng, name) => {
    box(chatId, [`📍 Ubicación: ${name || ''}`, `lat: ${lat}, lng: ${lng}`]);
  },

  requestLocation: async (chatId, text) => {
    box(chatId, [stripHtml(text), '', '[📍 Compartir mi ubicación  →  /loc <lat> <lon>]']);
  },

  removeKeyboard: async (chatId, text) => {
    box(chatId, [stripHtml(text)]);
  },

  answerCallback: async () => {},
  setWebhook: async () => ({ ok: true }),
};

// Inyectar mock ANTES de que cualquier otro módulo lo cargue
const senderAbsPath = require.resolve('./src/sender');
require(senderAbsPath); // fuerza entrada en caché
require.cache[senderAbsPath].exports = mockSender;

// ─── Cargar la lógica del bot (ya usará el mock) ─────────────────────────────
const { handleUpdate } = require('./src/bot/fsm');

// ─── Constructores de updates ─────────────────────────────────────────────────
let _msgId = 1;
let _cbId  = 1;

function msgUpdate(chatId, text, persona) {
  return {
    message: {
      message_id: _msgId++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: persona },
      text,
      date: Math.floor(Date.now() / 1000),
    },
  };
}

function cbUpdate(chatId, data, persona) {
  return {
    callback_query: {
      id: String(_cbId++),
      from: { id: chatId, is_bot: false, first_name: persona },
      message: { message_id: _msgId++, chat: { id: chatId } },
      data,
    },
  };
}

function locUpdate(chatId, latitude, longitude, persona) {
  return {
    message: {
      message_id: _msgId++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: persona },
      location: { latitude, longitude },
      date: Math.floor(Date.now() / 1000),
    },
  };
}

// ─── REPL ─────────────────────────────────────────────────────────────────────
let currentPersona = 'cliente';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt() {
  rl.setPrompt(`\x1b[36m[${currentPersona}]\x1b[0m > `);
  rl.prompt();
}

console.log('\n\x1b[1m🤖  Simulador — Gestor de Colonia\x1b[0m');
console.log('Personas:', Object.entries(PERSONAS).map(([k, v]) => `\x1b[33m${k}\x1b[0m(${v})`).join('  '));
console.log('');
console.log('  /switch <persona>           cambiar quién habla');
console.log('  /cb <callback_data>         simular click en botón');
console.log('  /loc <latitud> <longitud>   simular ubicación compartida');
console.log('  /personas                   listar personas disponibles');
console.log('  Ctrl+C                      salir');
console.log('');

prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) { prompt(); return; }

  const chatId = PERSONAS[currentPersona] ?? parseInt(currentPersona, 10);

  if (input.startsWith('/switch ')) {
    const name = input.slice(8).trim();
    if (!PERSONAS[name]) {
      console.log(`Personas: ${Object.keys(PERSONAS).join(', ')}`);
    } else {
      currentPersona = name;
      console.log(`\x1b[32mAhora eres: ${name} (chatId: ${PERSONAS[name]})\x1b[0m`);
    }
    prompt();
    return;
  }

  if (input === '/personas') {
    for (const [k, v] of Object.entries(PERSONAS)) {
      console.log(`  ${k.padEnd(12)} → chatId ${v}`);
    }
    prompt();
    return;
  }

  if (input.startsWith('/cb ')) {
    const data = input.slice(4).trim();
    console.log(`\x1b[90m→ callback: ${data}\x1b[0m`);
    await handleUpdate(cbUpdate(chatId, data, currentPersona)).catch(console.error);
    prompt();
    return;
  }

  if (input.startsWith('/loc ')) {
    const parts = input.slice(5).trim().split(/\s+/);
    if (parts.length < 2) {
      console.log('Uso: /loc <latitud> <longitud>   ej: /loc -34.603 -58.381');
      prompt();
      return;
    }
    const [lat, lon] = parts.map(Number);
    console.log(`\x1b[90m→ ubicación: ${lat}, ${lon}\x1b[0m`);
    await handleUpdate(locUpdate(chatId, lat, lon, currentPersona)).catch(console.error);
    prompt();
    return;
  }

  console.log(`\x1b[90m→ texto: ${input}\x1b[0m`);
  await handleUpdate(msgUpdate(chatId, input, currentPersona)).catch(console.error);
  prompt();
});

rl.on('close', () => {
  console.log('\nAdios!');
  process.exit(0);
});
