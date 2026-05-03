# AI PM Assistant — Web Chat PRD

**版本**: v0.1 (MVP)
**最後更新**: 2026-04-21
**負責人**: Febrey Huang
**狀態**: 開發中（MVP 階段）

---

## 1. 背景與目標

### 1.1 問題陳述

TutorABC R&D 目前總監層級的需求開單流程有以下痛點：

| 痛點 | 影響 |
|------|------|
| 工單描述敷衍（「詳見附件」） | PM 和 RD 需要反覆追問，拖慢評估 |
| 必填欄位空洞或標題不規範 | 工單分類混亂，Component 和 Prefix 常缺漏 |
| Reporter 權限錯誤（非 jira-users-requester group）| 無法進入正常 Workflow |
| 加密附件（D-security）| AI 和網頁版 Office 都讀不到 |
| 缺乏初步的 UI/流程視覺化 | UI 類需求描述模糊，易誤解 |

### 1.2 目標

建立一個 **Web Chat AI 助理**，引導部門總監透過自然對話完成 Jira 開單流程，確保：
- 工單資訊完整（描述、影響人數、預期效益、急迫程度）
- 欄位規範（標題含 prefix、Component 正確、Priority 合理）
- Reporter 合法（在 `jira-users-requester` group 內）
- UI 類需求有 wireframe 輔助確認
- 全程在瀏覽器完成，無需熟悉 Jira 介面

### 1.3 成功指標

| 指標 | 目標 |
|------|------|
| 總監自主開單比例 | >= 70%（vs 請助理代開） |
| 工單初次描述完整度 | >= 80%（通過 audit 不需補資訊） |
| 開單流程平均時間 | <= 5 分鐘 |
| 提案人 Reporter 正確率 | 100% |

---

## 2. 使用對象

### 主要使用者
- **部門總監**（約 10-15 位）
  - 非技術背景，不熟 Jira 介面
  - 需求來源為：客訴、部門會議、主管指示
  - 平均一週開 1-3 張單

### 次要使用者
- **PM（Febrey）** — 監控工單品質、分析 usage
- **RD Owner** — 接單後追進度

### 不在範圍內
- 基層同仁（他們透過主管提需求）
- 外部客戶/合作方

---

## 3. 核心場景

### 場景 A：開需求單（訪談流程）

```
總監打開 Web Chat
    │
    ▼
點「開需求單」或直接說「我要開單」
    │
    ▼
AI 引導訪談（Q0 提案人 → Q7 補充）
    │
    ├─ Q0: 提案人 → 驗證 jira-users-requester group
    ├─ Q1: 需求/問題描述
    ├─ Q2: 影響人數
    ├─ Q3: 預期效益
    ├─ Q4: 附件（圖片/PDF）隨時接收
    ├─ Q5: 急迫程度（Highest 需追問原因）
    ├─ Q6: 對接窗口
    └─ Q7: 補充資料
    │
    ▼
AI 判斷：UI 類需求 → 產 Wireframe 確認
    │
    ▼
AI 產工單預覽卡（結構化）
    │
    ▼
總監「確認送出」
    │
    ▼
工單建立（狀態：草稿）
    │
    ▼
提醒：親自到 Jira 改狀態為「需求評審」
```

### 場景 B：回報 Bug

與需求單類似，但流程為：問題現象 → 復現步驟 → 影響範圍 → 截圖/錯誤訊息 → 急迫程度。

### 場景 C：查詢工單（未來）
目前不在 MVP 範圍。

---

## 4. 功能需求

### 4.1 P0 — MVP 必備（已完成）

| 需求 | 狀態 |
|------|------|
| Web Chat UI（深色主題、LobeChat 風格） | ✅ |
| Sidebar 對話列表 + localStorage 持久化 | ✅ |
| 訪談流程引導（Q0-Q7） | ✅ |
| 檔案上傳（圖片/PDF，5MB 上限） | ✅ |
| 文中引用圖片（`(圖一)(圖二)` inline 渲染） | ✅ |
| 拖拉、貼上、點選三種上傳方式 | ✅ |
| 圖片 Lightbox 放大預覽 | ✅ |
| 附件檔案 format 驗證（加密檔提示轉 PDF） | ✅ |
| 工單結構化預覽卡片 | ✅ |
| Wireframe 產生（UI 類需求） | ✅ |
| 中斷/續接對話 | ✅ |

### 4.2 P0 — MVP 必備（未完成）

