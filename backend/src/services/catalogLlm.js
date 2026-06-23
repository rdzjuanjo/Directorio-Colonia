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

async function searchCatalog(query) {
  const snapshot = await buildSnapshot();

  const systemPrompt =
    'Eres el asistente del directorio de negocios de "la colonia".\n' +
    'Ayudas a clientes a encontrar productos y negocios locales.\n\n' +
    'Reglas:\n' +
    '- Solo devuelve negocios cuyo "id" aparezca en CATALOG. Nunca inventes nombres ni IDs.\n' +
    '- "highlight" es una frase corta (≤15 palabras) explicando la coincidencia.\n' +
    '- Responde en el mismo idioma que el usuario.\n' +
    '- Si no hay coincidencias, deja businesses:[] y rellena no_results_message.\n\n' +
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
        name: 'return_results',
        description: 'Devuelve los resultados de búsqueda del catálogo',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            businesses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:        { type: 'number' },
                  highlight: { type: 'string' },
                },
                required: ['id', 'highlight'],
              },
            },
            no_results_message: { type: ['string', 'null'] },
          },
          required: ['message', 'businesses', 'no_results_message'],
        },
      },
    }],
    tool_choice: { type: 'function', function: { name: 'return_results' } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('DeepSeek no devolvió resultados estructurados');
  return JSON.parse(toolCall.function.arguments);
}

module.exports = { searchCatalog };
