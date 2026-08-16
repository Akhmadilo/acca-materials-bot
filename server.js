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

// --- Full Master Database Generator (ACCA, CFA, Analytics, 1C, Financial Modeling) ---
function generateFullMasterDb() {
  const rootCategories = [
    { id: "cat_acca", title: "🔴 ACCA 🔴", parentId: null, order: 1, resources: [] },
    { id: "cat_cfa", title: "📊 CFA Exam", parentId: null, order: 2, resources: [] },
    { id: "cat_analytics", title: "📈 Data Analytics & BI", parentId: null, order: 3, resources: [] },
    { id: "cat_national_1c", title: "🇺🇿 Milliy Buxgalteriya va 1C", parentId: null, order: 4, resources: [] },
    { id: "cat_fin_modeling", title: "💼 Financial Modeling & Corporate Finance", parentId: null, order: 5, resources: [] },
    { id: "cat_economics", title: "📚 Economics", parentId: null, order: 6, resources: [] },
    { id: "cat_feedback", title: "💬 Feedback", parentId: null, order: 7, resources: [], isFeedback: true }
  ];

  const mainLevels = [
    // ACCA
    { id: "cat_applied_knowledge", title: "📘 Applied Knowledge", parentId: "cat_acca", order: 1, resources: [] },
    { id: "cat_applied_skills", title: "📊 Applied Skills", parentId: "cat_acca", order: 2, resources: [] },
    { id: "cat_strategic_professional", title: "🏆 Strategic Professional", parentId: "cat_acca", order: 3, resources: [] },

    // Data Analytics
    { id: "cat_analytics_excel", title: "📊 Advanced Financial Excel & Dashboards", parentId: "cat_analytics", order: 1, resources: [] },
    { id: "cat_analytics_powerbi", title: "📈 Power BI & Tableau for Finance", parentId: "cat_analytics", order: 2, resources: [] },
    { id: "cat_analytics_python", title: "🐍 Python for Finance & Data Analysis", parentId: "cat_analytics", order: 3, resources: [] },
    { id: "cat_analytics_sql", title: "🗄️ SQL & Financial Databases", parentId: "cat_analytics", order: 4, resources: [] },

    // Milliy Buxgalteriya va 1C
    { id: "cat_1c_enterprise", title: "💻 1C: Buxgalteriya & 1C Enterprise 8.3", parentId: "cat_national_1c", order: 1, resources: [] },
    { id: "cat_bhms_standards", title: "📜 BHMS (Buxgalteriya Hisobining Milliy Standartlari)", parentId: "cat_national_1c", order: 2, resources: [] },
    { id: "cat_tax_reporting", title: "🏛️ Soliqlar va Hisobotlar (Tax Code & Declarations)", parentId: "cat_national_1c", order: 3, resources: [] },
    { id: "cat_ifrs_national", title: "📑 MHXS / IFRS Milliy Amaliyotda", parentId: "cat_national_1c", order: 4, resources: [] },

    // Financial Modeling & Corporate Finance
    { id: "cat_fm_excel", title: "📊 Excel Financial Modeling (DCF, LBO, Budgeting)", parentId: "cat_fin_modeling", order: 1, resources: [] },
    { id: "cat_fm_valuation", title: "💎 Business Valuation & Corporate Finance", parentId: "cat_fin_modeling", order: 2, resources: [] },
    { id: "cat_fm_banking", title: "🏢 Banking, Credit Analysis & Risk", parentId: "cat_fin_modeling", order: 3, resources: [] },

    // Economics
    { id: "cat_econ_micro", title: "📊 Microeconomics", parentId: "cat_economics", order: 1, resources: [] },
    { id: "cat_econ_macro", title: "🌍 Macroeconomics", parentId: "cat_economics", order: 2, resources: [] },
    { id: "cat_econ_international", title: "🌐 International Economics & Trade", parentId: "cat_economics", order: 3, resources: [] },
    { id: "cat_econ_development", title: "📈 Development Economics", parentId: "cat_economics", order: 4, resources: [] },
    { id: "cat_econ_econometrics", title: "📉 Econometrics & Statistics", parentId: "cat_economics", order: 5, resources: [] },
    { id: "cat_econ_monetary", title: "🏦 Monetary & Financial Economics", parentId: "cat_economics", order: 6, resources: [] },
    { id: "cat_econ_public", title: "🏛️ Public Economics & Fiscal Policy", parentId: "cat_economics", order: 7, resources: [] },
    { id: "cat_econ_behavioral", title: "🧠 Behavioral Economics", parentId: "cat_economics", order: 8, resources: [] }
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

    // Real ACCA English YouTubers per paper
    const youtubeLinks = {
      'F1': [
        { title: '🎓 OpenTuition F1 Free Lectures', url: 'https://www.youtube.com/playlist?list=PLAz8MpXr4MInXlF0A-e8Srf_YZYxd5lM9', desc: 'OpenTuition complete F1 BT lecture series (FREE)' },
        { title: '📚 aCOWtancy F1 Tutorials', url: 'https://www.youtube.com/@aclowtancy', desc: 'aCOWtancy bite-size F1 Business & Technology videos' },
        { title: '🌍 ACCA Global Official', url: 'https://www.youtube.com/@ACCAOfficial', desc: 'Official ACCA YouTube channel with exam tips' }
      ],
      'F2': [
        { title: '🎓 OpenTuition F2 Free Lectures', url: 'https://www.youtube.com/playlist?list=PLAz8MpXr4MImjjWa_pxHH7xm-kj9Cvq9p', desc: 'OpenTuition complete F2 MA lecture series (FREE)' },
        { title: '📚 aCOWtancy F2 Tutorials', url: 'https://www.youtube.com/@aclowtancy', desc: 'aCOWtancy bite-size F2 Management Accounting' },
        { title: '📊 Accounting Stuff', url: 'https://www.youtube.com/@AccountingStuff', desc: 'Clear accounting explanations for beginners' }
      ],
      'F3': [
        { title: '🎓 OpenTuition F3 Free Lectures', url: 'https://www.youtube.com/playlist?list=PLAz8MpXr4MImvRNF-_7lYJTzlXZelVWyS', desc: 'OpenTuition complete F3 FA lecture series (FREE)' },
        { title: '📚 aCOWtancy F3 Tutorials', url: 'https://www.youtube.com/@aclowtancy', desc: 'aCOWtancy bite-size F3 Financial Accounting' },
        { title: '📊 The Finance Storyteller', url: 'https://www.youtube.com/@TheFinanceStoryteller', desc: 'Finance concepts explained through stories' }
      ],
      'default': [
        { title: '🎓 OpenTuition ACCA Lectures', url: 'https://www.youtube.com/@OpenTuition', desc: 'OpenTuition FREE ACCA lecture series for all papers' },
        { title: '📚 aCOWtancy ACCA', url: 'https://www.youtube.com/@aclowtancy', desc: 'aCOWtancy bite-size ACCA tutorial videos' },
        { title: '🌍 ACCA Global Official', url: 'https://www.youtube.com/@ACCAOfficial', desc: 'Official ACCA YouTube channel' },
        { title: '📊 Accounting Stuff', url: 'https://www.youtube.com/@AccountingStuff', desc: 'Clear accounting explanations' }
      ]
    };

    const ytLinks = youtubeLinks[code] || youtubeLinks['default'];
    
    categories.push({
      id: `${paper.id}_youtube`,
      title: `🔍 YouTube Channels : ${code}`,
      parentId: paper.id,
      order: 4,
      resources: ytLinks.map((yt, idx) => ({
        id: `res_${paper.id}_yt${idx + 1}`,
        title: yt.title,
        type: "link",
        value: yt.url,
        description: yt.desc
      }))
    });
  });

  return {
    settings: {
      bot_token: "8723520559:AAFM108x6EzYIMg_bsHtLShCEwCZKj3gb50",
      admin_password: "admin",
      admin_ids: [557976703, "Ibrohimov_Ahmadillo"],
      required_channels: [
        { username: "@Finance_Ahmadillo", title: "Finance Ahmadillo Channel", link: "https://t.me/Finance_Ahmadillo" }
      ],
      donation: {
        card_number: "8600 0000 0000 0000",
        card_holder: "Ahmadillo Ibrohimov",
        bank_name: "Uzcard / Humo",
        note: "Thank you for supporting the development of this learning portal!"
      },
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

let dbCache = null;

function getDb() {
  if (dbCache) return dbCache; // In-Memory Cache (Instant response for thousands of users)

  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      const initialDb = generateFullMasterDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
      dbCache = initialDb;
      return dbCache;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    
    // Ensure new root categories exist without wiping existing user resources!
    const fullMaster = generateFullMasterDb();
    let updated = false;

    fullMaster.categories.forEach(masterCat => {
      const exists = parsed.categories.find(c => c.id === masterCat.id);
      if (!exists) {
        parsed.categories.push(masterCat);
        updated = true;
      }
    });

    if (!parsed.settings.donation) {
      parsed.settings.donation = fullMaster.settings.donation;
      updated = true;
    }
    if (!parsed.settings.required_channels) {
      parsed.settings.required_channels = fullMaster.settings.required_channels;
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2));
    }

    dbCache = parsed;
    return dbCache;
  } catch (err) {
    console.error('Error reading DB:', err);
    dbCache = generateFullMasterDb();
    return dbCache;
  }
}

