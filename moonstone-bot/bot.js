// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_BOT_TOKEN' with your actual bot token from BotFather
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1]?.trim(); // Get parameter after /start
  
  console.log('Start command received:', { chatId, startParam });

  if (startParam?.startsWith('ref_')) {
    // Handle referral start
    const webAppUrl = `https://0xjaqbek.github.io/MSGB?tgWebAppStartParam=${startParam}`;
    
    await bot.sendMessage(chatId, 'Welcome! Open the game to claim your bonus ticket:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Play MoonStones', web_app: { url: webAppUrl } }
        ]]
      }
    });
  } else {
    // Regular start
    const webAppUrl = 'https://0xjaqbek.github.io/MSGB';
    await bot.sendMessage(chatId, 'Welcome to MoonStones! Click below to start playing:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Play MoonStones', web_app: { url: webAppUrl } }
        ]]
      }
    });
  }
});

// Handle data from web app
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    
    if (data.action === 'generateInvite') {
      const userId = data.userId;
      const inviteLink = `https://t.me/moonstonesgamebot?start=ref_${userId}`;
      
      await bot.sendMessage(chatId, 
        `🎮 Share this link with friends to get bonus tickets!\n\n${inviteLink}`, 
        { disable_web_page_preview: true }
      );
    }
  } catch (error) {
    console.error('Error handling web_app_data:', error);
  }
});

console.log('Bot started...');