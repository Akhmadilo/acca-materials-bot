document.addEventListener('DOMContentLoaded', () => {
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    } catch (e) {}
  }
  
  const passInput = document.getElementById('loginPassword');
  if (passInput) {
    passInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }
  
  initTabs();
  loadData();
  setupDropZone();
});

let dbData = { categories: [], subscribers: [], settings: {}, feedback_messages: [] };
let currentFolderId = null;
let uploadedFileUrl = "";

// --- Auth Interceptor ---
const originalFetch = window.fetch.bind(window);
window.fetch = async function() {
  let [resource, config] = arguments;
  if (typeof resource === 'string' && resource.startsWith('/api') && resource !== '/api/login') {
    if (!config) config = {};
    
    // Check if headers is a Headers object or a plain object
    if (config.headers instanceof Headers) {
      config.headers.set('x-admin-email', localStorage.getItem('adminEmail') || '');
      config.headers.set('x-admin-password', localStorage.getItem('adminPass') || '');
    } else {
      config.headers = {
        ...config.headers,
        'x-admin-email': localStorage.getItem('adminEmail') || '',
        'x-admin-password': localStorage.getItem('adminPass') || ''
      };
    }
  }
  
  const response = await originalFetch(resource, config);
  if (response.status === 401 && typeof resource === 'string' && resource.startsWith('/api') && resource !== '/api/login') {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'flex';
    const nav = document.getElementById('mainNavbar');
    if (nav) nav.style.display = 'none';
    const layout = document.getElementById('mainLayout');
    if (layout) layout.style.display = 'none';
  } else if (response.ok && typeof resource === 'string' && resource.startsWith('/api') && resource !== '/api/login') {
    // If successfully authenticated, hide overlay and show UI
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
    const nav = document.getElementById('mainNavbar');
    if (nav) nav.style.display = 'flex';
    const layout = document.getElementById('mainLayout');
    if (layout) layout.style.display = 'flex';
  }
  return response;
};

async function attemptLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginError');
  
  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password';
    return;
  }
  
  errorEl.textContent = 'Verifying...';
  
  try {
    const res = await originalFetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminPass', password);
      document.getElementById('loginOverlay').style.display = 'none';
      const nav = document.getElementById('mainNavbar');
      if (nav) nav.style.display = 'flex';
      const layout = document.getElementById('mainLayout');
      if (layout) layout.style.display = 'flex';
      errorEl.textContent = '';
      loadData(); // Reload data now that we are authenticated
    } else {
      errorEl.textContent = 'Invalid Email or Password!';
    }
  } catch (err) {
    errorEl.textContent = 'Connection error. Try again.';
  }
}
// ------------------------

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
    if (typeof renderExams === 'function') renderExams();
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
    badgeText.textContent = "Bot Active (24/7)";
  } else {
    badgeText.textContent = "Token Not Set";
  }
}

function updateSettingsForm() {
  const tokenInput = document.getElementById('botTokenInput');
  const emailInput = document.getElementById('webAdminEmailInput');
  const passInput = document.getElementById('adminPasswordInput');
  
  if (dbData.settings) {
    if (tokenInput) tokenInput.value = dbData.settings.bot_token || "";
    if (emailInput) emailInput.value = dbData.settings.web_admin_email || "admin@acca.com";
    if (passInput) passInput.value = dbData.settings.admin_password || "admin";
  }

  // Update Donation fields
  const don = dbData.settings?.donation || {};
  if (document.getElementById('donCardNumber')) document.getElementById('donCardNumber').value = don.card_number || '';
  if (document.getElementById('donCardHolder')) document.getElementById('donCardHolder').value = don.card_holder || '';
  if (document.getElementById('donBankName')) document.getElementById('donBankName').value = don.bank_name || '';
  if (document.getElementById('donCryptoAddress')) document.getElementById('donCryptoAddress').value = don.crypto_address || '';
  if (document.getElementById('donCustomMessage')) document.getElementById('donCustomMessage').value = don.custom_message || '';

  renderMandatoryChannels();
  renderTelegramAdmins();
}

async function saveSettings() {
  const token = document.getElementById('botTokenInput').value.trim();
  const email = document.getElementById('webAdminEmailInput').value.trim();
  const pass = document.getElementById('adminPasswordInput').value.trim();
  
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        bot_token: token,
        web_admin_email: email,
        admin_password: pass
      })
    });
    if (res.ok) {
      alert('Core Settings Saved Successfully!');
      loadData();
    } else {
      alert('Failed to save settings.');
    }
  } catch (err) {
    alert('Error saving settings');
  }
}

