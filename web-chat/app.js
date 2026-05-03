// ============================================
// AI PM Assistant — Chat App
// ============================================

const API_BASE = 'http://localhost:3002/api';
const AI_AVATAR = 'P';
const USER_AVATAR = 'F';

// --- DOM ---
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const overlay = document.getElementById('overlay');
const convList = document.getElementById('conversation-list');
const emptyState = document.getElementById('empty-state');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatTitle = document.getElementById('chat-title');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const newChatBtn = document.getElementById('new-chat-btn');
const searchInput = document.getElementById('search-input');
const emptyInput = document.getElementById('empty-message-input');
const emptySendBtn = document.getElementById('empty-send-btn');

// --- State ---
let conversations = [];
let activeConvId = null;
let isWaiting = false;
let pendingAttachments = []; // [{id, name, mediaType, data (base64), previewUrl}]

// --- Constants ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];

// --- DOM (additional) ---
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const attachmentsPreview = document.getElementById('attachments-preview');

// --- Init ---
function init() {
  initTheme();
  loadConversations();
  renderConversations();
  // enableMockMode(); // 已接真實 API，Mock mode 關閉
  bindEvents();
  // Focus the visible composer — empty-state input on first load, chat input afterwards
  (emptyInput && !emptyState.classList.contains('hidden') ? emptyInput : input).focus();
}

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const icon = themeToggle.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// --- Conversations ---
function loadConversations() {
  const saved = localStorage.getItem('conversations');
  if (saved) {
    try { conversations = JSON.parse(saved); } catch { conversations = []; }
  }
}

function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(conversations));
}

