const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- Full Master Database Generator ---
function generateFullMasterDb() {
  const rootCategories = [
    { id: "cat_acca", title: "🔴 ACCA 🔴", parentId: null, order: 1, resources: [] },
    { id: "cat_cfa", title: "📊 CFA Exam", parentId: null, order: 2, resources: [] },
    { id: "cat_feedback", title: "💬 Feedback", parentId: null, order: 3, resources: [], isFeedback: true }
  ];

  const mainLevels = [
    { id: "cat_applied_knowledge", title: "📘 Applied Knowledge", parentId: "cat_acca", order: 1, resources: [] },
    { id: "cat_applied_skills", title: "📊 Applied Skills", parentId: "cat_acca", order: 2, resources: [] },
    { id: "cat_strategic_professional", title: "🏆 Strategic Professional", parentId: "cat_acca", order: 3, resources: [] }
  ];

  const papers = [
    { id: "cat_f1", title: "📘 F1 - Business & Technology", parentId: "cat_applied_knowledge", code: "F1", order: 1 },
    { id: "cat_f2", title: "📗 F2 - Management Accounting", parentId: "cat_applied_knowledge", code: "F2", order: 2 },
    { id: "cat_f3", title: "📙 F3 - Financial Accounting", parentId: "cat_applied_knowledge", code: "F3", order: 3 },
    { id: "cat_f4", title: "📕 F4 - Corporate & Business Law", parentId: "cat_applied_knowledge", code: "F4", order: 4 },

    { id: "cat_f5", title: "📘 F5 - Performance Management", parentId: "cat_applied_skills", code: "F5", order: 1 },
    { id: "cat_f6", title: "📗 F6 - Taxation", parentId: "cat_applied_skills", code: "F6", order: 2 },
    { id: "cat_f7", title: "📙 F7 - Financial Reporting", parentId: "cat_applied_skills", code: "F7", order: 3 },
    { id: "cat_f8", title: "📕 F8 - Audit & Assurance", parentId: "cat_applied_skills", code: "F8", order: 4 },
    { id: "cat_f9", title: "📔 F9 - Financial Management", parentId: "cat_applied_skills", code: "F9", order: 5 },

    { id: "cat_sbl", title: "🏆 SBL - Strategic Business Leader", parentId: "cat_strategic_professional", code: "SBL", order: 1 },
    { id: "cat_sbr", title: "📊 SBR - Strategic Business Reporting", parentId: "cat_strategic_professional", code: "SBR", order: 2 },
    { id: "cat_p4", title: "📘 P4 - Advanced Financial Management", parentId: "cat_strategic_professional", code: "P4", order: 3 },
    { id: "cat_p5", title: "📗 P5 - Advanced Performance Management", parentId: "cat_strategic_professional", code: "P5", order: 4 },
    { id: "cat_p6", title: "📙 P6 - Advanced Taxation", parentId: "cat_strategic_professional", code: "P6", order: 5 },
    { id: "cat_p7", title: "📕 P7 - Advanced Audit & Assurance", parentId: "cat_strategic_professional", code: "P7", order: 6 },

    { id: "cat_cfa_l1", title: "📘 CFA Level 1", parentId: "cat_cfa", code: "CFA Level 1", order: 1 },
    { id: "cat_cfa_l2", title: "📊 CFA Level 2", parentId: "cat_cfa", code: "CFA Level 2", order: 2 },
    { id: "cat_cfa_l3", title: "🏆 CFA Level 3", parentId: "cat_cfa", code: "CFA Level 3", order: 3 }
  ];

  const categories = [...rootCategories, ...mainLevels];

  papers.forEach((paper) => {
    categories.push({
      id: paper.id,
      title: paper.title,
      parentId: paper.parentId,
      order: paper.order,
      resources: []
    });

    const code = paper.code;

    categories.push({
      id: `${paper.id}_channels`,
      title: `📊 Telegram Channels: ${code}`,
      parentId: paper.id,
      order: 1,
      resources: [
        {
          id: `res_${paper.id}_ch1`,
          title: `📢 ${code} Telegram Channel`,
          type: "link",
          value: "https://t.me/acca_materials_official",
          description: `${code} rasmiy Telegram kanali`
        }
      ]
    });

    categories.push({
      id: `${paper.id}_books`,
      title: `📗 ${code} Study Books`,
      parentId: paper.id,
      order: 2,
      resources: [
        {
          id: `res_${paper.id}_b1`,
          title: `📖 ${code} Kaplan Study Text & Revision Kit`,
          type: "link",
          value: "https://t.me/acca_materials_official",
          description: `${code} Kaplan va BPP kitoblari`
        }
      ]
    });

    categories.push({
      id: `${paper.id}_videos`,
      title: `🎥 Video Lessons for ${code}`,
      parentId: paper.id,
      order: 3,
      resources: [
        {
          id: `res_${paper.id}_v1`,
          title: `🎥 ${code} Complete Video Course`,
          type: "link",
          value: "https://youtube.com",
          description: `${code} videodarsliklar to'plami`
        }
      ]
    });

    categories.push({
      id: `${paper.id}_youtube`,
      title: `🔍 YouTube Channels : ${code}`,
      parentId: paper.id,
      order: 4,
      resources: [
        {
          id: `res_${paper.id}_yt1`,
          title: `🔍 ${code} YouTube Channel`,
          type: "link",
          value: "https://youtube.com",
          description: `${code} faniga bag'ishlangan YouTube kanallar`
        }
      ]
    });
  });

  return {
    settings: {
      bot_token: "8723520559:AAFM108x6EzYIMg_bsHtLShCEwCZKj3gb50",
      admin_password: "admin",
      webhook_url: ""
    },
    subscribers: [
      {
        id: 557976703,
        first_name: "Ahmadillo",
        last_name: "Ibrohimov",
        username: "Ibrohimov_Ahmadillo",
        joined_at: "2026-07-27T12:00:09.564Z"
      }
    ],
    categories: categories,
    feedback_messages: []
  };
}