function renderTelegramAdmins() {
  const container = document.getElementById('adminsListContainer');
  if (!container) return;
  container.innerHTML = '';

  const adminIds = dbData.settings?.admin_ids || [557976703, "Ibrohimov_Ahmadillo"];

  if (adminIds.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem;">No extra admins configured.</p>`;
    return;
  }

  adminIds.forEach((adminItem, index) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin-bottom:8px; border:1px solid var(--panel-border);';
    item.innerHTML = `
      <div>
        <strong style="color:#fff;"><i class="fa-solid fa-user-shield" style="color:#a855f7;"></i> ${adminItem}</strong>
        <span style="color:#a855f7; font-size:0.85rem; margin-left:10px;">(Full System Administrator)</span>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteTelegramAdmin(${index})"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(item);
  });
}

async function addTelegramAdmin() {
  const input = document.getElementById('newAdminInput');
  const val = input.value.trim();

  if (!val) {
    alert("Please enter Telegram username or Chat ID!");
    return;
  }

  const cleanVal = isNaN(val) ? (val.startsWith('@') ? val.replace('@', '') : val) : parseInt(val);

  const currentAdmins = dbData.settings?.admin_ids || [557976703, "Ibrohimov_Ahmadillo"];
  if (currentAdmins.includes(cleanVal) || currentAdmins.includes(val)) {
    alert("This admin is already added!");
    return;
  }

  currentAdmins.push(cleanVal);

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_ids: currentAdmins })
    });
    if (res.ok) {
      alert("✅ Administrator added successfully!");
      input.value = '';
      loadData();
    }
  } catch (err) {
    alert("Error adding administrator!");
  }
}

async function deleteTelegramAdmin(index) {
  if (!confirm("Are you sure you want to remove this administrator?")) return;

  const currentAdmins = dbData.settings?.admin_ids || [557976703, "Ibrohimov_Ahmadillo"];
  currentAdmins.splice(index, 1);

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_ids: currentAdmins })
    });
    if (res.ok) {
      loadData();
    }
  } catch (err) {
    alert("Error removing administrator!");
  }
}

function renderMandatoryChannels() {
  const container = document.getElementById('channelsListContainer');
  if (!container) return;
  container.innerHTML = '';

  const channels = dbData.settings?.required_channels || [];

  if (channels.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem;">No mandatory channels added yet.</p>`;
    return;
  }

  channels.forEach((ch, index) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin-bottom:8px; border:1px solid var(--panel-border);';
    item.innerHTML = `
      <div>
        <strong style="color:#fff;"><i class="fa-solid fa-bullhorn" style="color:#38bdf8;"></i> ${ch.title || ch.username}</strong>
        <span style="color:#60a5fa; font-size:0.85rem; margin-left:10px;">(${ch.username})</span>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteMandatoryChannel(${index})"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(item);
  });
}

async function addMandatoryChannel() {
  const usernameInput = document.getElementById('newChannelUsername');
  const titleInput = document.getElementById('newChannelTitle');

  const username = usernameInput.value.trim();
  const title = titleInput.value.trim() || username;

  if (!username) {
    alert("Please enter channel username (e.g. @Finance_Ahmadillo)!");
    return;
  }

  const cleanUsername = username.startsWith('@') ? username : '@' + username;
  const link = `https://t.me/${cleanUsername.replace('@', '')}`;

  const currentChannels = dbData.settings?.required_channels || [];
  currentChannels.push({ username: cleanUsername, title, link });

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_channels: currentChannels })
    });
    if (res.ok) {
      alert("✅ Mandatory channel added successfully!");
      usernameInput.value = '';
      titleInput.value = '';
      loadData();
    }
  } catch (err) {
    alert("Error adding channel!");
  }
}

async function deleteMandatoryChannel(index) {
  if (!confirm("Are you sure you want to remove this mandatory channel?")) return;

  const currentChannels = dbData.settings?.required_channels || [];
  currentChannels.splice(index, 1);

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_channels: currentChannels })
    });
    if (res.ok) {
      loadData();
    }
  } catch (err) {
    alert("Error removing channel!");
  }
}

