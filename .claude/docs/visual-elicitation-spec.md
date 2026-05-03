# Visual Elicitation Spec

> intake-interview 加入「視覺辯證需求」能力 — 訪談中產出 wireframe / 流程圖 / mindmap，使用者點擊調整，最終轉 PNG 自動上傳到 Jira 並內嵌進 Description。

**Owner:** Febrey
**Status:** Draft (2026-05-03)
**Related:**
- [.claude/skills/intake-interview/SKILL.md](../skills/intake-interview/SKILL.md) — 訪談主流程
- [web-chat/backend/server.js](../../web-chat/backend/server.js) — 已有 `generate_wireframe` tool
- [web-chat/backend/lib/jira.js](../../web-chat/backend/lib/jira.js) — Jira API helper（待擴充）

---

## 1. Goals & Non-Goals

### Goals

1. 訪談時用視覺輔助逼出總監腦中沒講清的需求
2. 使用者點擊圖上區塊就能告訴 AI 哪要改，不用從零描述
3. 最終圖以 PNG 形式自動上傳 Jira，內嵌進 Description 對應段落
4. 寧少勿多 — AI 預設不出圖，需要時才主動詢問

### Non-Goals

- 不取代 Figma — 產的是低擬真示意圖，不是設計稿
- 不做 PRD-prototype 雙向聯動（Jira 工單欄位限制）
- 不做檔案版本管理（v1.0 → v1.1 副本）— Jira 內建夠用
- 不在前端存圖 — 全部走後端 → Jira

---

## 2. Decision Rules

### 2.1 Visual Artifact Rubric（AI 內部判斷）

```
需求類型              Mindmap   Flowchart  Wireframe
────────────────────────────────────────────────
簡單 Bug                —          —          —
文案 / 設定值調整         —          —          —
e-Service              —          —          —
既有 UI 微調             —          —          🟢
新流程 / 多分支           —         🟢          —
新功能 / 新畫面           —        視情況       🟢
跨部門 / 範圍模糊         🟢        視情況        —
大型專案（3+ 系統）       🟢        🟢         🟢
```

**預設原則：** 寧少勿多。AI 心裡先過一次「這張單真的需要圖嗎？」，預設答案「不需要」。

### 2.2 Gating Conditions（必填閘門）

進入 ticket preview 前，**強制檢核**：

```
GATE 1: 預期效益 (cf 10093) 不可為空
GATE 2: 影響人數 (cf 10091) 不可為空
GATE 3: 7 維度成熟度檢核 — 必填維度（1/2/3/6）達標
        - 1 背景/痛點
        - 2 商業目標（= 預期效益）
        - 3 使用者/情境
        - 6 業務規則（驗收標準）
GATE 4: 視覺輔助若已啟動 → 至少完成一輪確認
```

任一 GATE 未過，AI 拒絕進入 preview 階段，禮貌性追問補齊。即使使用者說「先送出」也不可繞過。

### 2.3 7 維度成熟度檢核

疊加在既有 Q1-Q7 上，AI 在 Q3 後自評：

| # | 維度 | 必/選 | 對應既有 Q | 對應 Jira 欄位 |
|---|------|------|-----------|---------------|
| 1 | 背景/痛點 | 必 | Q1 | Description 開頭 |
| 2 | 商業目標 | 必 | Q3 | cf 10093 預期效益 |
| 3 | 使用者/情境 | 必 | Q2 | cf 10091 影響人數 + Description |
| 4 | 核心使用者旅程 | 視 | (新增追問) | Description / 視覺示意 |
| 5 | 現有方案 | 選 | (新增追問) | Description |
| 6 | 業務規則 | 必 | (新增追問) | Description 驗收標準 |
| 7 | 競品參考 | 選 | (新增追問) | Description 參考資料 |

**狀態標記：** [✓] 達標 / [?] 不清需追問 / [✗] 完全沒講 / [—] 不適用此單

---

## 3. User Flow

