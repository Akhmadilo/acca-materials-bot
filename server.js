const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- Full Master Database Generator (100% English) ---
function generateFullMasterDb() {
  const rootCategories = [
    { id: "cat_acca", title: "🔴 ACCA 🔴", parentId: null, order: 1, resources: [] },
    { id: "cat_cfa", title: "📊 CFA Exam", parentId: null, order: 2, resources: [] },
    { id: "cat_feedback", title: "💬 Feedback & Support", parentId: null, order: 3, resources: [], isFeedback: true }
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
          value: "https://t.me/Finance_Ahmadillo",
          description: `${code} official Telegram channels & discussion groups`
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
          value: "https://t.me/Finance_Ahmadillo",
          description: `${code} Kaplan & BPP latest exam kits and textbooks`
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
          description: `${code} comprehensive lecture series`
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
          description: `${code} recommended YouTube tutorial channels`
        }
      ]
    });
  });

  return {
    settings: {
      bot_token: "8723520559:AAFM108x6EzYIMg_bsHtLShCEwCZKj3gb50",
      admin_password: "admin",
      admin_ids: [557976703, "Ibrohimov_Ahmadillo"],
      required_channel: "@Finance_Ahmadillo",
      required_channel_link: "https://t.me/Finance_Ahmadillo",
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

const FORCE_CHANNEL_USERNAME = "@Finance_Ahmadillo";
const FORCE_CHANNEL_LINK = "https://t.me/Finance_Ahmadillo";

function initBot() {
  const db = getDb();
  const token = db.settings.bot_token || process.env.BOT_TOKEN;

  if (!token) {
    console.log('⚠️ Telegram Bot token not configured yet.');
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

    bot.on('polling_error', (error) => {
      if (error && error.message && error.message.includes('409 Conflict')) {
        return;
      }
      console.log('Bot polling error:', error.message);
    });

    console.log('🚀 Telegram Bot started successfully!');

    setupBotHandlers();
  } catch (error) {
    console.error('❌ Error starting Bot:', error.message);
  }
}

function setupBotHandlers() {
  if (!bot) return;

  function isUserAdmin(msg) {
    const db = getDb();
    const chatId = msg.chat ? msg.chat.id : (msg.from ? msg.from.id : null);
    const username = msg.from ? (msg.from.username || '') : '';

    if (chatId === 557976703 || username.toLowerCase() === 'ibrohimov_ahmadillo') return true;

    const adminIds = db.settings.admin_ids || [557976703, "Ibrohimov_Ahmadillo"];
    return adminIds.includes(chatId) || adminIds.includes(username);
  }

  async function isUserSubscribedToChannel(userId) {
    try {
      const member = await bot.getChatMember(FORCE_CHANNEL_USERNAME, userId);
      return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (err) {
      console.log('Force sub check API info (Make sure @finance_information_bot is added as Administrator to @Finance_Ahmadillo):', err.message);
      // If Telegram API returns error (e.g. bot not admin in channel yet), grant temporary access so users are not blocked!
      return true;
    }
  }

  function sendForceSubMessage(chatId) {
    bot.sendMessage(chatId, `⛔ <b>KIRISH CHEKLANGAN! / ACCESS RESTRICTED!</b>\n\n` +
                            `📢 Bot va kitoblardan foydalanish uchun <b>AVVAL KANALIMIZGA A'ZO BO'LING</b>:\n\n` +
                            `👉 <b>${FORCE_CHANNEL_LINK}</b>\n\n` +
                            `Kanalga a'zo bo'lmasdan turib botdan foydalanib bo'lmaydi. Qo'shilgach <b>"✅ A'zo Bo'ldim (Tekshirish)"</b> tugmasini bosing:`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Kanalga A\'zo Bo\'lish (Join Channel)', url: FORCE_CHANNEL_LINK }],
          [{ text: '✅ A\'zo Bo\'ldim (Tekshirish)', callback_data: 'check_sub_status' }]
        ]
      }
    });
  }

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

  function getKeyboardForCategory(parentId = null, msg = null) {
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

    if (parentId === null && msg && isUserAdmin(msg)) {
      keyboard.push([{ text: '⚡ Admin Batch Mode' }, { text: '📤 Direct Upload' }]);
    }

    if (parentId !== null) {
      keyboard.push([{ text: '🏠 Main Menu' }, { text: '🔙 Go Back' }]);
    }

    return {
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true
      }
    };
  }

  // --- /start Command ---
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    addSubscriber(msg);
    if (!userStates[chatId]) userStates[chatId] = {};
    userStates[chatId].currentParentId = null;
    userStates[chatId].feedbackMode = false;

    const isAdmin = isUserAdmin(msg);

    // STRICT LOCKDOWN Force Sub Check for Non-Admins
    if (!isAdmin) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) {
        sendForceSubMessage(chatId);
        return;
      }
    } else {
      userStates[chatId].isAdmin = true;
    }

    const welcomeText = `✨ Hello, <b>${msg.from.first_name || 'Member'}</b>!\n\n` +
                        `🎓 Welcome to the <b>ACCA & CFA Professional Resource Portal</b>.\n` +
                        `${isAdmin ? `\n👑 <b>System Administrator Mode Active!</b>\nSend any PDF textbook, video, link, or drop 10-50 files at once!\n` : ''}\n` +
                        `📢 Official Channel: <b>${FORCE_CHANNEL_LINK}</b>\n` +
                        `🔍 <i>Tip: Type any paper code (e.g. F1, F5, CFA) or textbook name anytime to search instantly!</i>\n\n` +
                        `👇 Select a category below:`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      ...getKeyboardForCategory(null, msg)
    });
  });

  // --- /search Command ---
  bot.onText(/\/search(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isUserAdmin(msg)) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) { sendForceSubMessage(chatId); return; }
    }

    const query = match[1] ? match[1].trim().toLowerCase() : "";
    if (!query) {
      bot.sendMessage(chatId, "🔍 Please enter search query. Example: <code>/search F1</code> or <code>/search Kaplan</code>", { parse_mode: 'HTML' });
      return;
    }
    performSearch(chatId, query, msg);
  });

  function performSearch(chatId, query, msg) {
    const db = getDb();
    const results = [];

    db.categories.forEach(cat => {
      if (cat.resources) {
        cat.resources.forEach(r => {
          if (r.title.toLowerCase().includes(query) || (r.description && r.description.toLowerCase().includes(query)) || (cat.title && cat.title.toLowerCase().includes(query))) {
            results.push({ resource: r, folder: cat });
          }
        });
      }
    });

    if (results.length === 0) {
      bot.sendMessage(chatId, `🔍 No study resources found matching "<b>${query}</b>".`, { parse_mode: 'HTML' });
      return;
    }

    let text = `🔍 <b>Search Results for "${query}" (${results.length} found):</b>\n\n`;
    results.slice(0, 15).forEach((item, index) => {
      text += `<b>${index + 1}. ${item.resource.title}</b>\n`;
      text += `📁 Folder: <i>${item.folder.title}</i>\n`;
      if (item.resource.value.startsWith('http')) {
        text += `🔗 Link: ${item.resource.value}\n\n`;
      } else {
        text += `📄 File Available\n\n`;
      }
    });

    const keyboard = results.slice(0, 10).map(item => [{ text: item.resource.title }]);
    keyboard.push([{ text: '🏠 Main Menu' }]);

    bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true
      }
    });
  }

  // --- /admin Login Command ---
  bot.onText(/\/admin(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const inputPass = match[1] ? match[1].trim() : "";
    const db = getDb();
    const realPass = db.settings.admin_password || "admin";

    if (!userStates[chatId]) userStates[chatId] = {};

    if (isUserAdmin(msg) || inputPass === realPass || inputPass === "admin") {
      userStates[chatId].isAdmin = true;
      bot.sendMessage(chatId, `👑 <b>ADMINISTRATOR MODE ACTIVE!</b>\n\n` +
                              `⚡ <b>Quick Controls:</b>\n` +
                              `1️⃣ <b>Batch Upload (10-50 Files at Once):</b> Tap /batch\n` +
                              `2️⃣ <b>Single File / Link Upload:</b> Send any link or PDF into chat!\n` +
                              `3️⃣ <b>Web Admin Panel:</b> https://acca-materials-bot.onrender.com\n\n` +
                              `📥 Drop your study materials anytime!`, { parse_mode: 'HTML', ...getKeyboardForCategory(null, msg) });
    } else {
      bot.sendMessage(chatId, `🔐 Please enter the admin password:\n\nFormat: <code>/admin admin</code>`, { parse_mode: 'HTML' });
    }
  });

  // --- /batch Command ---
  bot.onText(/\/batch|⚡ Admin Batch Mode/, (msg) => {
    const chatId = msg.chat.id;
    const db = getDb();
    if (!userStates[chatId]) userStates[chatId] = {};
    const state = userStates[chatId];

    if (!isUserAdmin(msg) && !state.isAdmin) {
      bot.sendMessage(chatId, `🔐 Administrator access required.`);
      return;
    }

    const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa'));
    const inlineKeyboard = [];

    for (let i = 0; i < paperCats.length; i += 2) {
      const row = [{ text: paperCats[i].title, callback_data: `batch_select_paper_${paperCats[i].id}` }];
      if (paperCats[i + 1]) {
        row.push({ text: paperCats[i + 1].title, callback_data: `batch_select_paper_${paperCats[i + 1].id}` });
      }
      inlineKeyboard.push(row);
    }

    bot.sendMessage(chatId, `⚡ <b>TELEGRAM BATCH UPLOAD MODE</b>\n\n` +
                            `1️⃣ Choose target subject paper below (e.g. 📘 F1, F5, CFA L1):\n` +
                            `2️⃣ Next, select 10-50 files/textbooks at once in Telegram and send them all together!\n` +
                            `All files will be saved automatically without extra prompts!`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  });

  // --- /done Command ---
  bot.onText(/\/done/, (msg) => {
    const chatId = msg.chat.id;
    if (!userStates[chatId]) userStates[chatId] = {};
    const count = userStates[chatId].batchSavedCount || 0;
    userStates[chatId].batchTargetFolderId = null;
    userStates[chatId].batchSavedCount = 0;

    bot.sendMessage(chatId, `🎉 <b>Batch Upload Completed!</b>\n\nTotal <b>${count} items</b> successfully published to the database!`, { parse_mode: 'HTML' });
  });

  // --- Direct File / Document Upload Handler inside Telegram ---
  bot.on('document', async (msg) => {
    if (!isUserAdmin(msg)) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) { sendForceSubMessage(msg.chat.id); return; }
    }
    handleIncomingMedia(msg, 'file_id', msg.document.file_id, msg.document.file_name || 'Study Resource PDF');
  });

  bot.on('video', async (msg) => {
    if (!isUserAdmin(msg)) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) { sendForceSubMessage(msg.chat.id); return; }
    }
    handleIncomingMedia(msg, 'file_id', msg.video.file_id, 'Video Lesson');
  });

  bot.on('photo', async (msg) => {
    if (!isUserAdmin(msg)) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) { sendForceSubMessage(msg.chat.id); return; }
    }
    const photo = msg.photo[msg.photo.length - 1];
    handleIncomingMedia(msg, 'file_id', photo.file_id, 'Study Notes / Image');
  });

  function handleIncomingMedia(msg, type, value, defaultTitle) {
    const chatId = msg.chat.id;
    const db = getDb();
    if (!userStates[chatId]) userStates[chatId] = {};
    const state = userStates[chatId];
    const isAdmin = isUserAdmin(msg) || state.isAdmin;

    if (!isAdmin) {
      bot.sendMessage(chatId, `ℹ️ Document received. Administrator privileges required to publish resources.`);
      return;
    }

    const title = msg.caption || defaultTitle;

    if (state.batchTargetFolderId) {
      const cat = db.categories.find(c => c.id === state.batchTargetFolderId);
      if (cat) {
        if (!cat.resources) cat.resources = [];
        const newRes = {
          id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
          title: title,
          type: type,
          value: value,
          description: "Uploaded via Telegram Admin Direct Upload"
        };
        cat.resources.push(newRes);
        saveDb(db);

        state.batchSavedCount = (state.batchSavedCount || 0) + 1;
        bot.sendMessage(chatId, `✅ <b>[${state.batchSavedCount}] "${title}"</b> -> saved to <b>${cat.title}</b>!`, { parse_mode: 'HTML' });
        return;
      }
    }

    state.pendingUpload = { type, value, title };

    const inlineKeyboard = [];
    const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa'));

    for (let i = 0; i < paperCats.length; i += 2) {
      const row = [{ text: paperCats[i].title, callback_data: `select_paper_${paperCats[i].id}` }];
      if (paperCats[i + 1]) {
        row.push({ text: paperCats[i + 1].title, callback_data: `select_paper_${paperCats[i + 1].id}` });
      }
      inlineKeyboard.push(row);
    }

    bot.sendMessage(chatId, `📥 <b>Resource Received:</b>\n"<i>${title}</i>"\n\n👇 <b>Select target subject paper:</b>`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  }

  // --- Callback Query Listener ---
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const db = getDb();
    if (!userStates[chatId]) userStates[chatId] = {};
    const state = userStates[chatId];

    if (data === 'check_sub_status') {
      const isSubbed = await isUserSubscribedToChannel(chatId);
      if (isSubbed) {
        bot.editMessageText(`🎉 <b>Rahmat! A'zoligingiz tasdiqlandi / Access Granted!</b>\n\nACCA & CFA resurslar portaliga xush kelibsiz. Ishga tushirish uchun /start deb yozing!`, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'HTML'
        });
      } else {
        bot.answerCallbackQuery(query.id, { text: "⚠️ Siz hali https://t.me/Finance_Ahmadillo kanaliga a'zo bo'lmadingiz! Avval a'zo bo'ling.", show_alert: true });
      }
      return;
    }

    // STRICT LOCKDOWN: Check sub for any other callback query
    if (!isUserAdmin(query)) {
      const isSubbed = await isUserSubscribedToChannel(query.from.id);
      if (!isSubbed) {
        sendForceSubMessage(chatId);
        bot.answerCallbackQuery(query.id, { text: "⚠️ Avval @Finance_Ahmadillo kanaliga a'zo bo'ling!", show_alert: true });
        return;
      }
    }

    if (data.startsWith('batch_select_paper_')) {
      const paperId = data.replace('batch_select_paper_', '');
      const subFolders = db.categories.filter(c => c.parentId === paperId);

      const inlineKeyboard = subFolders.map(sf => [{ text: sf.title, callback_data: `set_batch_target_${sf.id}` }]);

      bot.editMessageText(`⚡ <b>Select subfolder for batch upload:</b>`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('set_batch_target_')) {
      const folderId = data.replace('set_batch_target_', '');
      const cat = db.categories.find(c => c.id === folderId);
      state.batchTargetFolderId = folderId;
      state.batchSavedCount = 0;

      bot.editMessageText(`⚡ <b>BATCH MODE ACTIVE!</b>\n\n` +
                         `📁 <b>Target Folder:</b> ${cat ? cat.title : folderId}\n\n` +
                         `📥 Drop 10-50 files at once into Telegram now! All items will be saved directly into this folder.\n\n` +
                         `🔴 Type /done when finished.`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML'
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('select_paper_')) {
      const paperId = data.replace('select_paper_', '');
      const subFolders = db.categories.filter(c => c.parentId === paperId);

      if (subFolders.length === 0) {
        saveResourceToDb(chatId, paperId);
        bot.answerCallbackQuery(query.id);
        return;
      }

      const inlineKeyboard = subFolders.map(sf => [{ text: sf.title, callback_data: `save_to_${sf.id}` }]);

      bot.editMessageText(`📁 <b>Select exact subfolder:</b>`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('save_to_')) {
      const folderId = data.replace('save_to_', '');
      saveResourceToDb(chatId, folderId, query.message.message_id);
      bot.answerCallbackQuery(query.id);
    }
  });

  function saveResourceToDb(chatId, folderId, messageId = null) {
    const db = getDb();
    const state = userStates[chatId];
    if (!state.pendingUpload) return;

    const cat = db.categories.find(c => c.id === folderId);
    if (!cat) return;

    if (!cat.resources) cat.resources = [];

    const newRes = {
      id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title: state.pendingUpload.title,
      type: state.pendingUpload.type,
      value: state.pendingUpload.value,
      description: "Directly published via Telegram Admin Mode"
    };

    cat.resources.push(newRes);
    saveDb(db);

    const successMsg = `✅ <b>RESOURCE PUBLISHED SUCCESSFULLY!</b> 🎉\n\n` +
                       `📁 <b>Folder:</b> ${cat.title}\n` +
                       `📖 <b>Resource:</b> ${newRes.title}\n\n` +
                       `✨ Live across all Telegram subscribers & Web Admin Panel!`;

    if (messageId) {
      bot.editMessageText(successMsg, { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' });
    } else {
      bot.sendMessage(chatId, successMsg, { parse_mode: 'HTML' });
    }

    state.pendingUpload = null;
  }

  // --- Main Message Listener ---
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    addSubscriber(msg);

    if (!userStates[chatId]) {
      userStates[chatId] = { currentParentId: null, feedbackMode: false };
    }

    const state = userStates[chatId];
    const db = getDb();

    // STRICT LOCKDOWN: Force Sub Check for Non-Admins
    if (!isUserAdmin(msg)) {
      const isSubbed = await isUserSubscribedToChannel(msg.from.id);
      if (!isSubbed) {
        sendForceSubMessage(chatId);
        return;
      }
    }

    // --- Instant URL / Link Interceptor for Admin ---
    if (isUserAdmin(msg) && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('t.me/') || text.startsWith('www.') || text.startsWith('@'))) {
      handleIncomingMedia(msg, 'link', text, 'Study Link / Resource');
      return;
    }

    if (text === '🏠 Main Menu') {
      state.currentParentId = null;
      bot.sendMessage(chatId, "🏠 <b>Main Menu:</b>", {
        parse_mode: 'HTML',
        ...getKeyboardForCategory(null, msg)
      });
      return;
    }

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
      bot.sendMessage(chatId, "✅ Thank you for your feedback! Your message has been delivered to the administrator.", getKeyboardForCategory(state.currentParentId, msg));
      return;
    }

    if (text === '🔙 Go Back' || text === 'Orqaga' || text === '/back') {
      if (state.currentParentId) {
        const currentCat = db.categories.find(c => c.id === state.currentParentId);
        state.currentParentId = currentCat ? currentCat.parentId : null;
      } else {
        state.currentParentId = null;
      }

      bot.sendMessage(chatId, "📁 Menu:", getKeyboardForCategory(state.currentParentId, msg));
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
        bot.sendMessage(chatId, "💬 Please enter your feedback, suggestions, or questions:");
        return;
      }

      const subcategories = db.categories.filter(c => c.parentId === matchedCategory.id);

      if (subcategories.length > 0) {
        state.currentParentId = matchedCategory.id;
        bot.sendMessage(chatId, `📁 <b>${matchedCategory.title}</b> section:`, {
          parse_mode: 'HTML',
          ...getKeyboardForCategory(matchedCategory.id, msg)
        });
        return;
      }

      const resources = matchedCategory.resources || [];
      if (resources.length > 0) {
        const resKeyboard = resources.map(r => [{ text: r.title }]);
        resKeyboard.push([{ text: '🏠 Main Menu' }, { text: '🔙 Go Back' }]);

        bot.sendMessage(chatId, `📚 <b>${matchedCategory.title}</b> available study materials:`, {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: resKeyboard,
            resize_keyboard: true
          }
        });
        return;
      } else {
        bot.sendMessage(chatId, `ℹ️ No study materials uploaded yet under <b>${matchedCategory.title}</b>. Uploads coming soon!`, {
          parse_mode: 'HTML',
          ...getKeyboardForCategory(state.currentParentId, msg)
        });
        return;
      }
    }

    // Direct Resource Item Click
    for (const cat of db.categories) {
      const res = (cat.resources || []).find(r => r.title.trim().toLowerCase() === text.toLowerCase());
      if (res) {
        if (res.type === 'file_path' || res.type === 'file') {
          const localPath = path.join(__dirname, 'public', res.value);
          if (fs.existsSync(localPath)) {
            bot.sendMessage(chatId, `📄 Sending <b>${res.title}</b>...`, { parse_mode: 'HTML' });
            bot.sendDocument(chatId, localPath, { caption: res.description || res.title }).catch(err => {
              bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.description || ''}\n🔗 ${res.value}`);
            });
          } else {
            bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.description || ''}\n🔗 ${res.value}`);
          }
        } else if (res.type === 'link') {
          const content = `<b>${res.title}</b>\n\n` +
                          `${res.description ? res.description + '\n\n' : ''}` +
                          `🔗 <b>Link:</b> ${res.value}`;
          bot.sendMessage(chatId, content, { parse_mode: 'HTML' });
        } else if (res.type === 'file_id') {
          bot.sendMessage(chatId, `📄 Sending <b>${res.title}</b>...`, { parse_mode: 'HTML' });
          bot.sendDocument(chatId, res.value, { caption: res.description || res.title }).catch(err => {
            bot.sendMessage(chatId, `❌ Error sending file: ${res.value}`);
          });
        } else {
          bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.value}`, { parse_mode: 'HTML' });
        }
        return;
      }
    }

    // Fallback: Perform instant query search across entire database!
    performSearch(chatId, text.toLowerCase(), msg);
  });
}

// --- Direct File Upload API ---
app.post('/api/upload', (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Missing filename or file payload" });
  }

  try {
    const cleanFileName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    
    const base64Content = fileData.replace(/^data:.*?;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));

    const fileUrl = `/uploads/${cleanFileName}`;
    res.json({ success: true, fileUrl, fileName: cleanFileName });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: "File upload failed" });
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
  res.json({ success: true, message: "Database restored with all 96 master categories!", categoriesCount: fullDb.categories.length });
});

app.get('/api/admin/export-db', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=db.json');
  res.send(JSON.stringify(getDb(), null, 2));
});

app.post('/api/settings', (req, res) => {
  const { bot_token, admin_password } = req.body;
  const db = getDb();
  if (bot_token !== undefined) db.settings.bot_token = bot_token;
  if (admin_password !== undefined) db.settings.admin_password = admin_password;
  saveDb(db);
  initBot();
  res.json({ success: true, message: "Settings updated successfully!" });
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
  if (!cat) return res.status(404).json({ error: "Category not found" });

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
  if (!cat) return res.status(404).json({ error: "Category not found" });

  const resItem = (cat.resources || []).find(r => r.id === resId);
  if (!resItem) return res.status(404).json({ error: "Resource not found" });

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
  if (!cat) return res.status(404).json({ error: "Category not found" });

  if (title !== undefined) cat.title = title;

  saveDb(db);
  res.json({ success: true, category: cat });
});

app.post('/api/categories/:catId/resources/batch', (req, res) => {
  const { catId } = req.params;
  const { items } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Category not found" });

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

app.post('/api/resources/move', (req, res) => {
  const { resourceIds, targetCatId } = req.body;
  const db = getDb();

  if (!targetCatId || !Array.isArray(resourceIds) || resourceIds.length === 0) {
    return res.status(400).json({ error: "Target category and resource IDs required" });
  }

  const targetCat = db.categories.find(c => c.id === targetCatId);
  if (!targetCat) return res.status(404).json({ error: "Target category not found" });

  if (!targetCat.resources) targetCat.resources = [];

  let movedCount = 0;

  db.categories.forEach(cat => {
    if (cat.resources && cat.id !== targetCatId) {
      const remaining = [];
      cat.resources.forEach(r => {
        if (resourceIds.includes(r.id)) {
          targetCat.resources.push(r);
          movedCount++;
        } else {
          remaining.push(r);
        }
      });
      cat.resources = remaining;
    }
  });

  saveDb(db);
  res.json({ success: true, movedCount });
});

app.delete('/api/categories/:catId/resources/:resId', (req, res) => {
  const { catId, resId } = req.params;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Category not found" });

  cat.resources = (cat.resources || []).filter(r => r.id !== resId);
  saveDb(db);
  res.json({ success: true });
});

app.post('/api/broadcast', async (req, res) => {
  const { message } = req.body;
  const db = getDb();

  if (!bot) {
    return res.status(400).json({ error: "Bot Token not configured." });
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

app.get('/', (req, res) => {
  const pRoot = path.join(__dirname, 'index.html');
  const pPublic = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(pRoot)) res.sendFile(pRoot);
  else if (fs.existsSync(pPublic)) res.sendFile(pPublic);
  else res.send('ACCA Materials Bot Server Active');
});

app.get('/ping', (req, res) => {
  res.send('PONG - 24/7 Alive');
});

app.listen(PORT, () => {
  console.log(`🌐 Web Admin Panel server running: http://localhost:${PORT}`);
  initBot();
});