| 需求 | 狀態 | 優先級 |
|------|------|-------|
| **Reporter 驗證（檢查 jira-users-requester group）** | ❌ 目前用信任制 | 🔴 高 |
| **工單預覽的確認送出 → 實際開 Jira 單** | ❌ 只有預覽 | 🔴 高（但可最後做）|

### 4.3 P1 — Pilot 階段需求

| 需求 | 狀態 |
|------|------|
| Streaming 回應（逐字顯示） | ❌ |
| 結構化錯誤訊息（Rate limit、Token 超額） | ⚠️ 模糊 |
| 後端對話持久化（現為記憶體） | ❌ |
| 部署到公司 Server | ❌ |
| 身份識別（至少固定登入） | ❌ |

### 4.4 P2 — 正式上線後補齊

| 需求 | 狀態 |
|------|------|
| OneDrive 附件整合（透過 Graph API） | ❌ |
| Usage 監控 Dashboard（誰用最多、每日 token） | ❌ |
| 對話 audit trail / log | ❌ |
| Per-user rate limit | ❌ |
| 工單 metadata 標註「AI-assisted」 | ❌ |
| Admin Dashboard（所有人開單品質） | ❌ |
| RWD 手機版優化 | ⚠️ 基本支援 |

---

## 5. 非功能需求

### 5.1 效能
- **首次回覆延遲** <= 3 秒（Sonnet + prompt cache）
- **串流回應** <= 1 秒（P1 需求）
- **Prompt Cache 命中率** >= 80%

### 5.2 可用性
- **瀏覽器支援**：Chrome / Edge / Safari 最新版
- **手機 RWD**：可用但非優化重點

### 5.3 安全
- **API Key 保護**：`.env` 檔案，不 commit git
- **CORS**：限制 frontend origin
- **附件處理**：僅在 request 期間留存，不落地儲存
- **對話隔離**：不同 conversation 互相看不到（靠 conversationId）

### 5.4 成本
- **模型**：Claude Sonnet 4.6（訪談階段）
- **單次訪談預估**：~$0.15 USD（含 prompt cache 折扣）
- **月預估（10 人 × 12 次）**：~$18 USD

### 5.5 資料隱私
- **對話內容**：Anthropic 預設不訓練（Team/API 方案）
- **附件**：傳給 Claude 後不落地，使用完即丟
- **使用者資料**：localStorage 存在使用者自己瀏覽器

---

## 6. 技術架構

```
┌─────────────────────────────────────────────────┐
│  Frontend (http://localhost:3000)                │
│  ├─ HTML + CSS + Vanilla JS                     │
│  ├─ LobeChat 風格深色主題                        │
│  ├─ localStorage 存對話歷史                       │
│  └─ 附件上傳（base64 encode）                    │
└─────────────────────┬───────────────────────────┘
                      │ HTTP POST /api/chat
                      │ (CORS allowed)
                      ▼
┌─────────────────────────────────────────────────┐
│  Backend (http://localhost:3002)                 │
│  ├─ Node.js 24 + Express 5                      │
│  ├─ @anthropic-ai/sdk                           │
│  ├─ In-memory conversation store                │
│  └─ System prompt loaded from:                  │
│     - .claude/agents/interviewer.md             │
│     - .claude/skills/intake-interview/SKILL.md  │
│     - .claude/rules/tutorabc-context.md         │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌──────────────┐
    │ Claude  │ │ Tools:  │ │ (未來) Jira  │
    │  API    │ │ 預覽卡  │ │     API      │
    │Sonnet4.6│ │Wireframe│ │ createIssue  │
    └─────────┘ └─────────┘ └──────────────┘
```

### Tool Use
- `generate_ticket_preview` — 產結構化工單預覽
- `generate_wireframe` — 產 HTML wireframe（UI 類需求）

---

## 7. 已知缺口 & Gap Analysis

### 🔴 P0 缺口（阻擋 Pilot）

| # | 缺口 | 影響 | 解法 |
|---|------|------|------|
| 1 | **Reporter 沒驗證 jira-users-requester group** | AI 信任使用者輸入，可能填到無權開單的人 | 預載 group member list OR 接 `lookupJiraAccountId` MCP |
| 2 | **工單沒真的建立** | 總監以為送出其實只是預覽 | 接 Jira API `createJiraIssue`（Febrey 說可以最後做）|
| 3 | **身份識別缺失** | 不知道是誰在用，Reporter 無法自動帶入 | MS365 SSO（需 IT 配合 Azure App） |

### 🟡 P1 缺口（Pilot 期間感受）