```
┌─────────────────────────────────────────────┐
│ Phase A: 訪談收集（Q0-Q3 既有不變）             │
└─────────────────────────────────────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ AI 自評 7 維度成熟度        │
       │ ┌─────────────────────┐   │
       │ │ 1 背景    [✓]        │   │
       │ │ 2 目標    [✓]        │   │
       │ │ 3 使用者  [?] ←追問   │   │
       │ │ 4 旅程    [—]        │   │
       │ │ 5 現有    [✗] ←追問   │   │
       │ │ 6 規則    [?] ←追問   │   │
       │ │ 7 競品    [—]        │   │
       │ └─────────────────────┘   │
       └───────────────────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 對照 Rubric → 是否需要圖？  │
       │   ├─ 不需要 → 跳到 Phase D  │
       │   └─ 需要 → Phase B        │
       └───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Phase B: 視覺輔助迴圈                          │
│ ┌─────────────────────────────────────────┐ │
│ │ AI: "我畫個 wireframe 確認方向？"         │ │
│ │ User: 同意 →                             │ │
│ │       ↓                                  │ │
│ │ generate_wireframe (Anthropic tool)      │ │
│ │       ↓                                  │ │
│ │ 前端 iframe 渲染 + click-to-edit         │ │
│ │       ↓                                  │ │
│ │ User 點擊區塊 → postMessage              │ │
│ │       → "想調整 [區塊名]"注入 chat input │ │
│ │       ↓                                  │ │
│ │ User 描述要怎麼改 → AI 重新生成          │ │
│ │       ↓                                  │ │
│ │ 反覆直到 User 滿意                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ User 確認方向            │
       └───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Phase C: 凍結成 PNG                          │
│ ┌─────────────────────────────────────────┐ │
│ │ html2canvas(wireframe DOM, scale: 2)    │ │
│ │ await document.fonts.ready              │ │
│ │ canvas.toBlob() → PNG blob              │ │
│ │ 命名: wf-{ticketKey}-v{n}-{timestamp}.png │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Q4-Q9 訪談收尾             │
       │ Q8 確認預覽（含 PNG 縮圖）  │
       └───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Phase D: 開單 + 上傳（3-step chain）           │
│                                              │
│ Step 1: createJiraIssue                      │
│   description = 純文字版（含 [視覺示意 預留]） │
│   → 拿到 ticketKey (e.g. RDC-9999)           │
│                                              │
│ Step 2: POST .../attachments                 │
│   multipart/form-data, file=<PNG blob>       │
│   → 拿到 attachment id + filename            │
│                                              │
│ Step 3: editJiraIssue                        │
│   description 改寫，把 [視覺示意 預留] 換成    │
│   !wireframe-RDC9999-v1.png|width=600!       │
└─────────────────────────────────────────────┘
                     │
                     ▼
        ✅ AI 回覆連結 + 提醒改狀態
```

---

## 4. Architecture

### 4.1 Frontend ([web-chat/app.js](../../web-chat/app.js))

新增模組（不破壞現有 `renderWireframe`）：

```js
// 1. PNG 凍結（既有 wireframe-card → blob）
async function captureWireframeAsPNG(wireframeEl, version) {
  await document.fonts.ready;
  const canvas = await html2canvas(wireframeEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
  });
}

// 2. postMessage bridge（iframe → 主頁）
window.addEventListener('message', e => {
  if (e.data?.type !== 'visual-edit') return;
  const { artifact, sectionLabel } = e.data;
  input.value = `想調整「${sectionLabel}」：`;
  input.focus();
});

// 3. iframe 內注入 click handler（在 generate_wireframe 產出的 HTML 內）
//    這部分由 server.js 的 wireframe HTML template 加入
```

新加 lib：`html2canvas` via CDN

### 4.2 Backend ([web-chat/backend/server.js](../../web-chat/backend/server.js))

#### 既有不動
- `/api/chat` — 訪談主端點
- `generate_wireframe` tool — 既有 wireframe HTML 生成
- `generate_ticket_preview` tool — preview 結構化資料

#### 修改
- `generate_wireframe` 的 `html` 規格新增：「每個可獨立識別的區塊（按鈕、表單、區段）必須加 `data-section="{name}"` 和 `onclick` handler 觸發 `parent.postMessage({type:'visual-edit', artifact:'wireframe', sectionLabel:'{中文標籤}'}, '*')`」

#### 新增 endpoints

```
POST /api/jira/create-with-attachment
  body: {
    ticket: { /* generate_ticket_preview 的結構 */ },
    attachments: [{ filename, dataBase64, contentType }]
  }
  flow:
    1. createIssue(ticket) → ticketKey
    2. for each attachment:
         addAttachment(ticketKey, ...) → attachmentId
    3. patchDescription(ticketKey, attachmentRefs)
  response: { ticketKey, url, attachmentIds[] }
```

