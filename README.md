# 🚀 ACCA & Certificate Materials Bot + Admin Panel

Ushbu loyiha Manybot o'rnini to'liq bosuvchi, shaxsiy **Web Admin Panel** va **Telegram Bot** platformasidir.

---

## 🛠️ Lokal kompyuterda ishga tushirish (Sinov uchun)

1. Loyiha katalogiga o'ting:
   ```bash
   cd acca_materials_bot
   ```
2. Kerakli paketlarni o'rnating:
   ```bash
   npm install
   ```
3. Serverni ishga tushiring:
   ```bash
   npm start
   ```
4. Brauzerda **`http://localhost:3000`** manziliga kiring.
5. **Bot Sozlamalari** bo'limida Telegram `@BotFather`dan olingan Bot Tokenni kiriting va saqlang.

---

## 🌐 100% BEPUL VA 24/7 HAR KUNI ISHLAYDIGAN QILIB DEPLOY QILISH (RENDER.COM)

Loyihangiz kompyuteringiz o'chib tursa ham 24 soat to'xtovsiz ishlashi uchun uni **Render.com** bepul bulutli platformasiga joylaymiz.

### 1-bosqich: Kodlarni GitHub ga yuklash
1. [GitHub.com](https://github.com) sahifasida yangi repo yaratasiz (masalan: `acca-materials-bot`).
2. Ushbu loyiha papkasidagi barcha fayllarni repo'ga yuklaysiz (Push qilasiz).

### 2-bosqich: Render.com da bepul server ochish
1. [Render.com](https://render.com) saytida bepul ro'yxatdan o'ting (GitHub orqali kirish oson).
2. **New +** tugmasini bosing va **Web Service** ni tanlang.
3. GitHub-dagi `acca-materials-bot` reposingizni ulaysiz.
4. Quyidagi sozlamalarni kiriting:
   - **Name:** `acca-bot-admin`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (Bepul)
5. **Create Web Service** tugmasini bosing. Render 1-2 daqiqada serverni ishga tushiradi va sizga bepul HTTPS domen beradi (masalan: `https://acca-bot-admin.onrender.com`).

### 3-bosqich: 24/7 Uzluksiz ishlashini ta'minlash (Keep-Alive)
Render bepul serveri hech qachon "uquvga ketmasligi" uchun:
1. [UptimeRobot.com](https://uptimerobot.com) saytida bepul hisob oching.
2. **Add New Monitor** ni bosing:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `ACCA Bot Ping`
   - **URL:** `https://acca-bot-admin.onrender.com/ping`
   - **Monitoring Interval:** `5 minutes`
3. **Create Monitor** tugmasini bosing.

🎉 **TAYYOR!** Endi sizning Web Admin Panelingiz va Telegram Botingiz kompyuteringiz o'chiq bo'lsa ham 24/7 rejimida har kuni uzluksiz ishlaydi!