function createConversation(firstMessage) {
  const conv = {
    id: 'conv-' + Date.now(),
    title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  conversations.unshift(conv);
  saveConversations();
  return conv;
}

function getActiveConversation() {
  return conversations.find(c => c.id === activeConvId);
}

function renderConversations() {
  convList.innerHTML = '';

  const filtered = searchInput.value
    ? conversations.filter(c => c.title.includes(searchInput.value))
    : conversations;

  if (filtered.length === 0) {
    convList.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
        ${searchInput.value ? '找不到相關對話' : '還沒有對話記錄'}
      </div>`;
    return;
  }

  filtered.forEach(conv => {
    const el = document.createElement('div');
    el.className = `conv-item${conv.id === activeConvId ? ' active' : ''}`;
    el.dataset.id = conv.id;

    const lastMsg = conv.messages.length > 0
      ? conv.messages[conv.messages.length - 1]
      : null;

    const preview = lastMsg
      ? (lastMsg.text || '').slice(0, 40)
      : '新對話';

    const time = formatRelativeTime(conv.updatedAt);
    const icon = lastMsg && lastMsg.type === 'ai' ? 'forum' : 'chat_bubble';

    el.innerHTML = `
      <div class="conv-icon">
        <span class="material-symbols-outlined">${icon}</span>
      </div>
      <div class="conv-info">
        <div class="conv-title">${escapeHtml(conv.title)}</div>
        <div class="conv-preview">${escapeHtml(preview)}</div>
      </div>
      <div class="conv-time">${time}</div>
    `;

    el.addEventListener('click', () => openConversation(conv.id));
    convList.appendChild(el);
  });
}

function openConversation(convId) {
  activeConvId = convId;
  const conv = getActiveConversation();
  if (!conv) return;

  // Update UI
  emptyState.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  chatTitle.textContent = conv.title;

  // Render messages
  chatMessages.innerHTML = '';
  conv.messages.forEach(msg => {
    if (msg.type === 'user' && msg.attachments?.length) {
      // 重載時 blob URL 會失效，顯示檔名即可
      const div = document.createElement('div');
      div.className = 'message message--user';
      const attHtml = msg.attachments.map(a =>
        a.mediaType?.startsWith('image/')
          ? `<div class="msg-attachment pdf"><span class="material-symbols-outlined">image</span><span>${escapeHtml(a.name)}（已上傳過）</span></div>`
          : `<div class="msg-attachment pdf"><span class="material-symbols-outlined">picture_as_pdf</span><span>${escapeHtml(a.name)}（已上傳過）</span></div>`
      ).join('');
      div.innerHTML = `
        <div class="msg-avatar">${USER_AVATAR}</div>
        <div class="msg-body">
          <div class="msg-name">You</div>
          ${msg.text ? `<div class="msg-content">${escapeHtml(msg.text)}</div>` : ''}
          ${attHtml}
          <div class="msg-time">${msg.time || ''}</div>
        </div>
      `;
      chatMessages.appendChild(div);
    } else {
      appendMessageDOM(msg.text, msg.type, msg.time, msg.html);
    }
  });

  renderConversations();
  scrollToBottom();
  closeSidebar();
  input.focus();
}

function startNewChat() {
  activeConvId = null;
  emptyState.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  chatMessages.innerHTML = '';
  renderConversations();
  closeSidebar();
}

// --- Messages ---
function appendMessageDOM(text, type, time, isHtml) {
  const div = document.createElement('div');
  div.className = `message message--${type}`;

  const avatarContent = type === 'ai' ? AI_AVATAR : USER_AVATAR;

  const name = type === 'ai' ? 'PM Assistant' : 'You';

  div.innerHTML = `
    <div class="msg-avatar">${avatarContent}</div>
    <div class="msg-body">
      <div class="msg-name">${name}</div>
      <div class="msg-content">${isHtml ? text : escapeHtml(text)}</div>
      <div class="msg-time">${time || formatTime(new Date())}</div>
    </div>
  `;

  chatMessages.appendChild(div);
}

// 解析文字中的「圖X」標記，把對應附件 inline 顯示
// 支援：(圖一) 圖1 圖 2 （圖 3）等各種寫法
function parseInlineImages(text, attachments) {
  if (!attachments || attachments.length === 0) {
    return { inlineHtml: escapeHtml(text).replace(/\n/g, '<br>'), unusedAttachments: [] };
  }

  const imageAtts = attachments.filter(a => a.mediaType.startsWith('image/'));
  const nonImageAtts = attachments.filter(a => !a.mediaType.startsWith('image/'));

  const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  // 匹配：(圖一) （圖 1） 圖1 圖一 等
  const pattern = /[(（]?\s*圖\s*([一二三四五六七八九十\d]+)\s*[)）]?/g;

  const used = new Set();
  let result = '';
  let lastIdx = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const numStr = match[1];
    let num;
    if (/^\d+$/.test(numStr)) {
      num = parseInt(numStr, 10);
    } else {
      num = chineseNums.indexOf(numStr) + 1;
    }

    if (num >= 1 && num <= imageAtts.length) {
      // 前面的文字
      result += escapeHtml(text.slice(lastIdx, match.index)).replace(/\n/g, '<br>');
      // 標記本身（讓使用者還能看到）
      result += `<span class="inline-img-marker">${escapeHtml(match[0])}</span>`;
      result += '<br>';
      // 圖片
      const att = imageAtts[num - 1];
      const src = att.dataUrl || att.previewUrl;
      result += `<div class="msg-inline-image" data-src="${src}" data-alt="${escapeHtml(att.name)}"><img src="${src}" alt="${escapeHtml(att.name)}"></div>`;
      used.add(num - 1);
      lastIdx = match.index + match[0].length;
    }
  }

  // 剩下的文字
  result += escapeHtml(text.slice(lastIdx)).replace(/\n/g, '<br>');

  // 沒被引用的圖片和所有非圖片檔
  const unusedImages = imageAtts.filter((_, i) => !used.has(i));
  const unusedAttachments = [...unusedImages, ...nonImageAtts];

  return { inlineHtml: result, unusedAttachments };
}

function addUserMessage(text, attachments) {
  const time = formatTime(new Date());

  if (!activeConvId) {
    const conv = createConversation(text || '附件訊息');
    activeConvId = conv.id;
    emptyState.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    chatTitle.textContent = conv.title;
  }

  const conv = getActiveConversation();
  if (conv) {
    conv.messages.push({
      text,
      type: 'user',
      time,
      attachments: attachments.map(a => ({
        name: a.name,
        mediaType: a.mediaType,
        previewUrl: a.previewUrl, // 只存 session 內的 blob URL
      })),
    });
    conv.updatedAt = new Date().toISOString();
    if (conv.messages.length <= 2 && text) {
      conv.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }
    saveConversations();
  }

  // Render DOM
  const div = document.createElement('div');
  div.className = 'message message--user';

  // 解析文字中的「圖X」標記，把圖片 inline 插入
  const { inlineHtml, unusedAttachments } = parseInlineImages(text || '', attachments || []);

  // 剩下沒被引用的附件顯示在下方 grid
  let trailingHtml = '';
  if (unusedAttachments.length > 0) {
    const items = unusedAttachments.map(a => {
      const src = a.dataUrl || a.previewUrl;
      if (a.mediaType.startsWith('image/')) {
        return `<div class="msg-attachment image" data-src="${src}" data-alt="${escapeHtml(a.name)}"><img src="${src}" alt="${escapeHtml(a.name)}"></div>`;
      } else {
        return `<div class="msg-attachment pdf"><span class="material-symbols-outlined">picture_as_pdf</span><span>${escapeHtml(a.name)}</span></div>`;
      }
    }).join('');
    trailingHtml = `<div class="msg-attachments-grid" data-count="${unusedAttachments.length}">${items}</div>`;
  }

  const contentHtml = inlineHtml
    ? `<div class="msg-content">${inlineHtml}</div>`
    : '';

  div.innerHTML = `
    <div class="msg-avatar">${USER_AVATAR}</div>
    <div class="msg-body">
      <div class="msg-name">You</div>
      ${contentHtml}
      ${trailingHtml}
      <div class="msg-time">${time}</div>
    </div>
  `;

  chatMessages.appendChild(div);
  renderConversations();
  scrollToBottom();
}

// --- Lightbox ---
function openLightbox(src, alt) {
  const existing = document.getElementById('lightbox');
  if (existing) existing.remove();

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.id = 'lightbox';
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="關閉">
      <span class="material-symbols-outlined">close</span>
    </button>
    <img src="${src}" alt="${escapeHtml(alt || '')}">
  `;

  const close = () => lb.remove();
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.closest('.lightbox-close')) close();
  });

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  document.body.appendChild(lb);
}