function getDb() {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      const initialDb = generateFullMasterDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.categories || parsed.categories.length < 90) {
      const fullDb = generateFullMasterDb();
      if (parsed.settings && parsed.settings.bot_token) {
        fullDb.settings.bot_token = parsed.settings.bot_token;
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(fullDb, null, 2));
      return fullDb;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB:', err);
    return generateFullMasterDb();
  }
}

function saveDb(db) {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// --- Telegram Bot Engine ---
let bot = null;
let currentBotToken = "";
let userStates = {};

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
        if (res.type === 'file_path' || res.type === 'file') {
          const localPath = path.join(__dirname, 'public', res.value);
          if (fs.existsSync(localPath)) {
            bot.sendMessage(chatId, `📄 <b>${res.title}</b> fayli yuborilmoqda...`, { parse_mode: 'HTML' });
            bot.sendDocument(chatId, localPath, { caption: res.description || res.title }).catch(err => {
              bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.description || ''}\n🔗 ${res.value}`);
            });
          } else {
            bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.description || ''}\n🔗 ${res.value}`);
          }
        } else if (res.type === 'link') {
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

// --- Direct File Upload API (Base64/File Upload) ---
app.post('/api/upload', (req, res) => {
  const { fileName, fileData } = req.body; // base64 encoded
  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Fayl nomi yoki ma'lumoti yetishmayapti" });
  }

  try {
    const cleanFileName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    
    // Remove base64 header if present
    const base64Content = fileData.replace(/^data:.*?;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));

    const fileUrl = `/uploads/${cleanFileName}`;
    res.json({ success: true, fileUrl, fileName: cleanFileName });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: "Fayl yuklashda xatolik yuz berdi" });
  }
});

// --- API Endpoints ---
app.get('/api/data', (req, res) => {
  res.json(getDb());
});

app.post('/api/admin/restore-full-db', (req, res) => {
  const fullDb = generateFullMasterDb();
  const currentDb = getDb();
  if (currentDb.settings && currentDb.settings.bot_token) {
    fullDb.settings.bot_token = currentDb.settings.bot_token;
  }
  saveDb(fullDb);
  initBot();
  res.json({ success: true, message: "Baza to'liq 96 ta papkalar bilan yangilandi!", categoriesCount: fullDb.categories.length });
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

app.put('/api/categories/:catId/resources/:resId', (req, res) => {
  const { catId, resId } = req.params;
  const { title, type, value, description } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  const resItem = (cat.resources || []).find(r => r.id === resId);
  if (!resItem) return res.status(404).json({ error: "Resurs topilmadi" });

  if (title !== undefined) resItem.title = title;
  if (type !== undefined) resItem.type = type;
  if (value !== undefined) resItem.value = value;
  if (description !== undefined) resItem.description = description;

  saveDb(db);
  res.json({ success: true, resource: resItem });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === id);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  if (title !== undefined) cat.title = title;

  saveDb(db);
  res.json({ success: true, category: cat });
});

app.post('/api/categories/:catId/resources/batch', (req, res) => {
  const { catId } = req.params;
  const { items } = req.body;
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

app.delete('/api/categories/:catId/resources/:resId', (req, res) => {
  const { catId, resId } = req.params;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Kategoriya topilmadi" });

  cat.resources = (cat.resources || []).filter(r => r.id !== resId);
  saveDb(db);
  res.json({ success: true });
});

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