### 4.3 Backend ([web-chat/backend/lib/jira.js](../../web-chat/backend/lib/jira.js))

新增三個函式：

```js
export async function createIssue(payload) {
  // POST /rest/api/3/issue
  // payload = { fields: { project, issuetype, summary, description (ADF), priority, components, customfield_10091, customfield_10093, reporter } }
  // returns { key, id, self }
}

export async function addAttachment(ticketKey, file) {
  // POST /rest/api/3/issue/{ticketKey}/attachments
  // headers: X-Atlassian-Token: no-check
  // body: FormData with field 'file'
  // file = { filename, buffer, contentType }
  // returns [{ id, filename, content (URL) }]
}

export async function patchDescription(ticketKey, descriptionADF) {
  // PUT /rest/api/3/issue/{ticketKey}
  // body: { fields: { description: descriptionADF } }
}
```

---

## 5. Description Structure

### 5.1 模板原則：最低必要 + 自由擴充

**模板只規範「Workflow 強制 + 訪談必收」的段落，其他段落 AI / 使用者可依工單性質自由補充。**

#### 必要段落（模板強制）

| 順序 | 段落 | 來源 | 條件 |
|-----|------|------|------|
| 1 | `## 背景與問題` | Q1 整理 | 永遠必填 |
| 2 | `## 期望結果` | Q3 = 預期效益 | 永遠必填（對應 cf 10093） |
| 3 | `## 驗收標準` | 業務規則追問 | 永遠必填，至少 1 條 |
| 4 | `## 視覺示意` | AI 產出 + user 確認 | **僅在 Visual Artifact 啟動時出現** |
| 5 | `## 對應窗口` | Q0 + Q6 | 永遠必填 |

#### 選配段落（依需求自由加）

AI 可依訪談內容自動加，使用者也可手動加：

- `## 影響範圍與使用者` — 當使用者角色複雜（多 role / 多階段）
- `## 現有方案` — 當需求是優化（不是全新功能）
- `## 後續目標` — 當這張單是一系列工作的前置（如 RDC-4437）
- `## 盤點位置` — 當需要列既有素材連結（Figma / Confluence / 競品）
- `## 風險與限制` — 當有明確 deadline、上線時間窗、依賴
- `## 參考資料` — 總監提供的文件解析結果（與「視覺示意」分清楚來源）
- 其他段落 — AI 自由判斷，使用者可在 Q8 確認時要求增刪

**原則：**
- 「視覺示意」= AI 產的圖（machine-generated）
- 「參考資料」= 總監提供的素材（human-provided）
- 工單個別差異很大，模板不該強迫一致

#### 範例 — RDC-4437 風格（含選配段落）

```markdown
## 背景與問題
目前教室版本眾多，缺乏完整的功能對照表...

## 期望結果
整理目前線上所有教室版本的功能對照表...

## 驗收標準
1. 涵蓋所有線上教室版本的功能差異對照
2. 以矩陣或表格形式呈現，一目瞭然

## 視覺示意                  ← 必要（Visual Artifact 啟動時）
[[IMG:wf-RDC4437-v1.png]]

## 後續目標                  ← 選配（這張單需要）
- 優化 Demo 版教室
- 整合教室

## 盤點位置                  ← 選配（這張單需要）
- Website [Figma](https://...)
- App [Figma](https://...)

## 對應窗口
- 提案人：Febrey Huang
- 主要對應窗口：Febrey Huang
```

### 5.2 Markdown → ADF 轉換策略

**底層用 `md-to-adf` (npm v0.6.4)，自寫補強 3 個它不支援的關鍵格式。**

#### md-to-adf 已支援（直接交給它）

heading H1-H6、paragraph、bold / italic / strikethrough、inline code、code block、blockquote、horizontal rule、ordered / bulleted lists（含 nested）、links、emoji、line break。

#### 自寫擴充（在 md-to-adf 前後處理）

| 格式 | Markdown 語法 | 為何自寫 |
|------|--------------|---------|
| **Table** | 標準 GFM `\| col \|` | md-to-adf 沒 table parser |
| **Image** | 自訂 `[[IMG:filename]]` | md-to-adf 把 image 當 text，且 Jira 需要 attachment id（建單前還沒有） |
| **Task list** | 標準 GFM `- [ ]` / `- [x]` | md-to-adf 解析成普通 list |

