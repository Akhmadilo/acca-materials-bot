const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// --- Helper Database Functions ---
function getDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDb = { settings: { bot_token: "", admin_password: "admin" }, subscribers: [], categories: [], feedback_messages: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { settings: {}, subscribers: [], categories: [], feedback_messages: [] };
  }
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// --- Telegram Bot Engine ---
let bot = null;
let currentBotToken = "";
let userStates = {}; // chatId -> { categoryId, feedbackMode }

function initBot() {
  const db = getDb();
  const token = db.settings.bot_token || process.env.BOT_TOKEN;

  if (!token) {
    console.log('⚠️ Telegram Bot token hali kiritilmagan.');
    return;
  }

  if (bot && currentBotToken === token) {
    return;
  }

  try {
    if (bot) {
      bot.stopPolling();
    }

    currentBotToken = token;
    bot = new TelegramBot(token, { polling: true });
    console.log('🚀 Telegram Bot muvaffaqiyatli ishga tushdi!');

    setupBotHandlers();
  } catch (error) {
    console.error('❌ Botni ishga tushirishda xatolik:', error.message);
  }
}

function setupBotHandlers() {
  if (!bot) return;

  function addSubscriber(msg) {
    const db = getDb();
    const chat = msg.chat;
    const existing = db.subscribers.find(s => s.id === chat.id);
    
    if (!existing) {
      db.subscribers.push({
        id: chat.id,
        first_name: chat.first_name || '',
        last_name: chat.last_name || '',
        username: chat.username || '',
        joined_at: new Date().toISOString()
      });
      saveDb(db);
    }
  }

  function getKeyboardForCategory(parentId = null) {
    const db = getDb();
    const categories = db.categories
      .filter(c => (parentId === null ? !c.parentId : c.parentId === parentId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const keyboard = [];
    for (let i = 0; i < categories.length; i += 2) {
      const row = [{ text: categories[i].title }];
      if (categories[i + 1]) {
        row.push({ text: categories[i + 1].title });
      }
      keyboard.push(row);
    }

    if (parentId !== null) {
      keyboard.push([{ text: '🔙 Go Back' }]);
    }

    return {
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true
      }
    };
  }

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    addSubscriber(msg);
    userStates[chatId] = { currentParentId: null, feedbackMode: false };

    const welcomeText = `👋 Assalomu alaykum, <b>${msg.from.first_name || 'Foydalanuvchi'}</b>!\n\n` +
                        `ACCA va boshqa xalqaro sertifikatlar resurs botiga xush kelibsiz.\n` +
                        `Kerakli bo'limni tanlang:`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      ...getKeyboardForCategory(null)
    });
  });

  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    addSubscriber(msg);

    if (!userStates[chatId]) {
      userStates[chatId] = { currentParentId: null, feedbackMode: false };
    }

    const state = userStates[chatId];
    const db = getDb();

    if (state.feedbackMode) {
      db.feedback_messages.push({
        id: Date.now().toString(),
        userId: chatId,
        userName: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim(),
        username: msg.from.username || '',
        message: text,
        date: new Date().toISOString()
      });
      saveDb(db);

      state.feedbackMode = false;
      bot.sendMessage(chatId, "✅ Fikringiz va taklifingiz uchun rahmat! Xabaringiz adminga yetkazildi.", getKeyboardForCategory(state.currentParentId));
      return;
    }

    if (text === '🔙 Go Back' || text === 'Orqaga' || text === '/back') {
      if (state.currentParentId) {
        const currentCat = db.categories.find(c => c.id === state.currentParentId);
        state.currentParentId = currentCat ? currentCat.parentId : null;
      } else {
        state.currentParentId = null;
      }

      bot.sendMessage(chatId, "📁 Menyu:", getKeyboardForCategory(state.currentParentId));
      return;
    }

    const currentParentId = state.currentParentId;
    const matchedCategory = db.categories.find(c => {
      const matchParent = (currentParentId === null ? !c.parentId : c.parentId === currentParentId);
      return matchParent && c.title.trim().toLowerCase() === text.toLowerCase();
    }) || db.categories.find(c => c.title.trim().toLowerCase() === text.toLowerCase());

    if (matchedCategory) {
      if (matchedCategory.isFeedback) {
        state.feedbackMode = true;
        bot.sendMessage(chatId, "💬 Marhamat, o'z fikr, taklif va savollaringizni yozib qoldiring:");
        return;
      }

      const subcategories = db.categories.filter(c => c.parentId === matchedCategory.id);

      if (subcategories.length > 0) {
        state.currentParentId = matchedCategory.id;
        bot.sendMessage(chatId, `📁 <b>${matchedCategory.title}</b> bo'limi:`, {
          parse_mode: 'HTML',
          ...getKeyboardForCategory(matchedCategory.id)
        });
        return;
      }

      const resources = matchedCategory.resources || [];
      if (resources.length > 0) {
        const resKeyboard = resources.map(r => [{ text: r.title }]);
        resKeyboard.push([{ text: '🔙 Go Back' }]);

        bot.sendMessage(chatId, `📚 <b>${matchedCategory.title}</b> bo'yicha mavjud resurslar:`, {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: resKeyboard,
            resize_keyboard: true
          }
        });
        return;
      } else {
        bot.sendMessage(chatId, `ℹ️ <b>${matchedCategory.title}</b> bo'yicha hozircha resurslar joylanmagan. Tez orada yuklanadi!`, {
          parse_mode: 'HTML',
          ...getKeyboardForCategory(state.currentParentId)
        });
        return;
      }
    }

    for (const cat of db.categories) {
      const res = (cat.resources || []).find(r => r.title.trim().toLowerCase() === text.toLowerCase());
      if (res) {
        if (res.type === 'link') {
          const content = `<b>${res.title}</b>\n\n` +
                          `${res.description ? res.description + '\n\n' : ''}` +
                          `🔗 <b>Havola:</b> ${res.value}`;
          bot.sendMessage(chatId, content, { parse_mode: 'HTML' });
        } else if (res.type === 'file_id') {
          bot.sendMessage(chatId, `📄 <b>${res.title}</b> fayli yuborilmoqda...`, { parse_mode: 'HTML' });
          bot.sendDocument(chatId, res.value, { caption: res.description || res.title }).catch(err => {
            bot.sendMessage(chatId, `❌ Fayl yuborishda xatolik: ${res.value}`);
          });
        } else {
          bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.value}`, { parse_mode: 'HTML' });
        }
        return;
      }
    }

    bot.sendMessage(chatId, "Iltimos, pastdagi menyu tugmalaridan birini tanlang.", getKeyboardForCategory(state.currentParentId));
  });
}

// --- API Endpoints ---
app.get('/api/data', (req, res) => {
  res.json(getDb());
});

app.post('/api/settings', (req, res) => {
  const { bot_token, admin_password } = req.body;
  const db = getDb();
  if (bot_token !== undefined) db.settings.bot_token = bot_token;
  if (admin_password !== undefined) db.settings.admin_password = admin_password;
  saveDb(db);
  initBot();
  res.json({ success: true, message: "Sozlamalar saqlandi!" });
});

// Category CRUD
app.post('/api/categories', (req, res) => {
  const { title, parentId, isFeedback } = req.body;
  const db = getDb();

  const newCat = {
    id: 'cat_' + Date.now(),
    title,
    parentId: parentId || null,
    order: db.categories.length + 1,
    resources: [],
    isFeedback: !!isFeedback
  };

  db.categories.push(newCat);
  saveDb(db);
  res.json({ success: true, category: newCat });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  function deleteRecursive(catId) {
    const children = db.categories.filter(c => c.parentId === catId);
    children.forEach(ch => deleteRecursive(ch.id));
    db.categories = db.categories.filter(c => c.id !== catId);
  }

  deleteRecursive(id);
  saveDb(db);
  res.json({ success: true });
});

// Resource Single Add
app.post('/api/categories/:catId/resources', (req, res) => {
  const { catId } = req.params;
  const { title, type, value, description } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  if (!cat.resources) cat.resources = [];

  const newRes = {
    id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
    title,
    type: type || 'link',
    value,
    description: description || ''
  };

  cat.resources.push(newRes);
  saveDb(db);
  res.json({ success: true, resource: newRes });
});

// Resource BATCH / BULK Add (Ko'plab kitoblarni birvarakay yuklash)
app.post('/api/categories/:catId/resources/batch', (req, res) => {
  const { catId } = req.params;
  const { items } = req.body; // Array of { title, type, value, description }
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  if (!cat.resources) cat.resources = [];

  let addedCount = 0;
  if (Array.isArray(items)) {
    items.forEach(item => {
      if (item.title && item.value) {
        cat.resources.push({
          id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
          title: item.title.trim(),
          type: item.type || 'link',
          value: item.value.trim(),
          description: item.description ? item.description.trim() : ''
        });
        addedCount++;
      }
    });
  }

  saveDb(db);
  res.json({ success: true, addedCount });
});

// Resource Delete
app.delete('/api/categories/:catId/resources/:resId', (req, res) => {
  const { catId, resId } = req.params;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  cat.resources = (cat.resources || []).filter(r => r.id !== resId);
  saveDb(db);
  res.json({ success: true });
});

// Broadcast
app.post('/api/broadcast', async (req, res) => {
  const { message } = req.body;
  const db = getDb();

  if (!bot) {
    return res.status(400).json({ error: "Bot Token o'rnatilmagan." });
  }

  const subscribers = db.subscribers || [];
  let successCount = 0;
  let failCount = 0;

  for (const sub of subscribers) {
    try {
      await bot.sendMessage(sub.id, message, { parse_mode: 'HTML' });
      successCount++;
    } catch (err) {
      failCount++;
    }
  }

  res.json({ success: true, sent: successCount, failed: failCount, total: subscribers.length });
});

app.get('/ping', (req, res) => {
  res.send('PONG - 24/7 Alive');
});

app.listen(PORT, () => {
  console.log(`🌐 Web Admin Panel serveri: http://localhost:${PORT}`);
  initBot();
});