function addMessage(text, type = 'ai', options = {}) {
  const time = formatTime(new Date());

  // Ensure conversation exists
  if (!activeConvId) {
    const conv = createConversation(type === 'user' ? text : 'AI PM 對話');
    activeConvId = conv.id;
    emptyState.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    chatTitle.textContent = conv.title;
  }

  // Save to conversation
  const conv = getActiveConversation();
  if (conv) {
    conv.messages.push({ text, type, time, html: !!options.html });
    conv.updatedAt = new Date().toISOString();
    if (type === 'user' && conv.messages.length <= 2) {
      conv.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }
    saveConversations();
  }

  appendMessageDOM(text, type, time, options.html);
  renderConversations();
  scrollToBottom();
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message message--ai';
  div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-avatar">${AI_AVATAR}</div>
    <div class="msg-body">
      <div class="msg-name">PM Assistant</div>
      <div class="typing">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-msg');
  if (el) el.remove();
}

function addSuggestions(suggestions) {
  const html = `<div class="suggestions">${
    suggestions.map(s =>
      `<button class="suggestion-chip" data-msg="${escapeHtml(s)}">${escapeHtml(s)}</button>`
    ).join('')
  }</div>`;
  addMessage(html, 'ai', { html: true });
}

// --- Attachments ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // readAsDataURL 回傳 "data:mime/type;base64,xxxxx"
      const result = reader.result;
      const commaIdx = result.indexOf(',');
      resolve(result.slice(commaIdx + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addAttachment(file) {
  if (!SUPPORTED_MIME.includes(file.type)) {
    alert(`不支援的格式：${file.type || '未知'}\n請用 PNG / JPG / GIF / WebP / PDF`);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    alert(`檔案太大（${(file.size / 1024 / 1024).toFixed(1)} MB）\n上限 5 MB`);
    return;
  }
  try {
    const base64 = await fileToBase64(file);
    const attachment = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: file.name || (file.type.startsWith('image/') ? 'pasted-image' : 'file'),
      mediaType: file.type,
      data: base64,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    };
    pendingAttachments.push(attachment);
    renderAttachments();
    updateSendBtn();
  } catch (err) {
    console.error(err);
    alert('讀取檔案失敗');
  }
}

function removeAttachment(id) {
  const idx = pendingAttachments.findIndex(a => a.id === id);
  if (idx >= 0) {
    if (pendingAttachments[idx].previewUrl) {
      URL.revokeObjectURL(pendingAttachments[idx].previewUrl);
    }
    pendingAttachments.splice(idx, 1);
    renderAttachments();
    updateSendBtn();
  }
}

function renderAttachments() {
  attachmentsPreview.innerHTML = '';
  pendingAttachments.forEach(att => {
    const chip = document.createElement('div');
    const isImage = att.mediaType.startsWith('image/');
    chip.className = 'attachment-chip' + (isImage ? ' is-image' : '');

    if (isImage) {
      chip.innerHTML = `
        <img src="${att.previewUrl}" alt="${escapeHtml(att.name)}">
        <button class="att-remove" data-id="${att.id}" title="移除">
          <span class="material-symbols-outlined" style="font-size:14px">close</span>
        </button>
      `;
    } else {
      chip.innerHTML = `
        <span class="material-symbols-outlined">picture_as_pdf</span>
        <span class="att-name">${escapeHtml(att.name)}</span>
        <button class="att-remove" data-id="${att.id}" title="移除">
          <span class="material-symbols-outlined" style="font-size:16px">close</span>
        </button>
      `;
    }

    chip.querySelector('.att-remove').addEventListener('click', () => removeAttachment(att.id));
    attachmentsPreview.appendChild(chip);
  });
}

function clearAttachments() {
  pendingAttachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
  pendingAttachments = [];
  renderAttachments();
}

// --- Send ---
async function sendMessage(text) {
  if (isWaiting) return;
  if (!text.trim() && pendingAttachments.length === 0) return;

  // Render user message with attachments — 用 base64 data URL 永久有效
  const attachmentsToSend = pendingAttachments.map(a => ({
    name: a.name,
    mediaType: a.mediaType,
    data: a.data,
    dataUrl: `data:${a.mediaType};base64,${a.data}`, // 永久可用
  }));

  addUserMessage(text.trim(), attachmentsToSend);
  clearAttachments();

  input.value = '';
  input.style.height = 'auto';
  updateSendBtn();

  isWaiting = true;
  addTypingIndicator();

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text.trim(),
        conversationId: activeConvId,
        attachments: attachmentsToSend.map(a => ({
          name: a.name,
          mediaType: a.mediaType,
          data: a.data,
        })),
      })
    });

    removeTypingIndicator();

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 先顯示文字（如果有），再顯示 wireframe / 預覽卡
    if (data.message && data.message.trim()) {
      addMessage(data.message, 'ai');
    }
    if (data.wireframe) {
      renderWireframe(data.wireframe);
    }
    if (data.ticketPreview) {
      renderTicketPreview(data.ticketPreview);
    }
    // 如果都沒有，至少給個提示
    if (!data.message?.trim() && !data.ticketPreview && !data.wireframe) {
      addMessage('(沒有回應)', 'ai');
    }

    if (data.suggestions?.length) {
      addSuggestions(data.suggestions);
    }
  } catch (err) {
    removeTypingIndicator();
    addMessage('連線發生問題，請稍後再試。', 'ai');
    console.error(err);
  } finally {
    isWaiting = false;
  }
}

