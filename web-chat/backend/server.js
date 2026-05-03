// ============================================
// AI PM Assistant — Backend API
// Node.js + Express + Anthropic SDK
// ============================================

import dotenv from 'dotenv';
import fsSync from 'fs';

// 啟動前：偵測 .env 編碼，若是 UTF-16 自動轉 UTF-8
(function ensureEnvIsUtf8() {
  const envPath = '.env';
  if (!fsSync.existsSync(envPath)) return;

  const buf = fsSync.readFileSync(envPath);
  // UTF-16 LE BOM = FF FE，BE BOM = FE FF
  const isUtf16LE = buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE;
  const isUtf16BE = buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF;

  if (isUtf16LE || isUtf16BE) {
    console.warn(`⚠️  偵測到 .env 是 ${isUtf16LE ? 'UTF-16 LE' : 'UTF-16 BE'} 編碼，自動轉為 UTF-8...`);
    const decoder = new TextDecoder(isUtf16LE ? 'utf-16le' : 'utf-16be');
    // 跳過 BOM（2 bytes）
    const text = decoder.decode(buf.slice(2));
    // 清掉 \r\n → \n
    const cleaned = text.replace(/\r\n/g, '\n');
    fsSync.writeFileSync(envPath, cleaned, 'utf-8');
    console.log(`✅ .env 已重存為 UTF-8`);
  }
})();

dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchMergedGroupMembers, hasJiraCreds } from './lib/jira.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Config ---
const PORT = process.env.PORT || 3002;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3001';
const MODEL = 'claude-sonnet-4-6';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY 未設定，請檢查 .env 檔案');
  process.exit(1);
}

const client = new Anthropic();

// --- Allowed Reporters（合併兩個 group + 快取）---
const ALLOWED_GROUPS = ['jira-users-rdmembers', 'jira-users-requester'];
const FALLBACK_JSON = path.join(__dirname, 'data', 'allowed-reporters.json');
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 分鐘

let allowedReportersCache = [];
let lastRefreshAt = null;
let lastRefreshError = null;

function loadFallbackReporters() {
  try {
    const raw = fs.readFileSync(FALLBACK_JSON, 'utf-8');
    const list = JSON.parse(raw);
    return list.map(r => ({ ...r, groups: ['fallback'] }));
  } catch {
    return [];
  }
}

async function refreshAllowedReporters() {
  if (!hasJiraCreds()) {
    const fallback = loadFallbackReporters();
    allowedReportersCache = fallback;
    lastRefreshError = 'JIRA_EMAIL / JIRA_API_TOKEN 未設定，使用 fallback 靜態名單';
    console.warn(`⚠️  ${lastRefreshError}（${fallback.length} 位）`);
    return { count: fallback.length, source: 'fallback', error: lastRefreshError };
  }

  try {
    const merged = await fetchMergedGroupMembers(ALLOWED_GROUPS);
    allowedReportersCache = merged;
    lastRefreshAt = new Date().toISOString();
    lastRefreshError = null;
    console.log(`👥 即時 API 更新：${merged.length} 位可開單人員（${ALLOWED_GROUPS.join(' + ')}）`);
    return { count: merged.length, source: 'live', refreshedAt: lastRefreshAt };
  } catch (err) {
    lastRefreshError = err.message;
    console.error(`❌ 即時 API 撈取失敗：${err.message}`);
    // 若之前有 cache 保持不變，若沒有則用 fallback
    if (allowedReportersCache.length === 0) {
      allowedReportersCache = loadFallbackReporters();
      console.warn(`   改用 fallback 靜態名單（${allowedReportersCache.length} 位）`);
    }
    return {
      count: allowedReportersCache.length,
      source: allowedReportersCache.length > 0 ? 'stale-cache' : 'fallback',
      error: err.message,
    };
  }
}

function getAllowedReporters() {
  return allowedReportersCache;
}

