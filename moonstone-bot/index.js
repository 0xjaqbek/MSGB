// index.js
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const isDevelopment = process.env.NODE_ENV === 'development';
const url = process.env.APP_URL;
const port = process.env.PORT || 3000;
const WEBAPP_URL = 'https://0xjaqbek.github.io/MSGB';

const app = express();
app.use(express.json());

let bot;
if (isDevelopment) {
  // Use polling for local development
  bot = new TelegramBot(token, { polling: true });
  console.log('Bot started in development mode (polling)');
} else {
  // Use webhooks for production
  bot = new TelegramBot(token, { webHook: { port: null } }); // Don't let bot create server
  bot.setWebHook(`${url}/bot${token}`);
  console.log('Webhook set:', `${url}/bot${token}`);
}

// Keep track of processed messages to prevent duplicates
const processedMessages = new Set();

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Webhook endpoint for production
if (!isDevelopment) {
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Handle /start command
bot.onText(/\/start(.+)?/, async (msg, match) => {
  const messageId = `${msg.chat.id}_${msg.message_id}`;
  if (processedMessages.has(messageId)) return;
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
  if (processedMessages.has(messageId)) return;
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

// Use a single server for both bot and express
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Webapp URL:', WEBAPP_URL);
  if (!isDevelopment) {
    console.log('Webhook URL:', `${url}/bot${token}`);
  }
});

// Handle notifications from web app
bot.on('web_app_data', async (msg) => {
    const chatId = msg.chat.id;
    try {
      const data = JSON.parse(msg.web_app_data.data);
      
      switch (data.action) {
        case 'generateInvite':
          const userId = data.userId;
          const inviteLink = `https://t.me/moonstonesgamebot?start=ref_${userId}`;
          await bot.sendMessage(chatId, 
            `🎮 Share this link with friends to get bonus tickets!\n\n${inviteLink}`, 
            { disable_web_page_preview: true }
          );
          break;
  
        case 'friendRequest':
          // Send notification to target user
          await bot.sendMessage(data.targetUserId, 
            `🤝 ${data.senderName} wants to be your friend!\n\nOpen the game to respond to the request.`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: '🎮 Open Game', web_app: { url: 'https://0xjaqbek.github.io/MSGB' } }
                ]]
              }
            }
          );
          break;
  
        case 'friendRequestAccepted':
          // Notify sender that their request was accepted
          await bot.sendMessage(data.targetUserId,
            `✨ ${data.accepterName} accepted your friend request!`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: '🎮 Open Game', web_app: { url: 'https://0xjaqbek.github.io/MSGB' } }
                ]]
              }
            }
          );
          break;
  
        case 'friendRemoved':
          // Optional: Notify user they've been removed from someone's friend list
          await bot.sendMessage(data.targetUserId,
            `👋 ${data.removerName} has removed you from their friends list.`
          );
          break;
      }
    } catch (error) {
      console.error('Error handling web_app_data:', error);
    }
  });