#### Pipeline

```
markdown
   │
   ▼
Tokenizer：行掃描分四類 segment
   ├─ TABLE        → 自寫 table parser → ADF table node
   ├─ IMAGE        → 自寫 placeholder parser → ADF mediaSingle node
   ├─ TASK_LIST    → 自寫 task parser → ADF taskList node
   └─ MARKDOWN     → md-to-adf → ADF nodes
   │
   ▼
按原順序串接 segment → { type: "doc", version: 1, content: [...] }
```

#### Image 注入時機（two-stage fill-in）

```
Stage A：訪談中 AI 產 description markdown
        裡面用 [[IMG:wf-RDC9999-v1.png]] 佔位符

Stage B：開單流程
  Step 1: createIssue with description (markdown 先轉 ADF，IMG 部分先放空 mediaSingle)
  Step 2: addAttachment → 拿到 attachment id
  Step 3: editJiraIssue：
          - 找出所有空 mediaSingle 節點
          - 用 attachment id 填回 attrs.id
          - PUT 整份新 description
```

或更簡單：**Step 2 上傳完一次性把 IMG placeholder 都換掉再做 Step 1 createIssue**，但這需要先 createIssue 拿 ticketKey 才能 attach（chicken-and-egg）。所以還是要分 3 步。

#### ADF Node 規格

詳見 §5.3 三類自寫節點的具體 JSON 結構。

### 5.3 Custom ADF Node Specs

#### Table

```json
{
  "type": "table",
  "attrs": { "isNumberColumnEnabled": false, "layout": "default" },
  "content": [
    {
      "type": "tableRow",
      "content": [
        { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Col" }] }] }
      ]
    },
    {
      "type": "tableRow",
      "content": [
        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Cell" }] }] }
      ]
    }
  ]
}
```

#### MediaSingle

```json
{
  "type": "mediaSingle",
  "attrs": { "layout": "center", "width": 60 },
  "content": [{
    "type": "media",
    "attrs": {
      "type": "file",
      "id": "{attachmentId}",
      "collection": ""
    }
  }]
}
```

`attachmentId` 從 Step 2 上傳 response 取。`width` 60 = 容器寬度的 60%。

#### TaskList

```json
{
  "type": "taskList",
  "attrs": { "localId": "tasklist-uuid" },
  "content": [
    {
      "type": "taskItem",
      "attrs": { "localId": "task-uuid-1", "state": "TODO" },
      "content": [{ "type": "text", "text": "Task description" }]
    },
    {
      "type": "taskItem",
      "attrs": { "localId": "task-uuid-2", "state": "DONE" },
      "content": [{ "type": "text", "text": "Completed task" }]
    }
  ]
}
```

`localId` 用 `crypto.randomUUID()` 產生即可。`state` 只有 `"TODO"` 或 `"DONE"`。

---

## 6. Edge Cases & Risks

| # | 風險 | 防範 |
|---|------|------|
| 1 | html2canvas 中文方塊（字型未載完） | `await document.fonts.ready` 後再 capture |
| 2 | wireframe 含 SVG（如 mermaid）光柵化糊 | `scale: 2` 救；嚴重時切換後端 Puppeteer |
| 3 | Jira API 上傳失敗（網路 / 認證 / 額度） | 3-step chain 任一 fail 就 rollback：刪除已建工單，回 chat 顯示錯誤 |
| 4 | createIssue 成功但 attachment 失敗 | 不刪工單，但 description 不內嵌圖；給使用者下載 PNG 連結手動補附件 |
| 5 | editIssue 失敗 | 同上，attachment 已存在但 description 沒引用，附件清單仍可看到 |
| 6 | 多輪迭代版本混淆 | PNG 檔名帶 `-v{n}-{timestamp}` |
| 7 | 使用者點 wireframe 區塊但 AI 沒給該區塊加 click handler | postMessage 不會觸發；fallback 是純文字描述 |
| 8 | Jira 工單 attachment size 限制 | 預設 10MB；PNG @ 2x scale 一張 wireframe 通常 <500KB，足夠 |
| 9 | 點擊 hotspot AI 重畫整張 → 已確認部分被改動 | 提示使用者「重新確認其他區塊」；Phase 2 做局部 patch |
| 10 | 使用者確認後反悔 | createIssue 已成功就無法 undo；可呼叫 transitionIssue 改回「草稿」狀態 |