// --- Load System Prompt from Skill Files ---
function loadSystemPrompt() {
  const basePath = path.join(__dirname, '..', '..', '.claude');

  const files = [
    path.join(basePath, 'agents', 'interviewer.md'),
    path.join(basePath, 'skills', 'intake-interview', 'SKILL.md'),
    path.join(basePath, 'rules', 'tutorabc-context.md'),
  ];

  const sections = files.map(f => {
    try {
      return `<file path="${path.basename(f)}">\n${fs.readFileSync(f, 'utf-8')}\n</file>`;
    } catch (err) {
      console.warn(`⚠️ 讀不到 ${f}: ${err.message}`);
      return '';
    }
  }).filter(Boolean);

  const today = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });

  // 建立「可開單人員」清單給 AI 參考（從即時 cache 取）
  const allowedReporters = getAllowedReporters();
  const reporterListText = allowedReporters
    .map(r => {
      const groupsInfo = r.groups ? `[${r.groups.join(',')}]` : '';
      return `- ${r.displayName} (${r.email || '無 email'}) ${groupsInfo}`;
    })
    .join('\n');

  return `你是 TutorABC 的 AI PM 助理，名字叫「AI PM Assistant」。
目前日期：${today}（台北時間）

## 角色
你是透過 Web Chat 介面和 TutorABC 部門總監對話，引導他們完成 Jira 工單（需求單或 Bug 單）。

## 對話風格
- 一律使用繁體中文
- 語氣友善、直接，像同事在討論，不要八股
- 一次只問一個問題，等對方回覆再問下一題
- 禁止過度客套、不要重複對方的話

## 核心任務
依照下方 skill 文件的訪談流程（Q0 → Q9）引導使用者開單。

## 附件處理（重要）
- 使用者可能會貼文字、連結、檔案描述給你
- 如果使用者說「我有檔案要上傳」但目前 MVP 階段檔案上傳尚未實作，請告訴他：
  「目前檔案上傳功能還在準備中。請先把檔案內容的重點直接貼給我，或描述一下內容，之後我們會把原始檔案補上。」
- 如果提到加密檔案（D-security），提醒：另存為 PDF 再傳（PDF 不受限制）

## 限制
- 目前還沒串接 Jira API，所以「開單」這步先用模擬方式：顯示完整的工單預覽並告訴使用者「這張單的內容確認後我們會實際建立」
- 不要捏造不存在的 RDC 工單編號

## Q0 提案人驗證規則（重要！）

以下是**可開單的人員清單**（過去 12 個月曾在 RDC 建立需求單或 Bug 的人，約等於 jira-users-requester group）：

${reporterListText || '（清單未載入，進入信任模式）'}

### 驗證流程
1. 使用者在 Q0 輸入名字後，你必須**嚴格比對**上面清單
2. 支援模糊匹配（中文名、英文名、姓、名都可），但必須在清單內
3. **找到 1 位匹配** → 回覆確認：「找到了！提案人是 {全名}，對嗎？」，對方確認後才進 Q1
4. **找到多位匹配** → 列出選項讓使用者選擇
5. **找不到匹配** → 回覆：「『{輸入}』不在可開單人員清單內，沒有 Jira 權限 🚫
   可開單的人必須在 jira-users-requester group 內。
   請確認名字是否打對？或者先請他聯繫 IT 加入群組」
6. **不要放水！** 沒找到就是沒找到，不要以「信任制」繼續。這是權限問題，不是禮貌問題。

### 範例

使用者：「Kiki」
你：檢查清單 → 沒有 Kiki → 回覆「Kiki 不在可開單人員清單內...」

使用者：「Febrey」
你：檢查清單 → 找到 Febrey Huang → 回覆「找到了！提案人是 Febrey Huang，對嗎？」

使用者：「王」
你：檢查清單 → 有多位姓王的 → 列出：「找到 2 位姓王的：1. Angela_ci Wang  2. ...，是哪一位？」

## 知識與規則
以下是你要遵守的所有規則和模板：

${sections.join('\n\n')}
`;
}

let SYSTEM_PROMPT = '';
function rebuildSystemPrompt() {
  SYSTEM_PROMPT = loadSystemPrompt();
  console.log(`📝 系統提示詞重建：${SYSTEM_PROMPT.length} 字元`);
}