async function saveDonationSettings() {
  const card_number = document.getElementById('donCardNumber').value.trim();
  const card_holder = document.getElementById('donCardHolder').value.trim();
  const bank_name = document.getElementById('donBankName').value.trim();
  const note = document.getElementById('donNote').value.trim();

  const donation = { card_number, card_holder, bank_name, note };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation })
    });
    if (res.ok) {
      alert("✅ Donation settings saved successfully!");
      loadData();
    }
  } catch (err) {
    alert("Error saving donation settings!");
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
    container.innerHTML = `<span class="breadcrumb-item active"><i class="fa-solid fa-house"></i> Root Folder</span>`;
    return;
  }

  backBtn.disabled = false;

  const trail = [];
  let curr = dbData.categories.find(c => c.id === currentFolderId);
  while (curr) {
    trail.unshift(curr);
    curr = dbData.categories.find(c => c.id === curr.parentId);
  }

  let html = `<span class="breadcrumb-item" onclick="navigateToFolder(null)"><i class="fa-solid fa-house"></i> Root</span>`;

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
    .sort((a, b) => {
      if (a.isFeedback || a.id === 'cat_feedback') return 1;
      if (b.isFeedback || b.id === 'cat_feedback') return -1;
      return (a.order || 0) - (b.order || 0);
    });

  const currentCategory = currentFolderId ? dbData.categories.find(c => c.id === currentFolderId) : null;
  const currentFiles = currentCategory ? (currentCategory.resources || []) : [];

  if (subFolders.length === 0 && currentFiles.length === 0) {
    const currentName = currentCategory ? currentCategory.title : 'This folder';
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3.5rem 1rem; background: var(--panel-bg); border-radius: var(--radius); border: 1px dashed var(--panel-border);">
        <i class="fa-solid fa-folder-open" style="font-size:3.8rem; color:#60a5fa; margin-bottom:1rem;"></i>
        <h3 style="color:#fff; font-weight:700;">"${currentName}" is currently empty</h3>
        <p style="margin-top:8px; font-size:0.92rem; color:#94a3b8;">Upload textbooks, PDF documents, video lectures, or Telegram links into this folder!</p>
        
        <div style="display:flex; gap:14px; justify-content:center; margin-top:1.8rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="openAddResourceCurrentFolder()">
            <i class="fa-solid fa-plus"></i> + Add Resource / File to this folder
          </button>
          <button class="btn btn-success" onclick="openBatchAddModal()">
            <i class="fa-solid fa-bolt"></i> ⚡ Batch Upload 50 Books
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
            <small style="display:block; color:#94a3b8; font-size:0.8rem; margin-top:4px;">(Click to open folder ➔)</small>
          </div>
        </div>
      </div>
      <div class="folder-footer">
        <span style="color:#60a5fa; font-weight:500;">
          <i class="fa-solid fa-folder-open"></i> ${childFoldersCount > 0 ? childFoldersCount + ' subfolders' : resCount + ' items saved'}
        </span>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); navigateToFolder('${folder.id}')">
            <i class="fa-solid fa-folder-open"></i> Open
          </button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEditCategoryModal('${folder.id}', '${folder.title.replace(/'/g, "\\'")}')" title="Rename folder">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteCategory('${folder.id}')" title="Delete folder">
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
    let typeLabel = 'Document';

    const titleLower = (file.title || '').toLowerCase();
    const valLower = (file.value || '').toLowerCase();
    const valStr = (file.value || '').trim();
    const isTelegramVideoId = valStr.startsWith('BAAC') || valStr.startsWith('BAAD');
    const isVideoFolder = currentFolderId && currentFolderId.includes('_videos');

    if (file.type === 'video' || isTelegramVideoId || isVideoFolder || valLower.includes('youtube.com') || valLower.includes('youtu.be') || valLower.includes('vimeo') || valLower.endsWith('.mp4') || valLower.endsWith('.mkv') || titleLower.includes('video') || titleLower.includes('lecture') || titleLower.includes('course') || titleLower.includes('lesson') || titleLower.includes('accountant in business')) {
      iconClass = 'fa-circle-play video-icon';
      typeLabel = 'Video Lecture';
    } else if (file.type === 'link' || valLower.startsWith('http://') || valLower.startsWith('https://') || valLower.startsWith('t.me/')) {
      iconClass = 'fa-link link-icon';
      typeLabel = 'Web / Telegram Link';
    } else if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) {
      iconClass = 'fa-file-word word-icon';
      typeLabel = 'Word Document';
    } else if (titleLower.endsWith('.xlsx') || titleLower.endsWith('.xls')) {
      iconClass = 'fa-file-excel excel-icon';
      typeLabel = 'Excel Spreadsheet';
    } else {
      iconClass = 'fa-file-pdf pdf-icon';
      typeLabel = 'PDF Document';
    }

    const isChecked = selectedResourceIds.includes(file.id);

    fileEl.innerHTML = `
      <div>
        <div class="file-header" style="position:relative;">
          <input type="checkbox" style="width:18px; height:18px; margin-top:6px; cursor:pointer;" ${isChecked ? 'checked' : ''} onchange="toggleResourceSelect('${file.id}')">
          <i class="fa-solid ${iconClass} file-icon"></i>
          <div class="file-details">
            <strong>${file.title}</strong>
            <p>${file.description || file.value}</p>
          </div>
        </div>
      </div>
      <div class="file-actions">
        ${file.type === 'link' || file.value.startsWith('http') || file.value.startsWith('/uploads') ? `<a href="${file.value}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open</a>` : ''}
        <button class="btn btn-primary btn-sm" onclick="openSingleMoveModal('${file.id}')" title="Move to another folder">
          <i class="fa-solid fa-box-archive"></i> Move
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openEditResourceModal('${currentFolderId}', '${file.id}')" title="Edit resource">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteResource('${currentFolderId}', '${file.id}')" title="Delete resource">
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
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3.5rem; color:#94a3b8;">
      <p>No study materials or folders found matching "${query}".</p>
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
          <span>Folder Search Result</span>
          <button class="btn btn-primary btn-sm">Open Folder ➔</button>
        </div>
      `;
      container.appendChild(folderEl);
    } else {
      const file = res.item;
      let iconClass = 'fa-file-lines pdf-icon';
      const titleLower = (file.title || '').toLowerCase();
      const valLower = (file.value || '').toLowerCase();
      const valStr = (file.value || '').trim();
      const isTelegramVideoId = valStr.startsWith('BAAC') || valStr.startsWith('BAAD');
      const isVideoFolder = res.folder && res.folder.id && res.folder.id.includes('_videos');

      if (file.type === 'video' || isTelegramVideoId || isVideoFolder || valLower.includes('youtube.com') || valLower.includes('youtu.be') || valLower.includes('vimeo') || valLower.endsWith('.mp4') || valLower.endsWith('.mkv') || titleLower.includes('video') || titleLower.includes('lecture') || titleLower.includes('course') || titleLower.includes('lesson') || titleLower.includes('accountant in business')) {
        iconClass = 'fa-circle-play video-icon';
      } else if (file.type === 'link' || valLower.startsWith('http://') || valLower.startsWith('https://') || valLower.startsWith('t.me/')) {
        iconClass = 'fa-link link-icon';
      } else if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) {
        iconClass = 'fa-file-word word-icon';
      } else if (titleLower.endsWith('.xlsx') || titleLower.endsWith('.xls')) {
        iconClass = 'fa-file-excel excel-icon';
      } else {
        iconClass = 'fa-file-pdf pdf-icon';
      }

      const fileEl = document.createElement('div');
      fileEl.className = 'file-item';
      fileEl.innerHTML = `
        <div class="file-header">
          <i class="fa-solid ${iconClass} file-icon"></i>
          <div class="file-details">
            <strong>${res.item.title}</strong>
            <p>Folder: <b>${res.folder.title}</b></p>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-secondary btn-sm" onclick="navigateToFolder('${res.folder.id}')">Go to Folder ➔</button>
          <button class="btn btn-danger btn-sm" onclick="deleteResource('${res.folder.id}', '${res.item.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      container.appendChild(fileEl);
    }
  });
}