| # | 缺口 | 影響 |
|---|------|------|
| 1 | Streaming 回應 | 長回覆使用者覺得卡 |
| 2 | 後端重啟對話遺失 | 使用者體驗中斷 |
| 3 | 沒部署 | 無法多人同時用 |
| 4 | 錯誤訊息太籠統 | 出問題難 debug |

### 🟢 P2 缺口（未來強化）

| # | 缺口 | 何時做 |
|---|------|-------|
| 1 | OneDrive 加密檔案解析 | IT 同意給 Azure App 權限後 |
| 2 | Usage Dashboard | 有流量規模後 |
| 3 | 工單 AI-assisted tag | 接 Jira API 之後 |
| 4 | 管理員後台 | 正式上線後 |

---

## 8. 分階段計畫

### Phase 1: MVP 完成度（本階段）
目標：Web 頁面上走完完整訪談流程，產出預覽卡

- ✅ UI/UX 基礎
- ✅ 訪談流程
- ✅ 附件處理
- ✅ Inline 圖片
- ✅ Wireframe 生成
- ✅ 工單預覽卡
- ⏳ **修正 Reporter 驗證方式**（目前這階段）

### Phase 2: 內部 Pilot（2-3 位總監試用）
目標：真實場景驗證，收集 feedback

**必做：**
- 接 Jira API 真的建立工單
- 身份識別（至少手動固定 reporter）
- 部署到公司測試環境
- Streaming 回應
- 錯誤訊息改善

**時程預估：** 1-2 週

### Phase 3: 擴大使用（全部總監）
目標：取代原有開單流程

**必做：**
- SSO 整合（MS365）
- OneDrive 附件整合
- Usage monitoring
- 管理員看板

**時程預估：** 2-4 週

### Phase 4: 持續優化
- AI-assisted tag
- Workflow 整合其他 A-Team skill（triage、brief）
- 自動 weekly digest

---

## 9. 風險與相依

### 9.1 風險

| 風險 | 可能性 | 影響 | 緩解 |
|------|-------|------|------|
| API 成本失控 | 低 | 中 | Rate limit + 每日用量告警 |
| 總監不願意用（覺得比直接 Jira 麻煩） | 中 | 高 | Pilot 收集 feedback + 持續優化 UX |
| IT 不給 Azure App 權限 | 中 | 中 | 先用純 Jira Token 替代方案 |
| 加密檔案比例高 | 中 | 中 | 強制提示轉 PDF，追蹤使用者配合率 |
| Claude API 限流/服務中斷 | 低 | 高 | Fallback 到 Sonnet Haiku 模型 |

### 9.2 相依項目

- **Anthropic API** — 核心 AI 能力
- **Jira Atlassian API** — 未來開單用（Phase 2）
- **MS365 Graph API** — 未來 SSO + OneDrive（Phase 3）
- **IT 部門** — Azure App Registration（Phase 3）
- **公司 Server** — 部署（Phase 2）

---

## 10. 決策紀錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-04-21 | 採用 Web Chat 而非 Teams Bot | rd_leader 帳號無 M365 License，且 Teams Bot 需 IT 配合 |
| 2026-04-21 | 模型選 Sonnet 4.6 而非 Opus 4.7 | 成本低 60%，品質對訪談流程足夠 |
| 2026-04-21 | MVP 階段不接 Jira API | 先驗證訪談品質，Jira 串接放最後 |
| 2026-04-21 | 加密附件統一請使用者另存 PDF | D-security 無法讓 AI 直接讀，PDF 不受限制 |
| 2026-04-21 | 文中引用圖片用 `(圖一)(圖二)` 標記 | 比單純圖片陣列更直覺 |

---

## 11. Open Questions

- [ ] Reporter 驗證是用 API live 查，還是預載 group member list？
- [ ] Jira API credential 怎麼管理？每個總監一組 token，還是共用一個 service account？
- [ ] 對話歷史要保留多久？localStorage 有大小限制。
- [ ] Wireframe 要不要提供「匯出」讓使用者存下來討論？
- [ ] 是否需要多語言支援？目前只有繁中。

---

## 附錄：相關文件

- `.claude/agents/interviewer.md` — Interviewer Agent 定義
- `.claude/skills/intake-interview/SKILL.md` — 訪談流程 SOP
- `.claude/skills/uiux-design/SKILL.md` — M3 設計規範
- `.claude/rules/tutorabc-context.md` — Jira 環境知識（Components、Prefix、權限）
- `web-chat/backend/server.js` — 後端實作
- `web-chat/app.js` — 前端實作