// --- Tools ---
const TOOLS = [
  {
    name: 'generate_wireframe',
    description: '當訪談中使用者描述的是 UI 相關需求（頁面、畫面、流程、按鈕、表單、排版改動），產出 HTML wireframe 讓使用者視覺化確認。使用時機：(1) 使用者描述新頁面或 UI 改動 (2) 需要確認畫面配置、元件排列 (3) 想讓使用者快速看到「大概長這樣」。產出的 wireframe 是**低擬真**的示意圖，用灰階色系 + 簡單框線，目的是確認結構不是做設計稿。產完 wireframe 後請主動問使用者「這樣的方向對嗎？還是要調整？」',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Wireframe 標題，簡短說明這是什麼畫面',
        },
        description: {
          type: 'string',
          description: '一兩句話說明這個 wireframe 想表達的重點',
        },
        html: {
          type: 'string',
          description: '完整的 HTML 片段（包含 <style> 內嵌 CSS）。規則：(1) 使用灰階/淡色系（#333/#666/#999/#eee/#f5f5f5），不用高飽和色 (2) 元素用 dashed border 或 solid thin border 表示 (3) 不要 JS 只要結構 (4) 寬度 max 800px 置中 (5) 用 system font sans-serif (6) 標註重點用文字，不用真實圖片 (7) 互動元素（按鈕/輸入框）用明顯虛線框表示',
        },
      },
      required: ['title', 'html'],
    },
  },
  {
    name: 'generate_ticket_preview',
    description: '當訪談資訊收集足夠（提案人、問題描述、影響人數、預期效益、急迫程度、對應窗口都問完），呼叫這個工具產出結構化的 Jira 工單預覽給使用者確認。不要在資訊不足時呼叫。呼叫後你可以附帶簡短文字說明（例如「這是整理好的工單預覽，請確認」），但主要讓 UI 卡片顯示內容。',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['需求單', 'Bug'],
          description: '工單類型',
        },
        summary: {
          type: 'string',
          description: '工單標題，必須含系統模組 prefix，格式 `[Prefix] 需求描述`，15-40 字',
        },
        priority: {
          type: 'string',
          enum: ['Highest', 'High', 'Medium', 'Low'],
          description: '急迫程度。Highest 必須有明確理由（不處理的後果）',
        },
        component: {
          type: 'string',
          description: '對應 Jira Component（AI 自動判斷），例如：UIUX 使用體驗、CRM 名單管理、APP 應用程式',
        },
        reporter: {
          type: 'string',
          description: '提案人姓名（必須是使用者回答 Q0 提供的名字）',
        },
        affected_users: {
          type: 'string',
          description: '影響人數/範圍，純文字，例如「全部 Demo 教室用戶」「約 200 位業務」',
        },
        expected_benefit: {
          type: 'string',
          description: '預期效益，1-3 句話說清楚做完能達成什麼',
        },
        description: {
          type: 'string',
          description: '完整需求描述，整合所有訪談內容，使用 markdown 格式，至少 100 字',
        },
        contact_person: {
          type: 'string',
          description: '後續對接窗口（Q6 的答案），RD 評估開發細節時找誰',
        },
        urgency_reason: {
          type: 'string',
          description: '只有 Highest 需要填：不處理的後果',
        },
        has_attachments: {
          type: 'boolean',
          description: '這張單是否有附件需要補充',
        },
      },
      required: ['type', 'summary', 'priority', 'component', 'reporter', 'description'],
    },
  },
];

// --- Conversation Store ---
// 簡單的 in-memory store，重啟會清空（MVP 階段夠用）
const conversations = new Map();

function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      messages: [],
      createdAt: Date.now(),
    });
  }
  return conversations.get(id);
}

// --- Express App ---
const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    conversations: conversations.size,
    uptime: process.uptime(),
    reporters: {
      count: allowedReportersCache.length,
      source: hasJiraCreds() ? 'jira-api' : 'fallback',
      lastRefreshAt,
      lastRefreshError,
    },
  });
});

// 管理員：強制 refresh reporter list
app.post('/api/admin/refresh-reporters', async (req, res) => {
  const result = await refreshAllowedReporters();
  rebuildSystemPrompt();
  res.json(result);
});