// RESTORE MASTER FULL DB
async function downloadBackup() {
  try {
    const res = await fetch('/api/admin/export-db');
    if (!res.ok) { alert('Failed to download backup!'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error downloading backup: ' + err.message);
  }
}

async function restoreFullMasterDb() {
  if (!confirm("Are you sure you want to restore and resync all 96 ACCA and CFA master category folders?")) return;


  try {
    const res = await fetch('/api/admin/restore-full-db', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert(`✅ Success! All ${data.categoriesCount} master folders resynced successfully.`);
      loadData();
    }
  } catch (err) {
    alert("Error restoring database!");
  }
}

function openAddResourceCurrentFolder() {
  if (!currentFolderId) {
    const leaf = dbData.categories.find(c => c.parentId !== null) || dbData.categories[0];
    if (leaf) openAddResourceModal(leaf.id);
    else alert('Please create a folder first!');
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
    alert("Please select a target folder and paste study items!");
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
        description: 'Uploaded via Batch Uploader'
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
      alert(`✅ Successfully uploaded ${data.addedCount} study items to the folder!`);
      closeModal('batchModal');
      loadData();
    }
  } catch (err) {
    alert('Error during batch upload!');
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
  document.getElementById('resModalHeader').textContent = "Add Study Material / File";
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
  document.getElementById('resModalHeader').textContent = "Edit Study Resource";

  const type = resItem.type === 'file' ? 'file_upload' : (resItem.type || 'link');
  document.getElementById('resTypeSelect').value = type;
  toggleResValuePlaceholder();

  document.getElementById('resourceModal').classList.add('active');
}

function openEditCategoryModal(catId, currentTitle) {
  const newTitle = prompt("Enter new folder name:", currentTitle);
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
      label.textContent = "Resource Link (URL / Telegram / YouTube):";
      input.placeholder = "https://t.me/acca_materials_official/123";
    } else if (type === 'bundle') {
      label.textContent = "Multi-File Bundle Pack Items (Format: Title | Link or File ID - 1 per line):";
      input.placeholder = "Kaplan F1 Study Text 2026 | https://t.me/kanalingiz/101\nBPP F1 Revision Kit | BQACAgIAAxkBAA...\nF1 Summary Notes | https://t.me/kanalingiz/103";
    } else if (type === 'file_id') {
      label.textContent = "Telegram File ID:";
      input.placeholder = "BQACAgQAAxkBAAE...";
    } else {
      label.textContent = "Text Notes / Instructions:";
      input.placeholder = "Enter detailed notes here...";
    }
  }
}