// --- Wireframe ---
function renderWireframe(w) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message message--ai';

  // Sandboxed iframe — srcdoc 讓 HTML 在隔離環境執行
  const iframeId = 'wf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

  wrapper.innerHTML = `
    <div class="msg-avatar">${AI_AVATAR}</div>
    <div class="msg-body">
      <div class="msg-name">PM Assistant</div>
      <div class="wireframe-card">
        <div class="wireframe-header">
          <span class="material-symbols-outlined">dashboard</span>
          <div class="wireframe-title">
            <strong>${escapeHtml(w.title || 'Wireframe')}</strong>
            ${w.description ? `<div class="wireframe-desc">${escapeHtml(w.description)}</div>` : ''}
          </div>
          <button class="wireframe-expand" data-iframe="${iframeId}" title="放大">
            <span class="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
        <div class="wireframe-frame">
          <iframe
            id="${iframeId}"
            sandbox="allow-same-origin"
            srcdoc="${escapeHtml(w.html || '')}"
            title="${escapeHtml(w.title || '')}"
          ></iframe>
        </div>
        <div class="wireframe-actions">
          <button class="suggestion-chip" data-msg="方向對，繼續">方向對，繼續</button>
          <button class="suggestion-chip" data-msg="我要調整這個畫面">要調整</button>
        </div>
      </div>
      <div class="msg-time">${formatTime(new Date())}</div>
    </div>
  `;

  chatMessages.appendChild(wrapper);
  scrollToBottom();

  // 存到對話歷史（只存必要資訊，不存 HTML 避免 localStorage 爆掉）
  const conv = getActiveConversation();
  if (conv) {
    conv.messages.push({
      type: 'ai',
      text: `[Wireframe: ${w.title}]`,
      time: formatTime(new Date()),
    });
    saveConversations();
  }

  // Expand button
  wrapper.querySelector('.wireframe-expand')?.addEventListener('click', () => {
    openWireframeFullscreen(w);
  });
}