function saveDb(db) {
  try {
    dbCache = db; // Update cache instantly for blazing fast reads
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Async write to disk so we don't block the Node event loop (24/7 high concurrency safe)
    fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2)).catch(err => {
      console.error('Async write error:', err);
    });
  } catch (err) {
    console.error('Error saving DB:', err);
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

    try {
      bot.setMyCommands([
        { command: 'start', description: '🏠 Main Menu & Start Portal' },
        { command: 'exams', description: '📝 Take Mock Exams & Tests' },
        { command: 'search', description: '🔍 Search Textbooks & Materials' },
        { command: 'donate', description: '💳 Support & Donation Card' },
        { command: 'pack', description: '📦 Create Multi-Book Pack (10 books in 1 button)' },
        { command: 'batch', description: '⚡ Admin Batch Upload Mode' },
        { command: 'delete', description: '🗑️ Delete & Manage Resources in Telegram' }
      ]);
    } catch (err) {
      console.log('setMyCommands error:', err.message);
    }

    console.log('🚀 Telegram Bot started successfully!');

    setupBotHandlers();
  } catch (error) {
    console.error('❌ Error starting Bot:', error.message);
  }
}

function setupBotHandlers() {
  if (!bot) return;

  function isUserAdmin(msg) {
    if (!msg) return false;
    const db = getDb();
    const chatId = msg.chat ? msg.chat.id : (msg.from ? msg.from.id : (typeof msg === 'number' ? msg : null));
    const username = msg.from ? (msg.from.username || '') : (typeof msg === 'string' ? msg : '');
    const cleanUsername = username.replace('@', '').toLowerCase();

    if (chatId === 557976703 || cleanUsername === 'ibrohimov_ahmadillo') return true;

    const adminIds = db.settings.admin_ids || [557976703, "Ibrohimov_Ahmadillo"];
    return adminIds.some(admin => {
      if (typeof admin === 'number' && admin === chatId) return true;
      if (typeof admin === 'string' && admin.toString().replace('@', '').toLowerCase() === cleanUsername) return true;
      return false;
    });
  }

  async function getUnsubscribedChannels(userId) {
    const db = getDb();
    const channels = db.settings.required_channels || [
      { username: "@Finance_Ahmadillo", title: "Finance Ahmadillo Channel", link: "https://t.me/Finance_Ahmadillo" }
    ];

    const unSubbed = [];
    for (const ch of channels) {
      try {
        const u = ch.username.startsWith('@') ? ch.username : '@' + ch.username;
        const member = await bot.getChatMember(u, userId);
        if (!['creator', 'administrator', 'member'].includes(member.status)) {
          unSubbed.push(ch);
        }
      } catch (err) {
        console.log('Channel sub check info:', err.message);
      }
    }
    return unSubbed;
  }

  async function sendForceSubMessage(chatId, userId) {
    const unSubbed = await getUnsubscribedChannels(userId);
    const db = getDb();
    const channels = unSubbed.length > 0 ? unSubbed : (db.settings.required_channels || []);

    const inlineKeyboard = [];
    channels.forEach(ch => {
      const link = ch.link || (ch.username.startsWith('http') ? ch.username : `https://t.me/${ch.username.replace('@', '')}`);
      inlineKeyboard.push([{ text: `📢 ${ch.title || ch.username}`, url: link }]);
    });
    inlineKeyboard.push([{ text: '✅ I Have Joined (Verify)', callback_data: 'check_sub_status' }]);

    bot.sendMessage(chatId, `⛔ <b>ACCESS RESTRICTED!</b>\n\n` +
                            `📢 To access study materials, textbooks, and videos, <b>please join our official channel(s) first</b>:\n\n` +
                            `After joining, tap <b>"✅ I Have Joined (Verify)"</b> below:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
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
      .sort((a, b) => {
        if (a.isFeedback) return 1;
        if (b.isFeedback) return -1;
        return (a.order || 0) - (b.order || 0);
      });

    const keyboard = [];
    const normalCats = categories.filter(c => !c.isFeedback);

    // SIDE-BY-SIDE GRID LAYOUT (2 buttons per row)
    for (let i = 0; i < normalCats.length; i += 2) {
      const row = [{ text: normalCats[i].title }];
      if (normalCats[i + 1]) {
        row.push({ text: normalCats[i + 1].title });
      }
      keyboard.push(row);
    }

    if (parentId === null) {
      const extraRow = [{ text: '💳 Donation & Support' }];
      if (msg && isUserAdmin(msg)) {
        extraRow.push({ text: '⚡ Admin Batch Mode' });
      }
      keyboard.push(extraRow);
      keyboard.push([{ text: '📝 Mock Exams' }]);

      if (msg && isUserAdmin(msg)) {
        keyboard.push([{ text: '📦 Create Multi-Book Pack' }, { text: '🗑️ Delete Resources' }]);
      }

      const feedbackCat = categories.find(c => c.isFeedback);
      if (feedbackCat) {
        keyboard.push([{ text: feedbackCat.title }]);
      }
    } else {
      keyboard.push([{ text: '🏠 Main Menu' }, { text: '🔙 Go Back' }]);
    }

    return {
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true
      }
    };
  }

  async function sendSingleResource(chatId, res) {
    if (res.type === 'bundle' || (Array.isArray(res.items) && res.items.length > 0)) {
      bot.sendMessage(chatId, `📦 <b>Sending Resource Pack: "${res.title}" (${res.items.length} items)...</b>`, { parse_mode: 'HTML' });
      for (const subItem of res.items) {
        await sendSingleResource(chatId, subItem);
        await new Promise(r => setTimeout(r, 400));
      }
      return;
    }

    if (res.type === 'file_path' || res.type === 'file') {
      const localPath = path.join(__dirname, 'public', res.value);
      if (fs.existsSync(localPath)) {
        bot.sendMessage(chatId, `📄 Sending <b>${res.title}</b>...`, { parse_mode: 'HTML' });
        await bot.sendDocument(chatId, localPath, { caption: res.description || res.title }).catch(err => {
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
      await bot.sendDocument(chatId, res.value, { caption: res.description || res.title }).catch(err => {
        bot.sendMessage(chatId, `❌ Error sending file: ${res.value}`);
      });
    } else {
      bot.sendMessage(chatId, `📖 <b>${res.title}</b>\n\n${res.value}`, { parse_mode: 'HTML' });
    }
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
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) {
        sendForceSubMessage(chatId, msg.from.id);
        return;
      }
    } else {
      userStates[chatId].isAdmin = true;
    }

    const welcomeText = `✨ Hello, <b>${msg.from.first_name || 'Member'}</b>!\n\n` +
                        `🎓 Welcome to the <b>ACCA, CFA, Analytics & 1C Professional Resource Portal</b>.\n` +
                        `${isAdmin ? `\n👑 <b>System Administrator Mode Active!</b>\nSend any PDF textbook, video, link, or drop 10-50 files at once!\n` : ''}\n` +
                        `🔍 <i>Tip: Type any subject code (e.g. F1, F5, CFA, 1C, Python, Excel) anytime to search instantly!</i>\n\n` +
                        `👇 Select a category below:`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      ...getKeyboardForCategory(null, msg)
    });
  });

  // --- /donate Command & Donation Button Handler ---
  bot.onText(/\/donate|💳 Donation & Support/, (msg) => {
    const chatId = msg.chat.id;
    const db = getDb();
    const don = db.settings.donation || {
      card_number: "8600 0000 0000 0000",
      card_holder: "Ahmadillo Ibrohimov",
      bank_name: "Uzcard / Humo",
      note: "Thank you for supporting the development of this learning portal!"
    };

    const text = `💳 <b>PROJECT DONATION & SUPPORT</b>\n\n` +
                 `We appreciate your support for the ACCA & CFA Materials Learning Portal!\n\n` +
                 `💳 <b>Card Number:</b> <code>${don.card_number}</code> <i>(Tap to copy)</i>\n` +
                 `👤 <b>Cardholder Name:</b> ${don.card_holder}\n` +
                 `${don.bank_name ? `🏦 <b>Network / Bank:</b> ${don.bank_name}\n` : ''}\n` +
                 `✨ <i>${don.note || "Thank you for supporting the development of this learning portal!"}</i>`;

    bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });

  // --- /search Command ---
  bot.onText(/\/search(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isUserAdmin(msg)) {
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) { sendForceSubMessage(chatId, msg.from.id); return; }
    }

    const query = match[1] ? match[1].trim().toLowerCase() : "";
    if (!query) {
      bot.sendMessage(chatId, "🔍 Please enter search query. Example: <code>/search F1</code> or <code>/search 1C</code>", { parse_mode: 'HTML' });
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

  // --- /pack Command (Create Multi-Book Bundle Pack in Telegram) ---
  bot.onText(/\/pack|📦 Create Multi-Book Pack/, (msg) => {
    const chatId = msg.chat.id;
    if (!userStates[chatId]) userStates[chatId] = {};
    const state = userStates[chatId];

    if (!isUserAdmin(msg) && !state.isAdmin) {
      bot.sendMessage(chatId, `🔐 Administrator access required.`);
      return;
    }

    state.packStep = 'await_title';
    state.packItems = [];
    state.packTitle = null;
    state.packFolderId = null;

    bot.sendMessage(chatId, `📦 <b>TELEGRAM MULTI-BOOK PACK CREATOR</b>\n\n` +
                            `1️⃣ Please send the <b>title/name</b> for this Pack in chat (e.g. <i>"Kaplan F1 Complete Pack 2026"</i>):`, { parse_mode: 'HTML' });
  });

  // --- /delete Command (Delete / Manage Resources in Telegram) ---
  bot.onText(/\/delete|🗑️ Delete Resources/, (msg) => {
    const chatId = msg.chat.id;
    const db = getDb();
    if (!userStates[chatId]) userStates[chatId] = {};
    const state = userStates[chatId];

    if (!isUserAdmin(msg) && !state.isAdmin) {
      bot.sendMessage(chatId, `🔐 Administrator access required.`);
      return;
    }

    const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa' || c.parentId.includes('analytics') || c.parentId.includes('national')));
    const inlineKeyboard = [];

    for (let i = 0; i < paperCats.length; i += 2) {
      const row = [{ text: paperCats[i].title, callback_data: `del_paper_${paperCats[i].id}` }];
      if (paperCats[i + 1]) {
        row.push({ text: paperCats[i + 1].title, callback_data: `del_paper_${paperCats[i + 1].id}` });
      }
      inlineKeyboard.push(row);
    }

    bot.sendMessage(chatId, `🗑️ <b>TELEGRAM RESOURCE DELETION PORTAL</b>\n\n` +
                            `1️⃣ Choose folder / paper below to view & delete resources:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  });

  // --- /exams Command (Mock Exams) ---
  bot.onText(/\/exams/, (msg) => {
    const chatId = msg.chat.id;
    const db = getDb();
    
    if (!db.exams || db.exams.length === 0) {
      bot.sendMessage(chatId, `ℹ️ No Mock Exams are currently available. Check back later!`);
      return;
    }

    const validExams = db.exams.filter(e => e.questions && e.questions.length > 0);
    if (validExams.length === 0) {
      bot.sendMessage(chatId, `ℹ️ No Mock Exams are currently available. Check back later!`);
      return;
    }

    const inlineKeyboard = validExams.map(e => [{ text: `📝 ${e.title} (${e.duration} mins)`, callback_data: `start_exam_${e.id}` }]);

    bot.sendMessage(chatId, `📝 <b>AVAILABLE MOCK EXAMS</b>\n\nChoose an exam below to begin:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
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

    const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa' || c.parentId.includes('analytics') || c.parentId.includes('national')));
    const inlineKeyboard = [];

    for (let i = 0; i < paperCats.length; i += 2) {
      const row = [{ text: paperCats[i].title, callback_data: `batch_select_paper_${paperCats[i].id}` }];
      if (paperCats[i + 1]) {
        row.push({ text: paperCats[i + 1].title, callback_data: `batch_select_paper_${paperCats[i + 1].id}` });
      }
      inlineKeyboard.push(row);
    }

    bot.sendMessage(chatId, `⚡ <b>TELEGRAM BATCH UPLOAD MODE</b>\n\n` +
                            `1️⃣ Choose target subject paper below (e.g. 📘 F1, 1C, CFA L1, Python):\n` +
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
    const state = userStates[chatId];

    if (state.packStep === 'collecting_items' && state.packItems && state.packItems.length > 0) {
      const db = getDb();
      const cat = db.categories.find(c => c.id === state.packFolderId);

      if (cat) {
        if (!cat.resources) cat.resources = [];
        const newRes = {
          id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
          title: state.packTitle || 'Multi-Book Pack',
          type: 'bundle',
          value: `Multi-Pack Bundle (${state.packItems.length} items)`,
          description: `Combined Multi-Book Pack (${state.packItems.length} items)`,
          items: state.packItems
        };
        cat.resources.push(newRes);
        saveDb(db);

        bot.sendMessage(chatId, `🎉 <b>MULTI-BOOK BUNDLE PACK CREATED!</b> 📦\n\n` +
                               `📦 <b>Title:</b> ${newRes.title}\n` +
                               `📚 <b>Total Books:</b> ${state.packItems.length} items\n` +
                               `📁 <b>Folder:</b> ${cat.title}\n\n` +
                               `✨ Tapping this 1 button in Telegram will now send all ${state.packItems.length} books in 1 click!`, { parse_mode: 'HTML' });
      }

      state.packStep = null;
      state.packItems = [];
      state.packTitle = null;
      state.packFolderId = null;
      return;
    }

    const count = state.batchSavedCount || 0;
    state.batchTargetFolderId = null;
    state.batchSavedCount = 0;

    bot.sendMessage(chatId, `🎉 <b>Upload Completed!</b>\n\nTotal <b>${count} items</b> published!`, { parse_mode: 'HTML' });
  });

  // --- Direct File / Document Upload Handler inside Telegram ---
  bot.on('document', async (msg) => {
    if (!isUserAdmin(msg)) {
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) { sendForceSubMessage(msg.chat.id, msg.from.id); return; }
    }
    handleIncomingMedia(msg, 'file_id', msg.document.file_id, msg.document.file_name || 'Study Resource PDF');
  });

  bot.on('video', async (msg) => {
    if (!isUserAdmin(msg)) {
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) { sendForceSubMessage(msg.chat.id, msg.from.id); return; }
    }
    handleIncomingMedia(msg, 'file_id', msg.video.file_id, 'Video Lesson');
  });

  bot.on('photo', async (msg) => {
    if (!isUserAdmin(msg)) {
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) { sendForceSubMessage(msg.chat.id, msg.from.id); return; }
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

    if (state.packStep === 'collecting_items' && state.packFolderId) {
      if (!state.packItems) state.packItems = [];
      state.packItems.push({
        title: title,
        type: type,
        value: value,
        description: "Part of " + (state.packTitle || "Bundle Pack")
      });

      bot.sendMessage(chatId, `✅ <b>[Item ${state.packItems.length}] "${title}"</b> added to <b>"${state.packTitle}"</b> pack!\n\nSend next file or type /done when finished.`, { parse_mode: 'HTML' });
      return;
    }

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
    const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa' || c.parentId.includes('analytics') || c.parentId.includes('national')));

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
      const unSubbed = await getUnsubscribedChannels(chatId);
      if (unSubbed.length === 0) {
        bot.editMessageText(`🎉 <b>Thank you! Subscription Verified / Access Granted!</b>\n\nWelcome to the Resource Portal. Type /start to explore study materials!`, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'HTML'
        });
      } else {
        bot.answerCallbackQuery(query.id, { text: "⚠️ You have not joined all required channels yet! Please join to proceed.", show_alert: true });
      }
      return;
    }

    // STRICT LOCKDOWN: Check sub for any other callback query
    if (!isUserAdmin(query)) {
      const unSubbed = await getUnsubscribedChannels(query.from.id);
      if (unSubbed.length > 0) {
        sendForceSubMessage(chatId, query.from.id);
        bot.answerCallbackQuery(query.id, { text: "⚠️ Please join required channel(s) first!", show_alert: true });
        return;
      }
    }

    if (data.startsWith('start_exam_')) {
      const examId = data.replace('start_exam_', '');
      const exam = db.exams.find(e => e.id === examId);
      if (!exam) return bot.answerCallbackQuery(query.id, { text: "Exam not found!", show_alert: true });

      state.examMode = true;
      state.examId = examId;
      state.currentQuestionIndex = 0;
      state.examAnswers = [];

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, `🚀 <b>Exam Started: ${exam.title}</b>\n⏱️ <b>Duration:</b> ${exam.duration} mins\n📝 <b>Questions:</b> ${(exam.questions || []).length}\n\nGood luck!`, { parse_mode: 'HTML' }).then(() => {
        sendNextQuestion(chatId);
      });
      return;
    } else if (data.startsWith('ans_exam_')) {
      const ansData = data.replace('ans_exam_', ''); // format: "qIndex_answer"
      const [qIndexStr, answer] = ansData.split('_');
      const qIndex = parseInt(qIndexStr, 10);

      if (!state.examMode || state.currentQuestionIndex !== qIndex) {
        return bot.answerCallbackQuery(query.id, { text: "Invalid or expired question.", show_alert: true });
      }

      const exam = db.exams.find(e => e.id === state.examId);
      const question = exam.questions[qIndex];
      const isCorrect = (question.correctAnswer === answer);

      state.examAnswers.push({
        questionId: question.id,
        type: question.type,
        userAnswer: answer,
        isCorrect: isCorrect
      });

      state.currentQuestionIndex++;
      bot.answerCallbackQuery(query.id, { text: "Answer saved!" });
      sendNextQuestion(chatId, query.message.message_id);
      return;
    }
    
    if (data.startsWith('del_paper_')) {
      const paperId = data.replace('del_paper_', '');
      const subFolders = db.categories.filter(c => c.parentId === paperId);
      const inlineKeyboard = subFolders.map(sf => [{ text: sf.title, callback_data: `del_folder_${sf.id}` }]);

      bot.editMessageText(`🗑️ <b>Select subfolder to manage/delete:</b>`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('del_folder_')) {
      const folderId = data.replace('del_folder_', '');
      const cat = db.categories.find(c => c.id === folderId);
      if (!cat) return;

      const resources = cat.resources || [];
      if (resources.length === 0) {
        bot.editMessageText(`ℹ️ No study materials to delete inside <b>${cat.title}</b>.`, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'HTML'
        });
        bot.answerCallbackQuery(query.id);
        return;
      }

      const inlineKeyboard = resources.map(r => [{ text: `🗑️ Delete "${r.title.substr(0, 30)}"`, callback_data: `delete_item_${r.id}` }]);

      bot.editMessageText(`🗑️ <b>Resources inside ${cat.title}:</b>\n\nTap any resource below to delete it instantly:`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('delete_item_')) {
      const resId = data.replace('delete_item_', '');
      let deletedTitle = '';
      let targetCat = null;

      db.categories.forEach(cat => {
        if (cat.resources) {
          const index = cat.resources.findIndex(r => r.id === resId);
          if (index !== -1) {
            deletedTitle = cat.resources[index].title;
            targetCat = cat;
            cat.resources.splice(index, 1);
          }
        }
      });

      if (deletedTitle) {
        saveDb(db);
        bot.answerCallbackQuery(query.id, { text: `✅ "${deletedTitle}" deleted successfully!`, show_alert: true });

        const remaining = targetCat ? (targetCat.resources || []) : [];
        if (remaining.length === 0) {
          bot.editMessageText(`🎉 All resources deleted from <b>${targetCat ? targetCat.title : 'folder'}</b>!`, {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML'
          });
        } else {
          const inlineKeyboard = remaining.map(r => [{ text: `🗑️ Delete "${r.title.substr(0, 30)}"`, callback_data: `delete_item_${r.id}` }]);
          bot.editMessageText(`🗑️ <b>Resources inside ${targetCat.title}:</b>\n\n✅ <i>"${deletedTitle}" was deleted!</i>\n\nTap another item below to delete:`, {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineKeyboard }
          });
        }
      } else {
        bot.answerCallbackQuery(query.id, { text: "Resource not found or already deleted.", show_alert: true });
      }
    } else if (data.startsWith('pack_select_paper_')) {
      const paperId = data.replace('pack_select_paper_', '');
      const subFolders = db.categories.filter(c => c.parentId === paperId);

      const inlineKeyboard = subFolders.map(sf => [{ text: sf.title, callback_data: `set_pack_target_${sf.id}` }]);

      bot.editMessageText(`📦 <b>Select subfolder for "${state.packTitle || 'Pack'}":</b>`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      bot.answerCallbackQuery(query.id);
    } else if (data.startsWith('set_pack_target_')) {
      const folderId = data.replace('set_pack_target_', '');
      const cat = db.categories.find(c => c.id === folderId);
      state.packFolderId = folderId;
      state.packItems = [];
      state.packStep = 'collecting_items';

      bot.editMessageText(`📦 <b>BUNDLE PACK CREATOR ACTIVE!</b>\n\n` +
                         `📦 <b>Pack Title:</b> ${state.packTitle}\n` +
                         `📁 <b>Target Folder:</b> ${cat ? cat.title : folderId}\n\n` +
                         `📥 Drop all 5, 10, or 20 PDF books/files into Telegram now! Each item will be added to this pack.\n\n` +
                         `🔴 Type <b>/done</b> when finished to publish the entire Pack into 1 single button!`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML'
      });
      bot.answerCallbackQuery(query.id);
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
      const unSubbed = await getUnsubscribedChannels(msg.from.id);
      if (unSubbed.length > 0) {
        sendForceSubMessage(chatId, msg.from.id);
        return;
      }
    }

    if (state.packStep === 'await_title') {
      state.packTitle = text;
      state.packStep = 'await_folder';

      const paperCats = db.categories.filter(c => c.parentId && (c.parentId.includes('applied') || c.parentId.includes('strategic') || c.parentId === 'cat_cfa' || c.parentId.includes('analytics') || c.parentId.includes('national')));
      const inlineKeyboard = [];

      for (let i = 0; i < paperCats.length; i += 2) {
        const row = [{ text: paperCats[i].title, callback_data: `pack_select_paper_${paperCats[i].id}` }];
        if (paperCats[i + 1]) {
          row.push({ text: paperCats[i + 1].title, callback_data: `pack_select_paper_${paperCats[i + 1].id}` });
        }
        inlineKeyboard.push(row);
      }

      bot.sendMessage(chatId, `📦 <b>Pack Title Saved:</b> "${text}"\n\n2️⃣ <b>Select target folder below:</b>`, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      return;
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

    if (text === '📝 Mock Exams') {
      const validExams = (db.exams || []).filter(e => e.questions && e.questions.length > 0);
      if (validExams.length === 0) {
        bot.sendMessage(chatId, `ℹ️ No Mock Exams are currently available. Check back later!`);
        return;
      }
      const inlineKeyboard = validExams.map(e => [{ text: `📝 ${e.title} (${e.duration} mins)`, callback_data: `start_exam_${e.id}` }]);
      bot.sendMessage(chatId, `📝 <b>AVAILABLE MOCK EXAMS</b>\n\nChoose an exam below to begin:`, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
      return;
    }

    if (state.examMode) {
      if (text.startsWith('/')) return; // Ignore commands like /start or /exams inside exam
      
      const exam = db.exams.find(e => e.id === state.examId);
      if (!exam) return;
      
      const qIndex = state.currentQuestionIndex;
      const question = exam.questions[qIndex];
      
      if (question.type === 'written') {
        state.examAnswers.push({
          questionId: question.id,
          type: question.type,
          userAnswer: text,
          isCorrect: null // Needs manual grading
        });
        
        state.currentQuestionIndex++;
        let feedbackMsg = "✅ Written answer saved!";
        if (question.correctAnswer) {
          feedbackMsg += `\n\n💡 <b>Model Answer / Criteria for Self-Checking:</b>\n${question.correctAnswer}`;
        }
        bot.sendMessage(chatId, feedbackMsg, { parse_mode: 'HTML' });
        sendNextQuestion(chatId);
        return;
      }
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

    // Direct Resource Item Click (Support Single & Bundle Packs!)
    for (const cat of db.categories) {
      const res = (cat.resources || []).find(r => r.title.trim().toLowerCase() === text.toLowerCase());
      if (res) {
        await sendSingleResource(chatId, res);
        return;
      }
    }

    // Fallback: Perform instant query search across entire database!
    performSearch(chatId, text.toLowerCase(), msg);
  });

  function sendNextQuestion(chatId, replaceMessageId = null) {
    const state = userStates[chatId];
    const db = getDb();
    const exam = db.exams.find(e => e.id === state.examId);
    
    if (!exam) return;

    if (state.currentQuestionIndex >= exam.questions.length) {
      let score = 0;
      let mcqCount = 0;
      state.examAnswers.forEach(ans => {
        if (ans.type === 'mcq' || ans.type === 'tf') {
          mcqCount++;
          if (ans.isCorrect) score++;
        }
      });
      
      db.exam_submissions.push({
        id: 'sub_' + Date.now(),
        userId: chatId,
        examId: exam.id,
        examTitle: exam.title,
        answers: state.examAnswers,
        score: score,
        mcqCount: mcqCount,
        date: new Date().toISOString()
      });
      saveDb(db);
      
      let msgText = `🎉 <b>EXAM COMPLETED!</b>\n\n📝 <b>${exam.title}</b>\n✅ <b>OT Score:</b> ${score} / ${mcqCount}\n\n<i>Any Written (CR) answers have been saved and sent to the instructor for manual grading.</i>`;
      
      state.examMode = false;
      state.examId = null;
      state.currentQuestionIndex = 0;
      state.examAnswers = [];
      
      // Send completion message
      bot.sendMessage(chatId, msgText, { parse_mode: 'HTML' });
      
      // If exam has answer video, send it as a separate clickable button
      if (exam.videoUrl) {
        bot.sendMessage(chatId, `🎬 <b>Answer Explanation Video:</b>`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '🎬 Watch Answer Video', url: exam.videoUrl }
            ]]
          }
        });
      }
      return;
    }

    const qIndex = state.currentQuestionIndex;
    const q = exam.questions[qIndex];
    let text = `<b>Question ${qIndex + 1} of ${exam.questions.length}</b>\n\n${q.text}`;
    
    const sendQuestionContent = async () => {
      if (q.imageUrl) {
        try {
          await bot.sendPhoto(chatId, q.imageUrl, {
            caption: text,
            parse_mode: 'HTML'
          });
        } catch (err) {
          await bot.sendMessage(chatId, text + '\n\n⚠️ (Image could not load)', { parse_mode: 'HTML' });
        }
      }

      if (q.type === 'mcq' || q.type === 'tf') {
        const inlineKeyboard = [];
        let buttonText = '';
        if (q.type === 'mcq') {
          buttonText = `A) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}`;
          inlineKeyboard.push([
            { text: 'A', callback_data: `ans_exam_${qIndex}_A` },
            { text: 'B', callback_data: `ans_exam_${qIndex}_B` },
            { text: 'C', callback_data: `ans_exam_${qIndex}_C` },
            { text: 'D', callback_data: `ans_exam_${qIndex}_D` }
          ]);
        } else if (q.type === 'tf') {
          inlineKeyboard.push([
            { text: '✅ True', callback_data: `ans_exam_${qIndex}_True` },
            { text: '❌ False', callback_data: `ans_exam_${qIndex}_False` }
          ]);
        }
        
        if (q.imageUrl) {
          await bot.sendMessage(chatId, buttonText || 'Select your answer:', { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
        } else {
          const fullText = text + (buttonText ? '\n\n' + buttonText : '');
          if (replaceMessageId) {
            bot.editMessageText(fullText, { chat_id: chatId, message_id: replaceMessageId, parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
          } else {
            await bot.sendMessage(chatId, fullText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
          }
        }
      } else if (q.type === 'written') {
        const writtenText = (q.imageUrl ? '' : text + '\n\n') + '<i>✍️ Please type your answer directly in the chat below and send it.</i>';
        if (!q.imageUrl && replaceMessageId) {
          bot.editMessageText(text + '\n\n<i>✍️ Please type your answer directly in the chat below and send it.</i>', { chat_id: chatId, message_id: replaceMessageId, parse_mode: 'HTML' });
        } else {
          await bot.sendMessage(chatId, writtenText, { parse_mode: 'HTML' });
        }
      }
    };
    
    sendQuestionContent();
  }
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

app.get('/api/exams', (req, res) => {
  const db = getDb();
  res.json(db.exams || []);
});

app.post('/api/exams', (req, res) => {
  const { title, duration, questions, videoUrl } = req.body;
  const db = getDb();
  if (!db.exams) db.exams = [];
  
  const newExam = {
    id: 'exam_' + Date.now(),
    title: title || 'Mock Exam',
    duration: duration || 60,
    questions: questions || []
  };
  if (videoUrl) newExam.videoUrl = videoUrl;

  db.exams.push(newExam);
  saveDb(db);
  res.json({ success: true, exam: newExam });
});

// NOTE: /api/exams/update MUST come before /api/exams/:id to avoid Express routing conflict
app.post('/api/exams/update', (req, res) => {
  const { examId, questions } = req.body;
  const db = getDb();
  if (!db.exams) db.exams = [];
  
  const exam = db.exams.find(e => e.id === examId);
  if (exam) {
    exam.questions = questions;
    saveDb(db);
    res.json({ success: true, exam });
  } else {
    res.status(404).json({ error: 'Exam not found: ' + examId });
  }
});

app.delete('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.exams) db.exams = [];
  db.exams = db.exams.filter(e => e.id !== id);
  saveDb(db);
  res.json({ success: true });
});

app.post('/api/admin/restore-full-db', (req, res) => {
  const fullDb = generateFullMasterDb();
  const currentDb = getDb();
  if (currentDb.settings && currentDb.settings.bot_token) {
    fullDb.settings.bot_token = currentDb.settings.bot_token;
  }
  fullDb.exams = currentDb.exams || [];
  fullDb.exam_submissions = currentDb.exam_submissions || [];
  saveDb(fullDb);
  initBot();
  res.json({ success: true, message: "Database restored with all master categories!", categoriesCount: fullDb.categories.length });
});

app.get('/api/admin/export-db', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=db.json');
  res.send(JSON.stringify(getDb(), null, 2));
});

app.post('/api/settings', (req, res) => {
  const { bot_token, admin_password, donation, required_channels } = req.body;
  const db = getDb();

  if (bot_token !== undefined) db.settings.bot_token = bot_token;
  if (admin_password !== undefined) db.settings.admin_password = admin_password;
  if (donation !== undefined) db.settings.donation = donation;
  if (required_channels !== undefined) db.settings.required_channels = required_channels;

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
  const { title, type, value, description, items } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Category not found" });

  if (!cat.resources) cat.resources = [];

  const newRes = {
    id: 'res_' + Date.now() + Math.random().toString(36).substr(2, 4),
    title,
    type: type || 'link',
    value: value || '',
    description: description || '',
    items: Array.isArray(items) ? items : []
  };

  cat.resources.push(newRes);
  saveDb(db);
  res.json({ success: true, resource: newRes });
});

app.put('/api/categories/:catId/resources/:resId', (req, res) => {
  const { catId, resId } = req.params;
  const { title, type, value, description, items } = req.body;
  const db = getDb();

  const cat = db.categories.find(c => c.id === catId);
  if (!cat) return res.status(404).json({ error: "Category not found" });

  const resItem = (cat.resources || []).find(r => r.id === resId);
  if (!resItem) return res.status(404).json({ error: "Resource not found" });

  if (title !== undefined) resItem.title = title;
  if (type !== undefined) resItem.type = type;
  if (value !== undefined) resItem.value = value;
  if (description !== undefined) resItem.description = description;
  if (items !== undefined) resItem.items = items;

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

// --- 24/7 Keep-Alive Mechanism ---
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const client = url.startsWith('https') ? require('https') : require('http');
  
  client.get(`${url}/ping`, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Keep-Alive Ping successful: ' + url);
    }
  }).on('error', (err) => {
    console.log('Keep-Alive Ping failed:', err.message);
  });
}, 14 * 60 * 1000); // Har 14 daqiqada o'ziga-o'zi so'rov yuboradi (Render uxlab qolmasligi uchun)

app.listen(PORT, () => {
  console.log(`🌐 Web Admin Panel server running: http://localhost:${PORT}`);
  initBot();
});
