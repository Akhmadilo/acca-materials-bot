document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadData();
});

let dbData = { categories: [], subscribers: [], settings: {}, feedback_messages: [] };
let currentFolderId = null;
let uploadedFileUrl = "";

function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const tabId = item.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

async function loadData() {
  try {
    const res = await fetch('/api/data');
    dbData = await res.json();

    renderFileManager();
    renderSubscribers();
    renderFeedback();
    updateSettingsForm();
    updateBotBadge();
    updateTotalResourcesCounter();
    populateBatchSelect();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function updateTotalResourcesCounter() {
  let count = 0;
  dbData.categories.forEach(cat => {
    if (cat.resources) count += cat.resources.length;
  });
  const el = document.getElementById('totalResourcesBadge');
  if (el) el.textContent = count;
}

function updateBotBadge() {
  const badgeText = document.getElementById('botStatusText');
  const token = dbData.settings?.bot_token;
  if (token && token.trim() !== "") {
    badgeText.textContent = "Bot Faol (24/7)";
  } else {
    badgeText.textContent = "Token Kiritilmagan";
  }
}

function updateSettingsForm() {
  const tokenInput = document.getElementById('botTokenInput');
  if (tokenInput && dbData.settings) {
    tokenInput.value = dbData.settings.bot_token || "";
  }
}

function populateBatchSelect() {
  const select = document.getElementById('batchSubjectSelect');
  if (!select) return;
  select.innerHTML = '';

  const leafCategories = dbData.categories.filter(c => !c.isFeedback);

  leafCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.title;
    if (currentFolderId === cat.id) option.selected = true;
    select.appendChild(option);
  });
}

// --- FILE MANAGER NAVIGATION ENGINE ---
function navigateToFolder(folderId) {
  currentFolderId = folderId;
  renderFileManager();
}

function navigateUpFolder() {
  if (!currentFolderId) return;
  const currentCat = dbData.categories.find(c => c.id === currentFolderId);
  currentFolderId = currentCat ? currentCat.parentId : null;
  renderFileManager();
}

function renderBreadcrumbs() {
  const container = document.getElementById('breadcrumbsContainer');
  const backBtn = document.getElementById('backFolderBtn');
  container.innerHTML = '';

  if (!currentFolderId) {
    backBtn.disabled = true;
    container.innerHTML = `<span class="breadcrumb-item active"><i class="fa-solid fa-house"></i> Asosiy Papka</span>`;
    return;
  }

  backBtn.disabled = false;

  const trail = [];
  let curr = dbData.categories.find(c => c.id === currentFolderId);
  while (curr) {
    trail.unshift(curr);
    curr = dbData.categories.find(c => c.id === curr.parentId);
  }

  let html = `<span class="breadcrumb-item" onclick="navigateToFolder(null)"><i class="fa-solid fa-house"></i> Asosiy</span>`;

  trail.forEach((item, index) => {
    html += `<span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>`;
    const isLast = index === trail.length - 1;
    if (isLast) {
      html += `<span class="breadcrumb-item active">${item.title}</span>`;
    } else {
      html += `<span class="breadcrumb-item" onclick="navigateToFolder('${item.id}')">${item.title}</span>`;
    }
  });

  container.innerHTML = html;
}