function setupDropZone() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.background = 'rgba(59,130,246,0.15)', false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.background = 'rgba(59,130,246,0.05)', false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processSingleFile(files[0]);
    }
  }, false);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('uploadStatusText');
  statusEl.style.color = 'var(--text-main)';
  statusEl.textContent = `⏳ Uploading "${file.name}"...`;

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: reader.result
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        uploadedFileUrl = data.fileUrl;
        statusEl.style.color = 'var(--success)';
        statusEl.textContent = `✅ "${file.name}" uploaded successfully!`;
        if(document.getElementById('resTitleInput').value === '') {
          document.getElementById('resTitleInput').value = file.name.replace(/\.[^/.]+$/, "");
        }
      } else {
        statusEl.style.color = 'var(--danger)';
        statusEl.textContent = `❌ Upload error: ${data.error}`;
      }
    } catch (err) {
      statusEl.style.color = 'var(--danger)';
      statusEl.textContent = `❌ File upload failed!`;
    }
  };
}

async function handleBatchFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const statusEl = document.getElementById('batchUploadStatusText');
  statusEl.style.color = 'var(--text-main)';
  let uploadedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    statusEl.textContent = `⏳ Uploading file ${i+1} of ${files.length}: "${file.name}"...`;
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData: base64 })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        const textarea = document.getElementById('batchTextInput');
        const title = file.name.replace(/\.[^/.]+$/, "");
        const newEntry = `${title} | ${data.fileUrl}`;
        textarea.value = textarea.value ? textarea.value + '\n' + newEntry : newEntry;
        uploadedCount++;
      }
    } catch(err) {
      console.error("Batch upload failed for", file.name, err);
    }
  }
  
  statusEl.style.color = 'var(--success)';
  statusEl.textContent = `✅ ${uploadedCount} ta fayl muvaffaqiyatli yuklandi! Tepada nomlarini o'zgartirib "Save Batch Items" tugmasini bosing.`;
  event.target.value = ''; // reset file input
}



async function saveResource() {
  const catId = document.getElementById('modalResCatId').value;
  const editingResId = document.getElementById('modalEditingResId').value;
  const title = document.getElementById('resTitleInput').value.trim();
  const selectType = document.getElementById('resTypeSelect').value;
  let value = document.getElementById('resValueInput').value.trim();
  const description = document.getElementById('resDescInput').value.trim();
  let type = selectType;
  let items = [];

  if (selectType === 'bundle') {
    type = 'bundle';
    const lines = value.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        const parts = trimmed.split('|');
        const itemTitle = parts[0].trim();
        const itemVal = parts[1] ? parts[1].trim() : itemTitle;
        let itemType = 'link';
        if (itemVal.startsWith('http://') || itemVal.startsWith('https://') || itemVal.startsWith('t.me/')) {
          itemType = 'link';
        } else if (itemVal.startsWith('BQAC') || itemVal.startsWith('BAAC') || itemVal.startsWith('BAAD') || itemVal.startsWith('AgAC')) {
          itemType = 'file_id';
        } else if (itemVal.startsWith('/uploads/')) {
          itemType = 'file';
        }
        items.push({ title: itemTitle, type: itemType, value: itemVal });
      }
    });
    value = `Multi-Pack Bundle (${items.length} items)`;
  } else if (selectType === 'file_upload') {
    if (!uploadedFileUrl && !editingResId) {
      alert('Please select or drop a file first!');
      return;
    }
    if (uploadedFileUrl) {
      value = uploadedFileUrl;
    }
    type = 'file';
  } else if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('t.me/') || value.startsWith('www.')) {
    type = 'link';
  }

  if (!title || (!value && items.length === 0)) {
    alert('Please enter resource title and link/file/bundle items!');
    return;
  }

  try {
    const url = editingResId ? `/api/categories/${catId}/resources/${editingResId}` : `/api/categories/${catId}/resources`;
    const method = editingResId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, value, description, items })
    });

    if (res.ok) {
      closeModal('resourceModal');
      loadData();
    }
  } catch (err) {
    alert('Error saving resource!');
  }
}

async function deleteResource(catId, resId) {
  if (!confirm("Are you sure you want to delete this resource?")) return;
  try {
    const res = await fetch(`/api/categories/${catId}/resources/${resId}`, { method: 'DELETE' });
    if (res.ok) loadData();
  } catch (err) {
    alert('Error deleting resource!');
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
    alert('Please enter folder name!');
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
    alert('Error creating folder!');
  }
}

async function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this folder and all items inside it?")) return;
  try {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
  } catch (err) {
    alert('Error deleting folder!');
  }
}