function openWireframeFullscreen(w) {
  const existing = document.getElementById('wireframe-fullscreen');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.id = 'wireframe-fullscreen';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="關閉">
      <span class="material-symbols-outlined">close</span>
    </button>
    <iframe
      sandbox="allow-same-origin"
      srcdoc="${escapeHtml(w.html || '')}"
      style="width:90vw;height:90vh;border:none;border-radius:8px;background:#fff;"
    ></iframe>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('.lightbox-close')) close();
  });
  const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);

  document.body.appendChild(overlay);
}

// --- Ticket Preview ---
function renderTicketPreview(t) {
  const priorityColors = {
    Highest: 'var(--error)',
    High: 'var(--warning)',
    Medium: 'var(--accent)',
    Low: 'var(--text-tertiary)',
  };

  const priorityIcon = {
    Highest: 'priority_high',
    High: 'arrow_upward',
    Medium: 'flag',
    Low: 'remove',
  };

  const typeIcon = t.type === 'Bug' ? 'bug_report' : 'description';

  const row = (label, value) => value
    ? `<div class="ticket-row"><span class="ticket-label">${label}</span><span class="ticket-value">${escapeHtml(value)}</span></div>`
    : '';

  const descHtml = t.description
    ? `<div class="ticket-row ticket-desc">
         <span class="ticket-label">描述</span>
         <div class="ticket-desc-content">${escapeHtml(t.description).replace(/\n/g, '<br>')}</div>
       </div>`
    : '';

  const html = `
    <div class="ticket-card">
      <div class="ticket-card-header">
        <span class="ticket-type-badge"><span class="material-symbols-outlined">${typeIcon}</span>${escapeHtml(t.type || '需求單')}</span>
        <span class="ticket-priority" style="color: ${priorityColors[t.priority] || 'var(--text-secondary)'}"><span class="material-symbols-outlined">${priorityIcon[t.priority] || 'flag'}</span>${escapeHtml(t.priority || 'Medium')}</span>
      </div>
      <div class="ticket-summary">${escapeHtml(t.summary || '(未命名)')}</div>
      ${row('提案人', t.reporter)}
      ${row('對應團隊', t.component)}
      ${row('影響範圍', t.affected_users)}
      ${row('預期效益', t.expected_benefit)}
      ${t.priority === 'Highest' ? row('急迫原因', t.urgency_reason) : ''}
      ${row('對接窗口', t.contact_person)}
      ${descHtml}
      <div class="ticket-actions">
        <button class="btn btn-primary" onclick="handleAction('確認送出')"><span class="material-symbols-outlined">check</span>確認送出</button>
        <button class="btn btn-ghost" onclick="handleAction('我要修改')"><span class="material-symbols-outlined">edit</span>我要修改</button>
      </div>
      <div class="ticket-note"><span class="material-symbols-outlined">info</span>確認送出後，請親自到 Jira 把狀態從「草稿」改為「需求評審」才算完成送單</div>
    </div>
  `;
  addMessage(html, 'ai', { html: true });
}

function handleAction(msg) { sendMessage(msg); }

