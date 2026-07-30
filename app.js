document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadData();
  setupDropZone();
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
    badgeText.textContent = "Bot Active (24/7)";
  } else {
    badgeText.textContent = "Token Not Set";
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
    .sort((a, b) => (a.order || 0) - (b.order || 0));

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

function processSingleFile(file) {
  if (!file) return;

  const statusEl = document.getElementById('uploadStatusText');
  statusEl.style.color = '#3b82f6';
  statusEl.textContent = `⏳ Uploading "${file.name}"...`;

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
        statusEl.textContent = `✅ "${file.name}" uploaded successfully!`;

        if (!document.getElementById('resTitleInput').value) {
          document.getElementById('resTitleInput').value = file.name;
        }
      } else {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = `❌ Upload error: ${data.error}`;
      }
    } catch (err) {
      statusEl.style.color = '#ef4444';
      statusEl.textContent = `❌ File upload failed!`;
    }
  };

  reader.readAsDataURL(file);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  processSingleFile(file);
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

  if (!title || !value) {
    alert('Please enter resource title and link/file!');
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

async function saveSettings() {
  const token = document.getElementById('botTokenInput').value.trim();
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_token: token })
    });
    if (res.ok) {
      alert('Settings saved successfully!');
      loadData();
    }
  } catch (err) {
    alert('Error saving settings!');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
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
  select.innerHTML = '';

  const leafCategories = dbData.categories.filter(c => !c.isFeedback);
  leafCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.title;
    if (currentFolderId === cat.id) option.disabled = true;
    select.appendChild(option);
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
