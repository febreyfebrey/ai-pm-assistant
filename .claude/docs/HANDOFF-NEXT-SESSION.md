# Handoff Notes — 明天公司繼續

> 給接手的 Claude 讀（也給 Febrey 自己看一眼）
> 上一個 session 結束於 2026-05-04，做完 Phase A + B，剩 Phase C + D。

## TL;DR

正在做「視覺辯證需求」流程：訪談中 AI 判斷需要時產 wireframe，user 點圖片區塊調整，最終 PNG 自動上傳到 Jira 並內嵌 description。Phase A（SKILL.md）+ Phase B（後端 + markdown→ADF）已完成並驗證 dryRun，**剩 Phase C 前端 wiring + Phase D 端到端 smoke test**。

完整設計在 [.claude/docs/visual-elicitation-spec.md](visual-elicitation-spec.md)。

## Febrey 早上要先做的事

### 1. 環境設定（office 機器是新 clone 沒 .env）

```bash
# 拉最新 branch
cd <你的 repo path>
git fetch origin
git checkout claude/recursing-mahavira-1a4fa2

# 建 backend .env（檔案 gitignored，每台機器要重建）
cd web-chat/backend
cp .env.example .env
```

編輯 `web-chat/backend/.env` 填入：
- `ANTHROPIC_API_KEY=sk-ant-...`
- `JIRA_API_TOKEN=ATATT3x...`（從 https://id.atlassian.com/manage-profile/security/api-tokens；**注意 prefix 要 ATATT 不是 ATCTT**，後者是 Connect app token 不能用）

`JIRA_BASE_URL` 和 `JIRA_EMAIL` 已在 .env.example 預填，不用動。

```bash
# 安裝後端依賴（如果是 fresh clone）
npm install
cd ../..

# 啟動服務
# 後端：node web-chat/backend/server.js  (port 3002)
# 前端：npx http-server web-chat -p 3000 -c-1 --silent
```

### 2. 跟 Claude 說「繼續 Phase C」就夠了

接手的 Claude 看完這份 doc 應該知道要做什麼。如果不確定，就讓他讀：
- [.claude/docs/visual-elicitation-spec.md](visual-elicitation-spec.md) §8 implementation checklist
- [.claude/docs/HANDOFF-NEXT-SESSION.md](HANDOFF-NEXT-SESSION.md)（本檔）

## 已完成的事（branch claude/recursing-mahavira-1a4fa2，3 個 commit）

### Commit 1: web-chat UI 改 Claude.ai 風