// 管理員：查看目前清單
app.get('/api/admin/reporters', (req, res) => {
  res.json({
    count: allowedReportersCache.length,
    source: hasJiraCreds() ? 'jira-api' : 'fallback',
    lastRefreshAt,
    lastRefreshError,
    members: allowedReportersCache.map(r => ({
      displayName: r.displayName,
      email: r.email,
      groups: r.groups,
    })),
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, attachments } = req.body;

    if ((!message || typeof message !== 'string') && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'message 或 attachments 至少要有一個' });
    }

    // 取得或建立對話
    const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const conversation = getConversation(convId);

    // 組 content blocks（支援多模態）
    const userContent = [];

    // 加入附件
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (!att.data || !att.mediaType) continue;

        if (att.mediaType.startsWith('image/')) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: att.mediaType,
              data: att.data,
            },
          });
        } else if (att.mediaType === 'application/pdf') {
          userContent.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: att.data,
            },
          });
        }
      }
    }

    // 加入文字訊息（即使空字串也要，避免 API 錯誤）
    if (message && message.trim()) {
      userContent.push({ type: 'text', text: message });
    } else if (userContent.length > 0) {
      userContent.push({ type: 'text', text: '（請分析附件）' });
    }

    // 如果上一輪 AI 呼叫了 tool_use 但還沒回 tool_result，先補 tool_result
    if (conversation.pendingToolUseId) {
      userContent.unshift({
        type: 'tool_result',
        tool_use_id: conversation.pendingToolUseId,
        content: message && message.trim() ? `使用者回應：${message}` : '使用者已看到預覽並繼續對話',
      });
      conversation.pendingToolUseId = null;
    }

    conversation.messages.push({
      role: 'user',
      content: userContent,
    });

    const attachInfo = attachments?.length ? ` + ${attachments.length} 個附件` : '';
    console.log(`💬 [${convId}] User: ${(message || '').slice(0, 60)}${attachInfo}`);

    // 呼叫 Claude API
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      tools: TOOLS,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: conversation.messages,
    });

    // 抓出各種 content block
    const textBlocks = response.content.filter(b => b.type === 'text');
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const reply = textBlocks.map(b => b.text).join('\n\n');

    // 存進對話歷史（保留完整 content，包括 thinking / tool_use blocks）
    conversation.messages.push({
      role: 'assistant',
      content: response.content,
    });

    // 處理 tool_use
    let ticketPreview = null;
    let wireframe = null;
    // 只記錄**最後一個** tool_use id 作為 pending，下一輪回 tool_result
    // （實際上同一輪通常只會呼一個 tool）
    for (const tb of toolUseBlocks) {
      if (tb.name === 'generate_ticket_preview') {
        ticketPreview = tb.input;
        conversation.pendingToolUseId = tb.id;
        console.log(`🎫 [${convId}] 工單預覽：${tb.input.summary}`);
      } else if (tb.name === 'generate_wireframe') {
        wireframe = tb.input;
        conversation.pendingToolUseId = tb.id;
        console.log(`🎨 [${convId}] Wireframe：${tb.input.title}`);
      }
    }

    console.log(`🤖 [${convId}] AI: ${reply.slice(0, 60)}${reply.length > 60 ? '...' : ''}`);
    console.log(`   Tokens: in=${response.usage.input_tokens} cache_read=${response.usage.cache_read_input_tokens || 0} out=${response.usage.output_tokens} stop=${response.stop_reason}`);

    res.json({
      conversationId: convId,
      message: reply,
      ticketPreview,
      wireframe,
      usage: response.usage,
    });

  } catch (err) {
    console.error('❌ Chat error:', err);

    if (err instanceof Anthropic.APIError) {
      return res.status(err.status || 500).json({
        error: err.message,
        type: err.constructor.name,
      });
    }

    res.status(500).json({ error: err.message || '伺服器錯誤' });
  }
});

// Reset conversation
app.post('/api/reset', (req, res) => {
  const { conversationId } = req.body;
  if (conversationId) {
    conversations.delete(conversationId);
  }
  res.json({ ok: true });
});

// 啟動流程：先撈 reporter 清單、建 prompt、啟伺服器
async function startup() {
  console.log('\n🔄 初始載入可開單人員名單...');
  await refreshAllowedReporters();
  rebuildSystemPrompt();

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 AI PM Assistant Backend');
    console.log(`   Port: ${PORT}`);
    console.log(`   Model: ${MODEL}`);
    console.log(`   CORS: ${ALLOWED_ORIGIN}`);
    console.log(`   Endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`   Jira 整合: ${hasJiraCreds() ? '✅ 即時' : '⚠️ Fallback JSON'}`);
    console.log('');
  });

  // 定期 refresh
  setInterval(async () => {
    await refreshAllowedReporters();
    rebuildSystemPrompt();
  }, REFRESH_INTERVAL_MS);
}

startup().catch(err => {
  console.error('❌ 啟動失敗：', err);
  process.exit(1);
});
