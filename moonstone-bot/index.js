// index.js
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const isDevelopment = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000;
const WEBAPP_URL = 'https://0xjaqbek.github.io/MSGB';

const bot = new TelegramBot(token, { 
  polling: isDevelopment 
});

const app = express();
app.use(express.json());

// Handle /start command
bot.onText(/\/start(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1]?.trim();
  
  console.log('Start command received:', { chatId, startParam });

  if (startParam?.startsWith('ref_')) {
    const refParam = encodeURIComponent(startParam);
    const webAppUrl = `${WEBAPP_URL}?ref=${refParam}`;
    
    console.log('Sending referral URL:', webAppUrl);
    
    await bot.sendMessage(chatId, '🎮 Welcome! Click button to play and claim your bonus:', {
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🎮 Play with Bonus',
            web_app: { url: webAppUrl }
          }]
        ]
      }
    });
  } else {
    await bot.sendMessage(chatId, '🎮 Welcome to MoonStones! Click to play:', {
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🎮 Play MoonStones',
            web_app: { url: WEBAPP_URL }
          }]
        ]
      }
    });
  }
});

// Handle /invite command
bot.onText(/\/invite/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const inviteLink = `https://t.me/moonstonesgamebot?start=ref_${userId}`;
  
  console.log('Generating invite link:', inviteLink);
  
  await bot.sendMessage(chatId, 
    `🎮 Share this link with friends to get bonus tickets!\n\n${inviteLink}`, 
    { 
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{
            text: '📋 Copy Invite Link',
            callback_data: 'copy_invite'
          }]
        ]
      }
    }
  );
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  if (query.data === 'copy_invite') {
    const userId = query.from.id;
    const inviteLink = `https://t.me/moonstonesgamebot?start=ref_${userId}`;
    await bot.answerCallbackQuery(query.id, { text: 'Invite link copied!' });
  }
});

app.listen(port, () => {
  console.log(`Bot server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
});