- 暖色 + 扁平 + TutorABC 藍 accent (#003BFF light / #305FFF dark)
- 字型統一 Inter + Noto Sans TC（**不要 serif**，user 嫌復古）
- Material Symbols Outlined 取代所有 emoji
- 品牌 mark 從 🚀 改成藍底「P」
- Empty state 加 composer + 4 outlined cards
- [web-chat/mockup.html](../../web-chat/mockup.html) 留著當設計參考

### Commit 2: intake-interview 補視覺辯證流程

[.claude/skills/intake-interview/SKILL.md](../skills/intake-interview/SKILL.md) 加：
- **A. 7 維度成熟度檢核**（Q3 後執行）：背景/目標/使用者/旅程/現有方案/業務規則/競品。必填維度（1/2/3/6）任一不足就追問。
- **B. Visual Artifact Decision Rubric**：rubric 表決定要不要畫圖。**預設不畫**，命中表格時主動詢問。MVP 只實作 wireframe。
- **C. 4 個 GATE**：Q8 確認前必過。預期效益 (cf 10093) + 影響人數 (cf 10091) + 必填維度全達標 + 視覺輔助若啟動須完成一輪確認。即使 user 說「先送出」也擋。
- Description 模板改「最低必要 + 自由擴充」：5 必要段 + 8 選配段。
- 全檔 emoji 清乾淨，只留功能性 🔴🟠🟡🟢 priority 色塊。

### Commit 3: backend 串 Jira create-with-attachment

- [web-chat/backend/lib/markdown-to-adf.js](../../web-chat/backend/lib/markdown-to-adf.js)（新檔）：tokenizer + 3 自寫 parser（table / image / task list）+ md-to-adf 處理其餘。`[[IMG:filename]]` 為 image placeholder。
- [web-chat/backend/lib/jira.js](../../web-chat/backend/lib/jira.js)：加 `createIssue` / `addAttachment` / `patchDescription`。
- [web-chat/backend/server.js](../../web-chat/backend/server.js)：
  - `generate_wireframe` tool 規格更新：HTML 須含 `data-section` + `onclick="parent.postMessage(...)"`，cursor:pointer
  - 新 endpoint `POST /api/jira/create-with-attachment`，**dryRun 預設 true**
  - 3-step chain：createIssue → addAttachment → patchDescription
  - Component name → ID 對應；Reporter name → accountId 查詢

## 還沒做的事 — Phase C + D

### Phase C: 前端 wiring（明天主要工作）

照 [visual-elicitation-spec.md](visual-elicitation-spec.md) §8.C 清單：

| 工作 | 檔案 |
|------|------|
| CDN 引入 html2canvas | [web-chat/index.html](../../web-chat/index.html) |
| `captureWireframeAsPNG(el)` 函式 | [web-chat/app.js](../../web-chat/app.js) |
| `window.message` listener (postMessage bridge) | [web-chat/app.js](../../web-chat/app.js) |
| 「確認送出」流程改呼叫 `/api/jira/create-with-attachment` | [web-chat/app.js](../../web-chat/app.js) |
| 失敗 fallback：給 PNG 下載連結 | [web-chat/app.js](../../web-chat/app.js) |

關鍵 logic：

```js
// 1. postMessage bridge — 接 wireframe iframe 的 click 事件
window.addEventListener('message', e => {
  if (e.data?.type !== 'visual-edit') return;
  input.value = `想調整「${e.data.label}」：`;
  input.focus();
});

// 2. PNG snapshot
async function captureWireframeAsPNG(el, version = 1, ticketKey = 'PENDING') {
  await document.fonts.ready;  // 防中文方塊
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve({
      blob,
      filename: `wf-${ticketKey}-v${version}-${Date.now()}.png`,
    }), 'image/png', 0.95);
  });
}

// 3. 改 handleAction('確認送出') — 改成兩段式：先 dryRun 預覽，user 再次確認後才真送
async function submitTicketWithAttachment(ticket) {
  // 找最新 wireframe DOM
  const wfCard = document.querySelector('.wireframe-card:last-of-type');
  let attachments = [];
  if (wfCard) {
    const { blob, filename } = await captureWireframeAsPNG(wfCard);
    const dataBase64 = await blobToBase64(blob);
    // 替換 description 中 [[IMG:...]] 的檔名為實際 filename
    ticket.description = ticket.description.replace(
      /\[\[IMG:[^\]]+\]\]/g, `[[IMG:${filename}]]`
    );
    attachments = [{ filename, contentType: 'image/png', dataBase64 }];
  }

  // Stage 1: dryRun
  const dryRes = await fetch('/api/jira/create-with-attachment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, attachments, dryRun: true })
  });
  // 顯示 dryRun preview，user 確認後...
  
  // Stage 2: real
  const res = await fetch('/api/jira/create-with-attachment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, attachments, dryRun: false })
  });
  // 顯示 ticketKey + URL
}
```

### Phase D: 端到端 smoke test

**會建一張真的 RDC ticket**，建議：
- summary 加「(測試 — 可刪)」
- 完成後手動關掉或請 admin 刪
- 或先建一個專屬測試 project key（如有的話）

## 重要 user 偏好（office 機器若沒同步 ~/.claude/memory 也要記住）

從 ~/.claude/projects/-Users-febreyhuang-Documents-GitHub-ai-pm-assistant/memory/ 兩個檔案：

### 1. UI 字型 — 不要 serif
**規則：** 不要用 literary serif (Source Serif 4, Georgia, Noto Serif TC) 在產品 UI。一律 Inter + Noto Sans TC，靠 weight (600-700) + 負 letter-spacing (-0.02em ~ -0.025em) 撐 heading 份量。
**為何：** Febrey 在 web-chat mockup 階段拒絕 Source Serif 4，說「太復古」。Anthropic-style serif 不合 Febrey 美感。
**何時應用：** 任何 UI / 前端工作。

### 2. Emoji — 只保留功能性
**規則：** UI 元素 + AI 對話 prompt 都不放裝飾性 emoji。**只**保留 priority 急迫等級色塊 🔴🟠🟡🟢（顏色帶資訊）。
**為何：** Febrey 在 web-chat 階段說「拿掉所有 emoji」，後來細化成「保留功能性 (C) 選項」。
**例子：**
- ❌ Strip: 🚀 (brand), 👋 (greeting), 🔧 (decoration), 📋, ✅, ⚠️ (改用 Material Symbols `info`/`warning`), 🤖
- ✅ Keep: 🔴🟠🟡🟢, ❓ in checklists when status is "missing/unclear"

## 設計上的關鍵抉擇（避免明天重新討論）

1. **PDF vs PNG**：選 PNG。Jira description 內嵌、預覽穩定、ADF mediaSingle 直接支援。PDF 出局。
2. **PNG snapshot 工具**：MVP 用前端 html2canvas（零後端改動）。如果中文糊掉再換後端 Puppeteer。
3. **Jira 上傳**：MVP 自動上傳。MCP 沒有 addAttachment，所以走 Jira REST `/rest/api/3/issue/{key}/attachments`，已實作在 lib/jira.js。
4. **Description 內嵌時機**：3-step chain — createIssue 先放佔位段落 → addAttachment 拿 id → patchDescription 注入 mediaSingle。
5. **markdown→ADF**：md-to-adf 為底 + 自寫 table / image / tasklist 三個 parser。
6. **Image placeholder 語法**：`[[IMG:filename]]`（不是 `![]()`）— 避免 md-to-adf 把它當 text 處理。
7. **模板原則**：「最低必要 + 自由擴充」，不固定段落數。RDC-4437 的 `## 後續目標 / ## 盤點位置` 是選配段範例。
8. **GATE 不可繞過**：即使 user 說「先送出」也要禮貌拒絕。預期效益 + 影響範圍 + 必填維度都要齊。

## Quick verify 用的指令

```bash
# 後端 health check
curl http://localhost:3002/api/health

# Jira auth 驗證（讀-only，不會改任何東西）
cd web-chat/backend && node --input-type=module -e "
import 'dotenv/config';
const auth = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const r = await fetch(process.env.JIRA_BASE_URL + '/rest/api/3/myself', { headers: { Authorization: auth }});
console.log(r.status, (await r.json()).displayName);
"

# create-with-attachment dryRun 測試（不會建單）
node /tmp/test-create-with-attachment.mjs   # 此檔可能要重建（從 git history 抓 / 重寫）
```

## 不能繞過 main branch 的提醒

worktree 路徑：`.claude/worktrees/recursing-mahavira-1a4fa2`
branch：`claude/recursing-mahavira-1a4fa2`

明天到公司若 clone 是新的，請：
- 不要直接在 main 上做 — 先 `git checkout claude/recursing-mahavira-1a4fa2`
- 或在新分支接續：`git checkout -b claude/visual-elicitation-phase-c claude/recursing-mahavira-1a4fa2`

## 接手的 Claude 進場時可以說的話

> 你接手的是 visual elicitation 專案。Phase A (intake-interview SKILL.md) + Phase B (backend Jira create-with-attachment) 已完成並 commit 到 `claude/recursing-mahavira-1a4fa2` 分支。讀過這份 HANDOFF + visual-elicitation-spec.md §8 後，接著做 Phase C：前端 html2canvas + postMessage bridge + 「確認送出」改呼叫 /api/jira/create-with-attachment。dryRun 已驗證可用。