// Render File Manager View
function renderFileManager() {
  renderBreadcrumbs();

  const container = document.getElementById('explorerContainer');
  const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  container.innerHTML = '';

  if (searchQuery) {
    renderSearchResults(searchQuery);
    return;
  }

  const subFolders = dbData.categories
    .filter(c => (currentFolderId === null ? !c.parentId : c.parentId === currentFolderId))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const currentCategory = currentFolderId ? dbData.categories.find(c => c.id === currentFolderId) : null;
  const currentFiles = currentCategory ? (currentCategory.resources || []) : [];

  if (subFolders.length === 0 && currentFiles.length === 0) {
    const currentName = currentCategory ? currentCategory.title : 'Ushbu papka';
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem 1rem; background: var(--panel-bg); border-radius: var(--radius); border: 1px dashed var(--panel-border);">
        <i class="fa-solid fa-folder-open" style="font-size:3.5rem; color:#60a5fa; margin-bottom:1rem;"></i>
        <h3 style="color:#fff;">"${currentName}" papkasi hozircha bo'sh</h3>
        <p style="margin-top:6px; font-size:0.9rem; color:#94a3b8;">Ushbu papkaga kitoblar, fayllar, videodarsliklar yoki linklar joylashingiz mumkin!</p>
        
        <div style="display:flex; gap:12px; justify-content:center; margin-top:1.5rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="openAddResourceCurrentFolder()">
            <i class="fa-solid fa-plus"></i> + Shu Papkaga Fayl / Link Joylash
          </button>
          <button class="btn btn-success" onclick="openBatchAddModal()">
            <i class="fa-solid fa-bolt"></i> ⚡ 1-Daqiqada 50 ta Kitob Joylash (Batch)
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Render Subfolders (📁)
  subFolders.forEach(folder => {
    const childFoldersCount = dbData.categories.filter(c => c.parentId === folder.id).length;
    const resCount = (folder.resources || []).length;

    const folderEl = document.createElement('div');
    folderEl.className = 'folder-item';
    folderEl.onclick = () => navigateToFolder(folder.id);

    folderEl.innerHTML = `
      <div>
        <div class="folder-icon-title">
          <i class="fa-solid ${folder.isFeedback ? 'fa-comment-dots' : 'fa-folder'} folder-icon"></i>
          <div>
            <span class="folder-title-text">${folder.title}</span>
            <small style="display:block; color:#94a3b8; font-size:0.78rem; margin-top:2px;">(Bosib ichiga kiring ➔)</small>
          </div>
        </div>
      </div>
      <div class="folder-footer">
        <span style="color:#60a5fa; font-weight:500;">
          <i class="fa-solid fa-folder-open"></i> ${childFoldersCount > 0 ? childFoldersCount + ' ta ichki papka' : resCount + ' ta resurs saqlangan'}
        </span>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); navigateToFolder('${folder.id}')">
            <i class="fa-solid fa-folder-open"></i> Kirish
          </button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEditCategoryModal('${folder.id}', '${folder.title.replace(/'/g, "\\'")}')" title="Papkani nomini o'zgartirish">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteCategory('${folder.id}')" title="Papkani o'chirish">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    container.appendChild(folderEl);
  });

  // Render Files/Links/Videos inside current folder (📄/🔗/🎥)
  currentFiles.forEach(file => {
    const fileEl = document.createElement('div');
    fileEl.className = 'file-item';

    let iconClass = 'fa-file-lines pdf-icon';
    let typeLabel = 'Matn';

    if (file.type === 'link') {
      if (file.value.includes('youtube.com') || file.value.includes('youtu.be')) {
        iconClass = 'fa-circle-play video-icon';
        typeLabel = 'Video';
      } else {
        iconClass = 'fa-link link-icon';
        typeLabel = 'Havola';
      }
    } else if (file.type === 'file_id' || file.type === 'file') {
      iconClass = 'fa-file-pdf pdf-icon';
      typeLabel = 'Fayl';
    }

    fileEl.innerHTML = `
      <div>
        <div class="file-header">
          <i class="fa-solid ${iconClass} file-icon"></i>
          <div class="file-details">
            <strong>${file.title}</strong>
            <p>${file.description || file.value}</p>
          </div>
        </div>
      </div>
      <div class="file-actions">
        ${file.type === 'link' || file.value.startsWith('http') || file.value.startsWith('/uploads') ? `<a href="${file.value}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ochish</a>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="openEditResourceModal('${currentFolderId}', '${file.id}')" title="Faylni tahrirlash">
          <i class="fa-solid fa-pen"></i> Tahrirlash
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteResource('${currentFolderId}', '${file.id}')" title="Faylni o'chirish">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    container.appendChild(fileEl);
  });
}

function renderSearchResults(query) {
  const container = document.getElementById('explorerContainer');
  const results = [];

  dbData.categories.forEach(cat => {
    if (cat.title.toLowerCase().includes(query)) {
      results.push({ kind: 'folder', item: cat });
    }
    if (cat.resources) {
      cat.resources.forEach(r => {
        if (r.title.toLowerCase().includes(query) || (r.value && r.value.toLowerCase().includes(query))) {
          results.push({ kind: 'file', item: r, folder: cat });
        }
      });
    }
  });

  if (results.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8;">
      <p>"${query}" bo'yicha hech qanday fayl yoki papka topilmadi.</p>
    </div>`;
    return;
  }

  results.forEach(res => {
    if (res.kind === 'folder') {
      const folderEl = document.createElement('div');
      folderEl.className = 'folder-item';
      folderEl.onclick = () => {
        document.getElementById('searchInput').value = '';
        navigateToFolder(res.item.id);
      };
      folderEl.innerHTML = `
        <div class="folder-icon-title">
          <i class="fa-solid fa-folder folder-icon"></i>
          <span class="folder-title-text">${res.item.title}</span>
        </div>
        <div class="folder-footer">
          <span>Qidiruv natijasi (Papka)</span>
          <button class="btn btn-primary btn-sm">Kirish ➔</button>
        </div>
      `;
      container.appendChild(folderEl);
    } else {
      const fileEl = document.createElement('div');
      fileEl.className = 'file-item';
      fileEl.innerHTML = `
        <div class="file-header">
          <i class="fa-solid fa-file-lines file-icon"></i>
          <div class="file-details">
            <strong>${res.item.title}</strong>
            <p>Joylashgan papkasi: <b>${res.folder.title}</b></p>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-secondary btn-sm" onclick="navigateToFolder('${res.folder.id}')">Papkaga o'tish ➔</button>
          <button class="btn btn-danger btn-sm" onclick="deleteResource('${res.folder.id}', '${res.item.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      container.appendChild(fileEl);
    }
  });
}

// RESTORE MASTER FULL DB
async function restoreFullMasterDb() {
  if (!confirm("Barcha ACCA (F1-P7) va CFA (L1-L3) paperlarining 4 talik papkalarini 100% qayta sinxronlashni tasdiqlaysizmi?")) return;

  try {
    const res = await fetch('/api/admin/restore-full-db', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert(`✅ Muvaffaqiyatli! Barcha ${data.categoriesCount} ta papkalar qayta yaratildi va tiklandi!`);
      loadData();
    }
  } catch (err) {
    alert("Xatolik!");
  }
}

function openAddResourceCurrentFolder() {
  if (!currentFolderId) {
    const leaf = dbData.categories.find(c => c.parentId !== null) || dbData.categories[0];
    if (leaf) openAddResourceModal(leaf.id);
    else alert('Avval papka yarating!');
  } else {
    openAddResourceModal(currentFolderId);
  }
}

function openAddCategoryModalCurrent() {
  openAddCategoryModal(currentFolderId);
}

function openBatchAddModal() {
  populateBatchSelect();
  document.getElementById('batchTextInput').value = '';
  document.getElementById('batchModal').classList.add('active');
}

async function saveBatchResources() {
  const catId = document.getElementById('batchSubjectSelect').value;
  const rawText = document.getElementById('batchTextInput').value.trim();

  if (!catId || !rawText) {
    alert("Iltimos, papkani va ma'lumotlarni kiriting!");
    return;
  }

  const lines = rawText.split('\n');
  const items = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      const parts = trimmed.split('|');
      const title = parts[0].trim();
      const value = parts[1] ? parts[1].trim() : 'https://t.me/acca_materials_official';
      const type = value.startsWith('http') ? 'link' : (value.startsWith('BQAC') ? 'file_id' : 'text');

      items.push({
        title: title,
        type: type,
        value: value,
        description: 'Fayl menejeri orqali joylangan'
      });
    }
  });

  try {
    const res = await fetch(`/api/categories/${catId}/resources/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert(`✅ ${data.addedCount} ta resurs papkaga muvaffaqiyatli joylandi!`);
      closeModal('batchModal');
      loadData();
    }
  } catch (err) {
    alert('Xatolik!');
  }
}

function openAddResourceModal(catId) {
  document.getElementById('modalResCatId').value = catId;
  document.getElementById('modalEditingResId').value = '';
  document.getElementById('resTitleInput').value = '';
  document.getElementById('resValueInput').value = '';
  document.getElementById('resDescInput').value = '';
  document.getElementById('resFileInput').value = '';
  document.getElementById('uploadStatusText').textContent = '';
  document.getElementById('resModalHeader').textContent = "Papkaga Fayl yoki Resurs Qo'shish";
  uploadedFileUrl = "";

  document.getElementById('resTypeSelect').value = 'link';
  toggleResValuePlaceholder();

  document.getElementById('resourceModal').classList.add('active');
}

function openEditResourceModal(catId, resId) {
  const cat = dbData.categories.find(c => c.id === catId);
  if (!cat) return;

  const resItem = (cat.resources || []).find(r => r.id === resId);
  if (!resItem) return;

  document.getElementById('modalResCatId').value = catId;
  document.getElementById('modalEditingResId').value = resId;
  document.getElementById('resTitleInput').value = resItem.title;
  document.getElementById('resValueInput').value = resItem.value || '';
  document.getElementById('resDescInput').value = resItem.description || '';
  document.getElementById('resFileInput').value = '';
  document.getElementById('uploadStatusText').textContent = '';
  document.getElementById('resModalHeader').textContent = "Faylni Tahrirlash";

  const type = resItem.type === 'file' ? 'file_upload' : (resItem.type || 'link');
  document.getElementById('resTypeSelect').value = type;
  toggleResValuePlaceholder();

  document.getElementById('resourceModal').classList.add('active');
}

function openEditCategoryModal(catId, currentTitle) {
  const newTitle = prompt("Papkaning yangi nomini kiriting:", currentTitle);
  if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
    fetch(`/api/categories/${catId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() })
    }).then(res => {
      if (res.ok) loadData();
    });
  }
}

function toggleResValuePlaceholder() {
  const type = document.getElementById('resTypeSelect').value;
  const fileContainer = document.getElementById('fileUploadContainer');
  const valueContainer = document.getElementById('resValueContainer');
  const label = document.getElementById('resValueLabel');
  const input = document.getElementById('resValueInput');

  if (type === 'file_upload') {
    fileContainer.style.display = 'block';
    valueContainer.style.display = 'none';
  } else {
    fileContainer.style.display = 'none';
    valueContainer.style.display = 'block';

    if (type === 'link') {
      label.textContent = "Havola (URL / Telegram / YouTube):";
      input.placeholder = "https://t.me/acca_materials_official/123";
    } else if (type === 'file_id') {
      label.textContent = "Telegram File ID:";
      input.placeholder = "BQACAgQAAxkBAAE...";
    } else {
      label.textContent = "Matnli Ma'lumot / Izoh:";
      input.placeholder = "Batafsil matn kiritishingiz mumkin...";
    }
  }
}

// Handle Direct File Upload from Computer
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('uploadStatusText');
  statusEl.style.color = '#3b82f6';
  statusEl.textContent = `⏳ "${file.name}" kompyuterdan yuklanmoqda...`;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData: base64Data })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        uploadedFileUrl = data.fileUrl;
        statusEl.style.color = '#10b981';
        statusEl.textContent = `✅ "${file.name}" yuklandi!`;

        if (!document.getElementById('resTitleInput').value) {
          document.getElementById('resTitleInput').value = file.name;
        }
      } else {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = `❌ Upload xatoligi: ${data.error}`;
      }
    } catch (err) {
      statusEl.style.color = '#ef4444';
      statusEl.textContent = `❌ Yuklashda xatolik yuz berdi!`;
    }
  };

  reader.readAsDataURL(file);
}

async function saveResource() {
  const catId = document.getElementById('modalResCatId').value;
  const editingResId = document.getElementById('modalEditingResId').value;
  const title = document.getElementById('resTitleInput').value.trim();
  const selectType = document.getElementById('resTypeSelect').value;
  let value = document.getElementById('resValueInput').value.trim();
  const description = document.getElementById('resDescInput').value.trim();
  let type = selectType;

  if (selectType === 'file_upload') {
    if (!uploadedFileUrl && !editingResId) {
      alert('Iltimos, avval kompyuteringizdan faylni tanlang!');
      return;
    }
    if (uploadedFileUrl) {
      value = uploadedFileUrl;
    }
    type = 'file';
  }

  if (!title || !value) {
    alert('Iltimos, sarlavha va fayl/havolani kiriting!');
    return;
  }

  try {
    const url = editingResId ? `/api/categories/${catId}/resources/${editingResId}` : `/api/categories/${catId}/resources`;
    const method = editingResId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, value, description })
    });

    if (res.ok) {
      closeModal('resourceModal');
      loadData();
    }
  } catch (err) {
    alert('Xatolik!');
  }
}

async function deleteResource(catId, resId) {
  if (!confirm("Ushbu faylni o'chirishni tasdiqlaysizmi?")) return;
  try {
    const res = await fetch(`/api/categories/${catId}/resources/${resId}`, { method: 'DELETE' });
    if (res.ok) loadData();
  } catch (err) {
    alert('Xatolik!');
  }
}

function openAddCategoryModal(parentId = null) {
  document.getElementById('modalParentId').value = parentId || '';
  document.getElementById('categoryTitleInput').value = '';
  document.getElementById('categoryModal').classList.add('active');
}

async function saveCategory() {
  const title = document.getElementById('categoryTitleInput').value.trim();
  const parentId = document.getElementById('modalParentId').value || null;

  if (!title) {
    alert('Papka nomini kiriting!');
    return;
  }

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parentId })
    });
    if (res.ok) {
      closeModal('categoryModal');
      loadData();
    }
  } catch (err) {
    alert('Xatolik!');
  }
}

async function deleteCategory(id) {
  if (!confirm("Ushbu papka va undagi barcha fayllarni o'chirishni tasdiqlaysizmi?")) return;
  try {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
  } catch (err) {
    alert('Xatolik!');
  }
}

function renderSubscribers() {
  const tbody = document.getElementById('subscribersTableBody');
  tbody.innerHTML = '';
  const subs = dbData.subscribers || [];

  if (subs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Hali a'zolar yo'q</td></tr>`;
    return;
  }

  subs.forEach(sub => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${sub.id}</code></td>
      <td>${sub.first_name || ''} ${sub.last_name || ''}</td>
      <td>${sub.username ? '@' + sub.username : '-'}</td>
      <td>${new Date(sub.joined_at || Date.now()).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderFeedback() {
  const container = document.getElementById('feedbackContainer');
  container.innerHTML = '';
  const list = dbData.feedback_messages || [];

  if (list.length === 0) {
    container.innerHTML = `<div class="card"><p style="text-align:center; color:#94a3b8;">Hali hech qanday fikr bildirilmagan.</p></div>`;
    return;
  }

  list.forEach(fb => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.marginBottom = '1rem';
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong><i class="fa-solid fa-user"></i> ${fb.userName || 'Foydalanuvchi'} ${fb.username ? '(@' + fb.username + ')' : ''}</strong>
        <small style="color:#94a3b8;">${new Date(fb.date).toLocaleString()}</small>
      </div>
      <p style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">"${fb.message}"</p>
    `;
    container.appendChild(item);
  });
}

async function sendBroadcast() {
  const msgText = document.getElementById('broadcastMessage').value.trim();
  const resultBox = document.getElementById('broadcastResult');

  if (!msgText) {
    alert('Xabar matnini kiriting!');
    return;
  }

  if (!confirm('Barcha obunachilarga yuborilsinmi?')) return;

  try {
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msgText })
    });
    const data = await res.json();
    resultBox.classList.remove('hidden');

    if (res.ok && data.success) {
      resultBox.innerHTML = `✅ Yuborildi: ${data.sent} ta obunachiga (Xatolik: ${data.failed})`;
      document.getElementById('broadcastMessage').value = '';
    } else {
      resultBox.innerHTML = `❌ Xatolik: ${data.error}`;
    }
  } catch (err) {
    alert('Xatolik!');
  }
}

async function saveSettings() {
  const token = document.getElementById('botTokenInput').value.trim();
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_token: token })
    });
    if (res.ok) {
      alert('Sozlamalar saqlandi!');
      loadData();
    }
  } catch (err) {
    alert('Xatolik!');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
