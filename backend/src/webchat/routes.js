'use strict';

const { handleUpdate } = require('../bot/fsm');
const sessions = require('./sessions');

let _msgId = 0;

// ─── Chat UI HTML ────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bot de Colonia — Demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #e5ddd5;
      display: flex;
      justify-content: center;
      min-height: 100svh;
    }
    #app {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      height: 100svh;
      background: #e5ddd5;
      box-shadow: 0 0 24px rgba(0,0,0,.18);
    }
    #header {
      background: #075e54;
      color: white;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #128c7e;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .hinfo { flex: 1; min-width: 0; }
    .htitle { font-weight: 600; font-size: 15px; }
    #conn-status { font-size: 12px; opacity: .8; }
    #new-btn {
      background: rgba(255,255,255,.15);
      border: none;
      color: white;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
    }
    #new-btn:hover { background: rgba(255,255,255,.28); }
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .mw { display: flex; flex-direction: column; }
    .mw.user { align-items: flex-end; }
    .mw.bot  { align-items: flex-start; }
    .bubble {
      max-width: 83%;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0,0,0,.1);
    }
    .bubble.user { background: #dcf8c6; border-radius: 8px 0 8px 8px; }
    .bubble.bot  { background: white;   border-radius: 0 8px 8px 8px; }
    .bubble b, .bubble strong { font-weight: 600; }
    .bubble code { font-family: monospace; background: #f2f2f2; padding: 1px 4px; border-radius: 3px; }
    .btns {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 83%;
      align-self: flex-start;
      padding-left: 2px;
    }
    .cbtn {
      background: #128c7e;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 7px 14px;
      font-size: 13px;
      cursor: pointer;
      line-height: 1.3;
      transition: background .12s;
    }
    .cbtn:hover:not(:disabled) { background: #0d7167; }
    .cbtn:disabled { background: #b8b8b8; cursor: default; }
    .photo-wrap { max-width: 83%; }
    .photo-wrap img { width: 100%; max-width: 260px; border-radius: 8px; display: block; }
    .photo-cap { font-size: 13px; color: #555; margin-top: 4px; max-width: 260px; }
    .loc-card {
      display: flex; align-items: center; gap: 10px;
      background: white; border-radius: 0 8px 8px 8px;
      padding: 10px 14px; max-width: 83%;
      text-decoration: none; color: inherit;
      box-shadow: 0 1px 2px rgba(0,0,0,.1);
      border-bottom: 2px solid #128c7e;
    }
    .loc-card:hover { background: #f5f5f5; }
    .loc-pin { font-size: 22px; flex-shrink: 0; }
    .loc-text { flex: 1; font-size: 13px; line-height: 1.4; }
    .loc-text small { color: #888; font-size: 11px; }
    .loc-arrow { color: #128c7e; font-size: 20px; font-weight: bold; }
    .loc-actions { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
    .loc-gps {
      background: #128c7e; color: white; border: none;
      border-radius: 18px; padding: 7px 14px; font-size: 13px; cursor: pointer;
      align-self: flex-start;
    }
    .loc-gps:hover:not(:disabled) { background: #0d7167; }
    .loc-manual { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 13px; }
    .loc-manual input {
      width: 105px; border: 1px solid #ccc; border-radius: 6px;
      padding: 5px 8px; font-size: 13px;
    }
    .loc-manual button {
      background: #075e54; color: white; border: none;
      border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 13px;
    }
    .info {
      background: rgba(0,0,0,.07);
      color: #555;
      font-size: 12px;
      border-radius: 10px;
      padding: 4px 14px;
      align-self: center;
    }
    #input-area {
      background: #f0f0f0;
      padding: 8px 10px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
      border-top: 1px solid #ddd;
    }
    #msg-input {
      flex: 1;
      border: none;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 14px;
      outline: none;
      background: white;
    }
    #msg-input:disabled { background: #f0f0f0; color: #aaa; }
    .ibtn {
      background: #128c7e; color: white; border: none;
      border-radius: 50%; width: 40px; height: 40px;
      font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .12s;
    }
    .ibtn:hover:not(:disabled) { background: #0d7167; }
    .ibtn:disabled { background: #b8b8b8; cursor: default; }
  </style>
</head>
<body>
<div id="app">
  <div id="header">
    <div class="avatar">🤖</div>
    <div class="hinfo">
      <div class="htitle">Bot de Colonia — Demo</div>
      <div id="conn-status">Conectando…</div>
    </div>
    <button id="new-btn" onclick="location.reload()">↺ Nueva sesión</button>
  </div>
  <div id="messages"></div>
  <div id="input-area">
    <input type="text" id="msg-input" placeholder="Escribe un mensaje…" disabled autocomplete="off">
    <button class="ibtn" id="send-btn" disabled title="Enviar">&#10148;</button>
    <button class="ibtn" id="loc-btn" title="Compartir ubicación" style="font-size:16px">📍</button>
  </div>
</div>
<script>
(function () {
  const sessionId = crypto.randomUUID();
  const log = document.getElementById('messages');
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const locBtn = document.getElementById('loc-btn');
  const connStatus = document.getElementById('conn-status');

  // ── SSE connection ──────────────────────────────────────────────────────
  const es = new EventSource('/webchat/stream/' + sessionId);

  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'connected') {
      connStatus.textContent = 'En línea';
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
      addInfo('Sesión · ' + sessionId.slice(0, 8) + '…');
      return;
    }
    renderMsg(msg);
  };

  es.onerror = () => { connStatus.textContent = 'Reconectando…'; };

  // ── Render ──────────────────────────────────────────────────────────────
  function renderMsg(msg) {
    if (msg.type === 'text') {
      addBubble('bot', msg.html);
    } else if (msg.type === 'buttons' || msg.type === 'list') {
      addBubble('bot', msg.html);
      const items = msg.buttons || msg.items;
      const group = document.createElement('div');
      group.className = 'btns';
      items.forEach(function (item) {
        const btn = document.createElement('button');
        btn.className = 'cbtn';
        btn.textContent = item.label;
        btn.addEventListener('click', function () {
          group.querySelectorAll('.cbtn').forEach(function (b) { b.disabled = true; });
          addBubble('user', esc(item.label));
          post({ type: 'callback', data: item.data });
        });
        group.appendChild(btn);
      });
      log.appendChild(group);
      scrollEnd();
    } else if (msg.type === 'photo') {
      const wrap = document.createElement('div');
      wrap.className = 'mw bot';
      const pw = document.createElement('div');
      pw.className = 'photo-wrap';
      const img = document.createElement('img');
      img.src = msg.url;
      img.alt = '';
      img.onerror = function () { img.style.display = 'none'; };
      pw.appendChild(img);
      if (msg.html) {
        const cap = document.createElement('div');
        cap.className = 'photo-cap';
        cap.innerHTML = msg.html;
        pw.appendChild(cap);
      }
      wrap.appendChild(pw);
      log.appendChild(wrap);
      scrollEnd();
    } else if (msg.type === 'location_send') {
      const wrap = document.createElement('div');
      wrap.className = 'mw bot';
      const card = document.createElement('a');
      card.className = 'loc-card';
      card.href = 'https://www.google.com/maps?q=' + msg.lat + ',' + msg.lng;
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = '<span class="loc-pin">📍</span><span class="loc-text">' +
        (msg.name ? esc(msg.name) + '<br><small>' + msg.lat.toFixed(5) + ', ' + msg.lng.toFixed(5) + '</small>' : msg.lat.toFixed(5) + ', ' + msg.lng.toFixed(5)) +
        '</span><span class="loc-arrow">›</span>';
      wrap.appendChild(card);
      log.appendChild(wrap);
      scrollEnd();
    } else if (msg.type === 'location_request') {
      addBubble('bot', msg.html);
      const actions = document.createElement('div');
      actions.className = 'loc-actions';

      const gpsBtn = document.createElement('button');
      gpsBtn.className = 'loc-gps';
      gpsBtn.textContent = '📍 Compartir mi ubicación';
      gpsBtn.addEventListener('click', function () {
        if (!navigator.geolocation) { addInfo('Geolocalización no disponible.'); return; }
        gpsBtn.textContent = 'Obteniendo…';
        gpsBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            actions.remove();
            addBubble('user', '📍 Ubicación compartida');
            post({ type: 'location', lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          function () {
            gpsBtn.textContent = '📍 Compartir mi ubicación';
            gpsBtn.disabled = false;
            addInfo('No se pudo obtener la ubicación. Usa las coordenadas manuales.');
          }
        );
      });

      const manual = document.createElement('div');
      manual.className = 'loc-manual';
      const latIn = document.createElement('input');
      latIn.type = 'number'; latIn.step = 'any'; latIn.placeholder = 'Latitud';
      const lngIn = document.createElement('input');
      lngIn.type = 'number'; lngIn.step = 'any'; lngIn.placeholder = 'Longitud';
      const manBtn = document.createElement('button');
      manBtn.textContent = 'Enviar';
      manBtn.addEventListener('click', function () {
        const lat = parseFloat(latIn.value);
        const lng = parseFloat(lngIn.value);
        if (isNaN(lat) || isNaN(lng)) { addInfo('Ingresa coordenadas válidas.'); return; }
        actions.remove();
        addBubble('user', '📍 ' + lat.toFixed(5) + ', ' + lng.toFixed(5));
        post({ type: 'location', lat, lng });
      });
      manual.appendChild(document.createTextNode('Manual: '));
      manual.appendChild(latIn);
      manual.appendChild(lngIn);
      manual.appendChild(manBtn);

      actions.appendChild(gpsBtn);
      actions.appendChild(manual);
      log.appendChild(actions);
      scrollEnd();
    }
  }

  function addBubble(side, html) {
    const wrap = document.createElement('div');
    wrap.className = 'mw ' + side;
    const b = document.createElement('div');
    b.className = 'bubble ' + side;
    b.innerHTML = html || '';
    wrap.appendChild(b);
    log.appendChild(wrap);
    scrollEnd();
    return b;
  }

  function addInfo(text) {
    const el = document.createElement('div');
    el.className = 'info';
    el.textContent = text;
    log.appendChild(el);
    scrollEnd();
  }

  function scrollEnd() { log.scrollTop = log.scrollHeight; }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Send ────────────────────────────────────────────────────────────────
  async function post(body) {
    try {
      await fetch('/webchat/message/' + sessionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      addInfo('Error de red: ' + err.message);
    }
  }

  function sendText() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('user', esc(text));
    post({ type: 'text', text: text });
  }

  sendBtn.addEventListener('click', sendText);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  });

  locBtn.addEventListener('click', function () {
    if (!navigator.geolocation) { addInfo('Geolocalización no disponible.'); return; }
    locBtn.textContent = '⏳';
    locBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        locBtn.innerHTML = '📍';
        locBtn.disabled = false;
        addBubble('user', '📍 Ubicación compartida');
        post({ type: 'location', lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      function () {
        locBtn.innerHTML = '📍';
        locBtn.disabled = false;
        addInfo('No se pudo obtener la ubicación. El bot pedirá tu dirección cuando la necesite.');
      }
    );
  });
})();
</script>
</body>
</html>`;

// ─── Fastify plugin ──────────────────────────────────────────────────────────

async function webchatRoutes(fastify) {
  fastify.get('/webchat', async (req, reply) => {
    reply.type('text/html; charset=utf-8').send(HTML);
  });

  fastify.get('/webchat/stream/:sessionId', (req, reply) => {
    const chatId = 'webchat:' + req.params.sessionId;
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const emitter = sessions.create(chatId);

    function send(payload) {
      try { reply.raw.write('data: ' + JSON.stringify(payload) + '\n\n'); } catch (_) {}
    }

    send({ type: 'connected', sessionId: req.params.sessionId });
    emitter.on('message', send);

    const ka = setInterval(() => {
      try { reply.raw.write(': keepalive\n\n'); } catch (_) { clearInterval(ka); }
    }, 25000);

    req.raw.on('close', () => {
      clearInterval(ka);
      emitter.removeListener('message', send);
      sessions.delete(chatId);
    });
  });

  fastify.post('/webchat/message/:sessionId', async (req, reply) => {
    const chatId = 'webchat:' + req.params.sessionId;
    const body = req.body;
    const now = Math.floor(Date.now() / 1000);
    const id = ++_msgId;

    let update;
    if (body.type === 'location') {
      update = {
        message: {
          message_id: id,
          chat: { id: chatId, type: 'private' },
          from: { id: chatId, is_bot: false, first_name: 'WebUser' },
          location: { latitude: Number(body.lat), longitude: Number(body.lng) },
          date: now,
        },
      };
    } else if (body.type === 'callback') {
      update = {
        callback_query: {
          id: String(id),
          from: { id: chatId, is_bot: false, first_name: 'WebUser' },
          message: { message_id: id, chat: { id: chatId } },
          data: body.data,
        },
      };
    } else {
      update = {
        message: {
          message_id: id,
          chat: { id: chatId, type: 'private' },
          from: { id: chatId, is_bot: false, first_name: 'WebUser' },
          text: String(body.text || ''),
          date: now,
        },
      };
    }

    try {
      await handleUpdate(update);
    } catch (err) {
      console.error('[webchat] handleUpdate error:', err);
      return reply.status(500).send({ error: err.message });
    }

    reply.send({ ok: true });
  });
}

module.exports = webchatRoutes;