// --- Events ---
function bindEvents() {
  input.addEventListener('input', () => { updateSendBtn(); autoResize(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage(input.value);
    }
  });
  sendBtn.addEventListener('click', () => sendMessage(input.value));
  themeToggle.addEventListener('click', toggleTheme);
  newChatBtn.addEventListener('click', startNewChat);
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  overlay.addEventListener('click', closeSidebar);
  searchInput.addEventListener('input', renderConversations);

  // Empty-state composer — text-only, delegates to sendMessage
  if (emptyInput && emptySendBtn) {
    const updateEmptySendBtn = () => {
      emptySendBtn.disabled = !emptyInput.value.trim() || isWaiting;
    };
    const autoResizeEmpty = () => {
      emptyInput.style.height = 'auto';
      emptyInput.style.height = Math.min(emptyInput.scrollHeight, 160) + 'px';
    };
    const submitEmpty = () => {
      const text = emptyInput.value.trim();
      if (!text || isWaiting) return;
      emptyInput.value = '';
      autoResizeEmpty();
      updateEmptySendBtn();
      sendMessage(text);
    };
    emptyInput.addEventListener('input', () => { updateEmptySendBtn(); autoResizeEmpty(); });
    emptyInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitEmpty();
      }
    });
    emptySendBtn.addEventListener('click', submitEmpty);
  }

  // Quick action cards
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => sendMessage(card.dataset.message));
  });

  // Delegate suggestion chip clicks + image lightbox
  chatMessages.addEventListener('click', e => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
      sendMessage(chip.dataset.msg);
      return;
    }
    const imgAtt = e.target.closest('.msg-attachment.image, .msg-inline-image');
    if (imgAtt) {
      const src = imgAtt.dataset.src || imgAtt.querySelector('img')?.src;
      const alt = imgAtt.dataset.alt || '';
      if (src) openLightbox(src, alt);
    }
  });

  // Attachments: click attach button
  attachBtn.addEventListener('click', () => fileInput.click());

  // Attachments: file input
  fileInput.addEventListener('change', async (e) => {
    for (const file of Array.from(e.target.files)) {
      await addAttachment(file);
    }
    fileInput.value = ''; // reset to allow same file re-pick
  });

  // Attachments: paste image
  document.addEventListener('paste', async (e) => {
    if (document.activeElement !== input) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await addAttachment(file);
        }
      }
    }
  });

  // Attachments: drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    chatContainer.addEventListener(evt, (e) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        chatContainer.classList.add('drag-over');
      }
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    chatContainer.addEventListener(evt, (e) => {
      e.preventDefault();
      if (evt === 'dragleave' && e.target !== chatContainer) return;
      chatContainer.classList.remove('drag-over');
    });
  });

  chatContainer.addEventListener('drop', async (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    for (const file of files) {
      await addAttachment(file);
    }
  });
}

function closeSidebar() {
  sidebar.classList.remove('open');
}

function updateSendBtn() {
  const hasContent = input.value.trim() || pendingAttachments.length > 0;
  sendBtn.disabled = !hasContent || isWaiting;
}

function autoResize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// --- Utils ---
function formatTime(d) {
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins}分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小時前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}天前`;
  return new Date(iso).toLocaleDateString('zh-TW');
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

// --- Mock API ---
function enableMockMode() {
  const _fetch = window.fetch;
  window.fetch = async (url, opts) => {
    if (!url.startsWith(API_BASE)) return _fetch(url, opts);
    const { message } = JSON.parse(opts.body);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
    return { ok: true, json: async () => mockReply(message) };
  };
}

function mockReply(msg) {
  const m = msg.toLowerCase();
  const base = { conversationId: activeConvId };

  if (m.includes('開需求單') || m.includes('我要開單'))
    return { ...base, message: '好的！請先跟我說這張單的提案人，你可以直接輸入名字：' };

  if (m.includes('bug') || m.includes('回報'))
    return { ...base, message: '收到，來回報 Bug。\n請先跟我說這張單的提案人，你可以直接輸入名字：' };

  if (m.includes('查詢') || m.includes('狀態'))
    return { ...base, message: '請提供工單編號（例如 RDC-1234），我幫你查：' };

  if (m.includes('幫我看') || m.includes('分類'))
    return { ...base, message: '好，我來幫你 triage 目前待處理的工單。\n\n正在查詢 Filter 10399...' };

  if (m.includes('febrey') || m.includes('黃'))
    return { ...base, message: '找到了！提案人是 Febrey Huang_黃岱婷，對嗎？', suggestions: ['對', '不對，換一個'] };

  if (m === '對' || m === '是' || m === '確認')
    return { ...base, message: '好，接下來跟我說一下：\n\n想解決什麼問題？或要做什麼功能？' };

  if (m.includes('確認送出'))
    return { ...base, message: '工單已建立。\n\nRDC-9999\nhttps://tutorabc-org.atlassian.net/browse/RDC-9999\n\n請提案人自己點開工單確認內容無誤後，將狀態從「草稿」改為「需求評審」才算成功送單。' };

  return {
    ...base,
    message: `收到「${msg}」\n\n這個需求大概影響多少人？`,
    suggestions: ['全部用戶', '部分用戶（< 1000）', '內部人員']
  };
}

// --- Start ---
init();
