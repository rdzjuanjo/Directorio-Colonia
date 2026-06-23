'use strict';

const OpenAI = require('openai');
const redis = require('../redis');
const businesses = require('../db/models/businesses');
const menu = require('../db/models/menu');

const CACHE_KEY = 'catalog:snapshot';
const CACHE_TTL = 300; // 5 minutos

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function buildSnapshot() {
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const allBizs = await businesses.findActive();
  const snapshot = await Promise.all(
    allBizs.map(async (biz) => {
      const categories = await menu.getCategoriesWithItems(biz.id, true);
      return {
        id: biz.id,
        name: biz.name,
        description: biz.description || '',
        category: biz.category || '',
        address_text: biz.address_text || '',
        menu: categories.map((cat) => ({
          category: cat.name,
          items: cat.items.map((item) => ({
            name: item.name,
            description: item.description || '',
            price: item.price,
          })),
        })),
      };
    })
  );

  await redis.set(CACHE_KEY, JSON.stringify(snapshot), { EX: CACHE_TTL });
  return snapshot;
}

async function classifyAndSearch(query) {
  const snapshot = await buildSnapshot();

  const systemPrompt =
    'Eres el asistente del directorio de negocios de "La Colonia".\n' +
    'Clasifica el mensaje del usuario en una de estas intenciones y actúa según corresponda:\n\n' +
    '• "greeting": es un saludo puro (hola, buenas, hey, qué tal, etc.).\n' +
    '  → Responde con un saludo amistoso en response_message. Deja businesses:[].\n\n' +
    '• "question": pregunta sobre el funcionamiento de la plataforma, costos, envíos, pago, horarios, qué negocios hay, cómo pedir, etc.\n' +
    '  → Responde la pregunta en response_message usando la información del CATALOG y la siguiente info de plataforma:\n' +
    '    - Directorio gratuito de negocios locales de la colonia\n' +
    '    - Los pedidos se hacen por WhatsApp\n' +
    '    - Pago por transferencia bancaria directamente al negocio\n' +
    '    - Costo de envío fijo por entrega a domicilio\n' +
    '    - Algunos negocios ofrecen retiro en tienda (sin costo de envío)\n' +
    '    - Categorías disponibles: comida preparada, abarrotes, carnicería, panadería, farmacia, miscelánea\n' +
    '  Deja businesses:[].\n\n' +
    '• "search": busca un negocio o producto específico (tacos, pizza, farmacia, medicamento, etc.).\n' +
    '  → Llena businesses[] con los negocios del CATALOG que coincidan.\n' +
    '    - Solo devuelve IDs que existan en CATALOG. Nunca inventes.\n' +
    '    - "highlight" es una frase corta (≤15 palabras) explicando la coincidencia.\n' +
    '    - Si no hay coincidencias, deja businesses:[] y usa no_results_message.\n\n' +
    'Responde siempre en el mismo idioma que el usuario.\n\n' +
    'CATALOG:\n' +
    JSON.stringify(snapshot, null, 2);

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'handle_message',
        description: 'Clasifica la intención y devuelve la respuesta apropiada',
        parameters: {
          type: 'object',
          properties: {
            intent: {
              type: 'string',
              enum: ['greeting', 'question', 'search'],
              description: 'Intención del mensaje del usuario',
            },
            response_message: {
              type: ['string', 'null'],
              description: 'Respuesta para saludo o pregunta. Null para búsquedas.',
            },
            businesses: {
              type: 'array',
              description: 'Negocios encontrados (solo para intent=search)',
              items: {
                type: 'object',
                properties: {
                  id:        { type: 'number' },
                  highlight: { type: 'string' },
                },
                required: ['id', 'highlight'],
              },
            },
            message: {
              type: ['string', 'null'],
              description: 'Mensaje introductorio para mostrar antes de la lista de negocios',
            },
            no_results_message: {
              type: ['string', 'null'],
              description: 'Mensaje cuando no hay negocios que coincidan',
            },
          },
          required: ['intent', 'businesses'],
        },
      },
    }],
    tool_choice: { type: 'function', function: { name: 'handle_message' } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('DeepSeek no devolvió resultados estructurados');
  return JSON.parse(toolCall.function.arguments);
}

// Mantener compatibilidad con cualquier llamada directa a searchCatalog
async function searchCatalog(query) {
  return classifyAndSearch(query);
}

module.exports = { searchCatalog, classifyAndSearch };
