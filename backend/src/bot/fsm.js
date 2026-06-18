const conversations = require('../db/models/conversations');
const customers = require('../db/models/customers');
const sender = require('../sender');

const handlers = {
  idle: require('./handlers/idle'),
  onboarding_name: require('./handlers/onboarding'),
  onboarding_location: require('./handlers/onboarding'),
  searching: require('./handlers/search'),
  selecting_business: require('./handlers/search'),
  browsing_menu: require('./handlers/menu'),
  cart: require('./handlers/cart'),
  confirm_address: require('./handlers/address'),
  awaiting_payment: require('./handlers/payment'),
  order_active: require('./handlers/orderActive'),
  rider_commands: require('./handlers/riderCommands'),
  business_commands: require('./handlers/businessCommands'),
};

async function handleUpdate(update) {
  let chatId, text, callbackData, callbackQueryId, location;

  if (update.message) {
    chatId = update.message.chat.id;
    text = update.message.text;
    location = update.message.location;
  } else if (update.callback_query) {
    chatId = update.callback_query.message.chat.id;
    callbackData = update.callback_query.data;
    callbackQueryId = update.callback_query.id;
    await sender.answerCallback(callbackQueryId);
  } else {
    return;
  }

  const customer = await customers.findByTelegramId(chatId);

  if (customer?.banned) {
    await sender.sendText(chatId, 'Tu cuenta ha sido suspendida. Contacta al administrador.');
    return;
  }

  let conv = await conversations.get(chatId);

  if (!conv) {
    const initialState = customer ? 'idle' : 'onboarding_name';
    await conversations.set(chatId, initialState, [], {});
    conv = { state: initialState, cart_json: [], context_json: {} };
  }

  // Repartidores y negocios tienen handlers especiales
  const riderDb = require('../db/models/riders');
  const rider = await riderDb.findByTelegramId(chatId);
  if (rider) {
    await handlers.rider_commands.handle({ chatId, text, callbackData, conv, rider });
    return;
  }

  const businessUsersDb = require('../db/models/businessUsers');
  const businessUser = await businessUsersDb.findByTelegramId(chatId);
  if (businessUser) {
    await handlers.business_commands.handle({ chatId, text, callbackData, conv, businessUser });
    return;
  }

  const state = conv.state;
  const handler = handlers[state] || handlers.idle;
  await handler.handle({ chatId, text, callbackData, location, conv, customer });
}

module.exports = { handleUpdate };
