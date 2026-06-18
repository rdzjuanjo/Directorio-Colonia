const { handleUpdate } = require('../bot/fsm');
const sender = require('./sender');

async function telegramRoutes(fastify) {
  fastify.post('/telegram', {
    config: { rawBody: true },
    handler: async (req, reply) => {
      const secret = req.headers['x-telegram-bot-api-secret-token'];
      if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      const update = req.body;
      setImmediate(() => handleUpdate(update).catch((err) => fastify.log.error(err)));
      return reply.code(200).send({ ok: true });
    },
  });

  fastify.get('/setup', async (req, reply) => {
    if (!process.env.PUBLIC_URL) return reply.send({ error: 'PUBLIC_URL not set' });
    const url = `${process.env.PUBLIC_URL}/webhook/telegram`;
    const result = await sender.setWebhook(url, process.env.TELEGRAM_WEBHOOK_SECRET);
    return reply.send(result);
  });
}

module.exports = telegramRoutes;