function renderSubscribers() {
  const tbody = document.getElementById('subscribersTableBody');
  tbody.innerHTML = '';
  const subs = dbData.subscribers || [];

  // Update badge count
  const badge = document.getElementById('subscriberCountBadge');
  if (badge) badge.textContent = subs.length.toLocaleString();

  if (subs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No registered subscribers yet</td></tr>`;
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
    container.innerHTML = `<div class="card"><p style="text-align:center; color:#94a3b8;">No feedback messages received yet.</p></div>`;
    return;
  }

  list.forEach(fb => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.marginBottom = '1rem';
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong><i class="fa-solid fa-user"></i> ${fb.userName || 'Member'} ${fb.username ? '(@' + fb.username + ')' : ''}</strong>
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
    alert('Please enter announcement message text!');
    return;
  }

  if (!confirm('Send this announcement to all subscribers now?')) return;

  try {
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msgText })
    });
    const data = await res.json();
    resultBox.classList.remove('hidden');

    if (res.ok && data.success) {
      resultBox.innerHTML = `✅ Successfully sent to ${data.sent} subscribers (Failed: ${data.failed})`;
      document.getElementById('broadcastMessage').value = '';
    } else {
      resultBox.innerHTML = `❌ Error sending broadcast: ${data.error}`;
    }
  } catch (err) {
    alert('Error sending broadcast!');
  }
}



function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// --- BULK SELECTION & RESOURCE MOVE ENGINE ---
let selectedResourceIds = [];

function toggleResourceSelect(resId) {
  const index = selectedResourceIds.indexOf(resId);
  if (index > -1) {
    selectedResourceIds.splice(index, 1);
  } else {
    selectedResourceIds.push(resId);
  }
  updateBulkActionBar();
}

function updateBulkActionBar() {
  const bar = document.getElementById('bulkActionBar');
  const countText = document.getElementById('selectedCountText');
  if (!bar) return;

  if (selectedResourceIds.length > 0) {
    bar.style.display = 'flex';
    countText.textContent = `${selectedResourceIds.length} item(s) selected`;
  } else {
    bar.style.display = 'none';
  }
}

function populateMoveTargetSelect() {
  const select = document.getElementById('moveTargetSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- Choose Destination Folder --</option>';

  const roots = dbData.categories.filter(c => !c.parentId && !c.isFeedback);

  roots.forEach(rootCat => {
    const rootGroup = document.createElement('optgroup');
    rootGroup.label = rootCat.title;

    const mainLevels = dbData.categories.filter(c => c.parentId === rootCat.id);

    mainLevels.forEach(levelCat => {
      const papers = dbData.categories.filter(c => c.parentId === levelCat.id);

      if (papers.length > 0) {
        papers.forEach(paperCat => {
          const subFolders = dbData.categories.filter(c => c.parentId === paperCat.id);
          if (subFolders.length > 0) {
            subFolders.forEach(sf => {
              const opt = document.createElement('option');
              opt.value = sf.id;
              opt.textContent = `${paperCat.title} ➔ ${sf.title}`;
              if (currentFolderId === sf.id) opt.disabled = true;
              rootGroup.appendChild(opt);
            });
          } else {
            const opt = document.createElement('option');
            opt.value = paperCat.id;
            opt.textContent = `${levelCat.title} ➔ ${paperCat.title}`;
            if (currentFolderId === paperCat.id) opt.disabled = true;
            rootGroup.appendChild(opt);
          }
        });
      } else {
        const subFolders = dbData.categories.filter(c => c.parentId === levelCat.id);
        if (subFolders.length > 0) {
          subFolders.forEach(sf => {
            const opt = document.createElement('option');
            opt.value = sf.id;
            opt.textContent = `${levelCat.title} ➔ ${sf.title}`;
            if (currentFolderId === sf.id) opt.disabled = true;
            rootGroup.appendChild(opt);
          });
        } else {
          const opt = document.createElement('option');
          opt.value = levelCat.id;
          opt.textContent = `${rootCat.title} ➔ ${levelCat.title}`;
          if (currentFolderId === levelCat.id) opt.disabled = true;
          rootGroup.appendChild(opt);
        }
      }
    });

    select.appendChild(rootGroup);
  });
}

function openSingleMoveModal(resId) {
  document.getElementById('moveResourceIds').value = JSON.stringify([resId]);
  populateMoveTargetSelect();
  document.getElementById('moveModal').classList.add('active');
}

function openBulkMoveModal() {
  if (selectedResourceIds.length === 0) return;
  document.getElementById('moveResourceIds').value = JSON.stringify(selectedResourceIds);
  populateMoveTargetSelect();
  document.getElementById('moveModal').classList.add('active');
}

async function confirmMoveResources() {
  const raw = document.getElementById('moveResourceIds').value;
  const targetCatId = document.getElementById('moveTargetSelect').value;

  if (!raw || !targetCatId) {
    alert("Please select destination folder!");
    return;
  }

  const resourceIds = JSON.parse(raw);

  try {
    const res = await fetch('/api/resources/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceIds, targetCatId })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      alert(`✅ Successfully moved ${data.movedCount} item(s) to destination folder!`);
      selectedResourceIds = [];
      updateBulkActionBar();
      closeModal('moveModal');
      loadData();
    }
  } catch (err) {
    alert("Error moving resources!");
  }
}

async function bulkDeleteSelected() {
  if (selectedResourceIds.length === 0) return;
  if (!confirm(`Are you sure you want to delete ${selectedResourceIds.length} selected item(s)?`)) return;

  for (const resId of selectedResourceIds) {
    await fetch(`/api/categories/${currentFolderId}/resources/${resId}`, { method: 'DELETE' });
  }

  selectedResourceIds = [];
  updateBulkActionBar();
  loadData();
}

// ==========================================
// MOCK EXAM SYSTEM JAVASCRIPT
// ==========================================

function updateBroadcastPreview() {
  const text = document.getElementById('broadcastMessage').value;
  const box = document.getElementById('broadcastPreviewBox');
  if (!box) return;
  if (!text.trim()) {
    box.innerHTML = `<i>Type a message above to see preview...</i>`;
  } else {
    box.innerHTML = text.replace(/\n/g, '<br>');
  }
}

function renderExams() {
  const container = document.getElementById('examsListContainer');
  if (!container) return;
  container.innerHTML = '';
  
  if (!dbData.exams || dbData.exams.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No exams available.</p>`;
    return;
  }

  dbData.exams.forEach(exam => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.cssText = 'margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;';
    
    let attachmentsHtml = '';
    if (exam.pdfFileId) {
      attachmentsHtml += `<p style="margin:4px 0 0; font-size:0.85rem; color:#10b981;"><i class="fa-solid fa-file-pdf"></i> <b>PDF Attached (via Telegram)</b> <span style="font-size:0.75rem; color:var(--text-muted);">[${exam.pdfFileId.substring(0, 15)}...]</span></p>`;
    } else if (exam.pdfUrl) {
      attachmentsHtml += `<p style="margin:4px 0 0; font-size:0.85rem; color:var(--accent);"><i class="fa-solid fa-file-pdf"></i> <a href="${exam.pdfUrl}" target="_blank" style="color:var(--accent);">📄 Exam PDF (Link)</a></p>`;
    }

    if (exam.videoFileId) {
      attachmentsHtml += `<p style="margin:4px 0 0; font-size:0.85rem; color:#8b5cf6;"><i class="fa-solid fa-video"></i> <b>Answer Video Attached (via Telegram)</b> <span style="font-size:0.75rem; color:var(--text-muted);">[${exam.videoFileId.substring(0, 15)}...]</span></p>`;
    } else if (exam.videoUrl) {
      attachmentsHtml += `<p style="margin:4px 0 0; font-size:0.85rem; color:var(--primary);"><i class="fa-solid fa-video"></i> <a href="${exam.videoUrl}" target="_blank" style="color:var(--primary);">🎬 Answer Video (Link)</a></p>`;
    }

    if (!exam.pdfFileId && !exam.pdfUrl && !exam.videoFileId && !exam.videoUrl) {
      attachmentsHtml += `<p style="margin:4px 0 0; font-size:0.8rem; color:var(--text-muted);">💡 <i>You can attach PDF / Video via Telegram bot: <code>/attach</code></i></p>`;
    }

    div.innerHTML = `
      <div style="flex:1; min-width:200px;">
        <h4 style="margin:0; font-size:1.1rem;">${exam.title}</h4>
        <p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-muted);">
          ⏱️ ${exam.duration} mins | 📝 ${exam.questions ? exam.questions.length : 0} Questions
        </p>
        ${attachmentsHtml}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="openExamQuestions('${exam.id}')"><i class="fa-solid fa-list-check"></i> Manage Questions</button>
        <button class="btn btn-danger" onclick="deleteExam('${exam.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function createExam() {
  const title = document.getElementById('newExamTitle').value.trim();
  const duration = document.getElementById('newExamDuration').value;
  const videoUrlEl = document.getElementById('newExamVideoUrl');
  const videoUrl = videoUrlEl ? videoUrlEl.value.trim() : '';
  const pdfUrlEl = document.getElementById('newExamPdfUrl');
  const pdfUrl = pdfUrlEl ? pdfUrlEl.value.trim() : '';
  
  if (!title) return alert('Enter exam title!');
  
  const body = { title, duration };
  if (videoUrl) body.videoUrl = videoUrl;
  if (pdfUrl) body.pdfUrl = pdfUrl;
  
  await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  document.getElementById('newExamTitle').value = '';
  if (videoUrlEl) videoUrlEl.value = '';
  if (pdfUrlEl) pdfUrlEl.value = '';
  loadData();
}

async function deleteExam(id) {
  if (!confirm('Delete this exam completely?')) return;
  await fetch('/api/exams/' + id, { method: 'DELETE' });
  loadData();
}

function openExamQuestions(examId) {
  const exam = dbData.exams.find(e => e.id === examId);
  if (!exam) return;
  
  document.getElementById('currentExamId').value = examId;
  document.getElementById('examQuestionsModalTitle').innerHTML = `<i class="fa-solid fa-list-check"></i> Manage Questions: ${exam.title}`;
  
  renderExamQuestionsList(exam);
  openModal('examQuestionsModal');
}

function renderExamQuestionsList(exam) {
  const list = document.getElementById('examQuestionsList');
  list.innerHTML = '';
  
  if (!exam.questions || exam.questions.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);">No questions added yet.</p>`;
    return;
  }
  
  exam.questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg-color); padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid var(--panel-border);';
    
    let typeBadge = '';
    if (q.type === 'mcq') typeBadge = '<span style="background:#3b82f6; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;">MCQ</span>';
    else if (q.type === 'tf') typeBadge = '<span style="background:#f59e0b; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;">True/False</span>';
    else if (q.type === 'written') typeBadge = '<span style="background:#10b981; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;">Written (CR)</span>';
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong>Q${index + 1}. ${typeBadge}</strong>
        <button class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteQuestion('${exam.id}', '${q.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <p style="margin:0 0 8px; font-size:0.95rem;">${q.text}</p>
      ${q.type === 'mcq' ? `<p style="margin:0; font-size:0.85rem; color:var(--text-muted);">A) ${q.options[0]} | B) ${q.options[1]} | C) ${q.options[2]} | D) ${q.options[3]}</p>` : ''}
      ${q.correctAnswer ? `<p style="margin:4px 0 0; color:var(--success); font-size:0.85rem;"><strong>Correct / Model Answer:</strong> ${q.correctAnswer}</p>` : `<p style="margin:4px 0 0; color:var(--warning); font-size:0.85rem;">Requires manual grading by Admin</p>`}
      ${q.imageUrl ? `<div style="margin-top:8px;"><img src="${q.imageUrl}" style="max-width:200px; max-height:150px; border-radius:8px; border:1px solid var(--panel-border);" onerror="this.style.display='none'"></div>` : ''}
    `;
    list.appendChild(div);
  });
}

function toggleQuestionTypeFields() {
  const type = document.getElementById('qTypeSelect').value;
  document.getElementById('mcqOptionsContainer').style.display = type === 'mcq' ? 'block' : 'none';
  document.getElementById('tfOptionsContainer').style.display = type === 'tf' ? 'block' : 'none';
  const writtenContainer = document.getElementById('writtenOptionsContainer');
  if (writtenContainer) writtenContainer.style.display = type === 'written' ? 'block' : 'none';
}

async function uploadQuestionImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const fileData = e.target.result;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData })
      });
      const data = await res.json();
      if (res.ok && data.fileUrl) {
        document.getElementById('qImageUrl').value = data.fileUrl;
        const previewBox = document.getElementById('qImagePreviewBox');
        const previewImg = document.getElementById('qImagePreview');
        if (previewBox && previewImg) {
          previewImg.src = data.fileUrl;
          previewBox.style.display = 'block';
        }
        alert("📷 Question image uploaded successfully!");
      } else {
        alert("Image upload failed!");
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    }
  };
  reader.readAsDataURL(file);
}

async function addQuestionToExam() {
  try {
    const examId = document.getElementById('currentExamId').value;
    const type = document.getElementById('qTypeSelect').value;
    const text = document.getElementById('qTextInput').value.trim();
    
    if (!text) return alert("Enter question text!");
    
    const question = { id: 'q_' + Date.now(), type, text };
    const imageUrl = document.getElementById('qImageUrl').value.trim();
    if (imageUrl) question.imageUrl = imageUrl;
    
    if (type === 'mcq') {
      question.options = [
        document.getElementById('qOptA').value || 'A',
        document.getElementById('qOptB').value || 'B',
        document.getElementById('qOptC').value || 'C',
        document.getElementById('qOptD').value || 'D'
      ];
      question.correctAnswer = document.getElementById('qCorrectMcq').value;
    } else if (type === 'tf') {
      question.options = ['True', 'False'];
      question.correctAnswer = document.getElementById('qCorrectTf').value;
    } else if (type === 'written') {
      const modelAns = document.getElementById('qCorrectWritten');
      if (modelAns && modelAns.value.trim()) {
        question.correctAnswer = modelAns.value.trim();
      }
    }
    
    const exam = dbData.exams.find(e => e.id === examId);
    if (!exam.questions) exam.questions = [];
    exam.questions.push(question);
    
    const res = await fetch('/api/exams/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: exam.id, questions: exam.questions })
    });
    
    if (!res.ok) throw new Error("Server xatolik berdi");

    document.getElementById('qTextInput').value = '';
    document.getElementById('qImageUrl').value = '';
    const previewBox = document.getElementById('qImagePreviewBox');
    if (previewBox) previewBox.style.display = 'none';
    const modelAns = document.getElementById('qCorrectWritten');
    if (modelAns) modelAns.value = '';

    await loadData();
    openExamQuestions(examId);
    alert("✅ Savol muvaffaqiyatli qo'shildi!");
  } catch (err) {
    console.error(err);
    alert("Xatolik yuz berdi: " + err.message);
  }
}

async function deleteQuestion(examId, qId) {
  if (!confirm('Delete this question?')) return;
  const exam = dbData.exams.find(e => e.id === examId);
  exam.questions = exam.questions.filter(q => q.id !== qId);
  
  await fetch('/api/exams/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId: exam.id, questions: exam.questions })
  });
  
  await loadData();
  openExamQuestions(examId);
}
