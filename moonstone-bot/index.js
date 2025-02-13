// index.js
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const isDevelopment = process.env.NODE_ENV === 'development';
const url = process.env.APP_URL;
const port = process.env.PORT || 3000;
const WEBAPP_URL = 'https://0xjaqbek.github.io/MSGB';

let bot;
if (isDevelopment) {
  // Use polling for local development
  bot = new TelegramBot(token, { polling: true });
  console.log('Bot started in development mode (polling)');
} else {
  // Use webhooks for production
  bot = new TelegramBot(token, { webHook: { port } });
  // Set the webhook
  bot.setWebHook(`${url}/bot${token}`);
  console.log('Webhook set:', `${url}/bot${token}`);
}

const app = express();
app.use(express.json());

// Keep track of processed messages to prevent duplicates
const processedMessages = new Set();

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Webhook endpoint
if (!isDevelopment) {
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Handle /start command
bot.onText(/\/start(.+)?/, async (msg, match) => {
  // Check if message was already processed
  const messageId = `${msg.chat.id}_${msg.message_id}`;
  if (processedMessages.has(messageId)) {
    return;
  }
  processedMessages.add(messageId);

  const chatId = msg.chat.id;
  const startParam = match[1]?.trim();
  
  console.log('Start command received:', { chatId, startParam });

  try {
    if (startParam?.startsWith('ref_')) {
      const webAppUrl = `${WEBAPP_URL}?tgWebAppStartParam=${startParam}`;
      console.log('Sending referral webapp URL:', webAppUrl);
      
      await bot.sendMessage(chatId, '🎮 Welcome! Open the game to claim your bonus ticket:', {
        reply_markup: {
          inline_keyboard: [[{
            text: '🎮 Play MoonStones',
            web_app: { url: webAppUrl }
          }]]
        }
      });
    } else {
      console.log('Sending regular webapp URL:', WEBAPP_URL);
      await bot.sendMessage(chatId, '🎮 Welcome to MoonStones! Click below to start playing:', {
        reply_markup: {
          inline_keyboard: [[{
            text: '🎮 Play MoonStones',
            web_app: { url: WEBAPP_URL }
          }]]
        }
      });
    }
  } catch (error) {
    console.error('Error handling start command:', error);
  }
});

// Handle /invite command
bot.onText(/\/invite/, async (msg) => {
  const messageId = `${msg.chat.id}_${msg.message_id}`;
  if (processedMessages.has(messageId)) {
    return;
  }
  processedMessages.add(messageId);

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const inviteLink = `https://t.me/moonstonesgamebot?start=ref_${userId}`;
  
  try {
    await bot.sendMessage(chatId, 
      `🎮 Share this link with friends to get bonus tickets!\n\n${inviteLink}`, 
      { disable_web_page_preview: true }
    );
  } catch (error) {
    console.error('Error generating invite link:', error);
  }
});

// Clean up old processed messages periodically
setInterval(() => {
  processedMessages.clear();
}, 30 * 60 * 1000); // Clear every 30 minutes

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

// Start server
app.listen(port, () => {
  console.log(`Bot server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Webapp URL:', WEBAPP_URL);
  if (!isDevelopment) {
    console.log('Webhook URL:', `${url}/bot${token}`);
  }
});