---

## 7. MVP vs Phase 2

### MVP（這次要做）

- [x] 7 維度檢核疊加進 intake-interview SKILL.md
- [x] 預期效益 + 影響範圍 gating
- [x] Visual artifact rubric 寫進 SKILL.md
- [x] AI 詢問是否出圖（不主動畫）
- [x] generate_wireframe tool 加 click handler 規格
- [x] 前端 postMessage bridge + chat input 注入
- [x] html2canvas → PNG（前端）
- [x] createIssue / addAttachment / patchDescription 三個 jira.js 函式
- [x] `/api/jira/create-with-attachment` 新 endpoint
- [x] Description 加「## 視覺示意」段落結構
- [x] 既有 SKILL.md emoji 清理（保留 🔴🟠🟡🟢）

### Phase 2（之後做）

- [ ] Mindmap（Mermaid mindmap syntax + iframe 渲染）
- [ ] Flowchart（Mermaid flowchart）
- [ ] 局部 patch（不重畫整張）
- [ ] 多版本對話歷史回看
- [ ] 後端 Puppeteer 取代 html2canvas（如果品質不夠）
- [ ] 自動 transitionJiraIssue 從草稿改成需求評審（如果 PM 授權）

### Phase 3（看需求）

- [ ] 圖文並排 PDF 匯出（如果有人要分享 offline）
- [ ] Confluence 同步嵌入

---

## 8. Implementation Checklist

按依賴順序：

### A. SKILL.md 文件層

1. [.claude/skills/intake-interview/SKILL.md](../skills/intake-interview/SKILL.md)
   - [ ] 加「7 維度成熟度檢核」章節（Q3 後）
   - [ ] 加「Visual Artifact Rubric」章節
   - [ ] Q8 確認流程加 4 個 GATE 檢查
   - [ ] Description 模板加「## 視覺示意」段落
   - [ ] 清裝飾性 emoji（保 🔴🟠🟡🟢）

### B. Backend 層

2. [web-chat/backend/lib/markdown-to-adf.js](../../web-chat/backend/lib/markdown-to-adf.js) — **新檔**
   - [ ] 安裝 `md-to-adf` 依賴
   - [ ] `convert(markdown, attachmentMap)` 主函式
   - [ ] Tokenizer：分辨 TABLE / IMAGE / TASK_LIST / MARKDOWN segments
   - [ ] Table parser → ADF table node
   - [ ] `[[IMG:filename]]` parser → ADF mediaSingle node（attachmentMap 給 id）
   - [ ] Task list parser → ADF taskList node
   - [ ] 包 md-to-adf 處理 MARKDOWN segment
   - [ ] 串接成 final ADF doc
3. [web-chat/backend/lib/jira.js](../../web-chat/backend/lib/jira.js)
   - [ ] `createIssue(payload)`
   - [ ] `addAttachment(ticketKey, file)`
   - [ ] `patchDescription(ticketKey, descriptionADF)`
4. [web-chat/backend/server.js](../../web-chat/backend/server.js)
   - [ ] `generate_wireframe` 的 `html` 規格更新（加 `data-section` + click handler）
   - [ ] `generate_ticket_preview` 的 description 規格更新（用 `[[IMG:filename]]` 佔位、模板只規範必要段落）
   - [ ] 新 endpoint `POST /api/jira/create-with-attachment`（內部執行 3-step chain）

### C. Frontend 層

5. [web-chat/index.html](../../web-chat/index.html)
   - [ ] CDN 引入 html2canvas
6. [web-chat/app.js](../../web-chat/app.js)
   - [ ] `captureWireframeAsPNG(el)` 函式
   - [ ] `window.message` listener (postMessage bridge)
   - [ ] 「確認送出」流程改呼叫 `/api/jira/create-with-attachment`
   - [ ] 失敗 fallback：給 PNG 下載連結

### D. 驗證

7. 端到端 smoke test
   - [ ] Empty state → 開單流程跑完
   - [ ] 7 維度檢核會擋送出
   - [ ] Wireframe 點擊 → chat 正確注入
   - [ ] PNG 上傳到 Jira（test 環境）
   - [ ] Description 內嵌圖正確顯示
   - [ ] 中文字沒有方塊
