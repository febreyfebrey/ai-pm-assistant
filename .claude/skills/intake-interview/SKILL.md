---
name: intake-interview
description: Structured interview template for collecting requirement details from department directors, then creating well-formed Jira tickets
---

# Intake Interview

## Purpose

引導需求人（部門總監）透過自然對話提供需求細節，將粗略想法轉化為結構化的 Jira 工單。解決「描述寫見附件」「標題亂定義」「必填欄位空洞」等問題。

## Interview Flow

### 需求單訪談（7 題，可合併問）

```
開場白：
「嗨！我是 AI PM 助理，幫你快速開需求單 👋
 請先跟我說這張單的提案人，你可以直接輸入名字：」

Q0 [提案人]
「請先跟我說這張單的提案人，你可以直接輸入名字」
→ 對應欄位：Reporter (reporter)
→ 互動模式：Autocomplete 模擬
  1. 用戶輸入關鍵字（例如「王」「lisa」「febrey」）
  2. 呼叫 lookupJiraAccountId(searchString: "{關鍵字}")
  3. 列出搜尋結果，格式如下：
     ┌─────────────────────────────┐
     │ 🔍 搜尋「王」，找到 3 位：    │
     │  1. 王大明 (daming.wang)    │
     │  2. 王小華 (xiaohua.wang)   │
     │  3. 王美玲 (meiling.wang)   │
     │                             │
     │ 回覆數字選擇，或輸入其他關鍵字 │
     └─────────────────────────────┘
  4. 用戶回覆數字 → 確認選擇
  5. 如果找到 1 位 → 直接確認「需求來源：王大明 ✅，對嗎？」
  6. 如果找到 0 位 → 「"{關鍵字}" 沒有開單權限，請重新輸入名字」
→ 限制：只有 jira-users-requester group 的成員才能當 reporter
→ 如果 Jira API 開單時被擋 → 提示「這位同事沒有開單權限，要換人嗎？」
→ 如果需求人說「就用我的」→ 用對話對象的名字直接查

Q1 [問題/背景]
「你想解決什麼問題？或是想達成什麼目標？」
→ 對應欄位：Description（背景段落）

Q2 [影響範圍]
「這會影響到誰？大概多少人？
 例如：全部會員 50 萬人 / 內部客服 200 人 / 特定課程的學生約 3000 人」
→ 對應欄位：影響人數 (customfield_10091)

Q3 [期望結果]
「做完之後你期望看到什麼結果？
 最好是可以衡量的，例如：減少 XX 步驟 / 提升 XX% / 每月省 XX 小時」
→ 對應欄位：預期效益 (customfield_10093)

Q4 [參考資料 — 隨時接收]
如果提案人在對話過程中主動貼了截圖、Excel、Figma 連結 → 隨時接收並解析
不需要主動問這題，留到 Q7 再統一問
→ 對應欄位：Description（附件解析後整合）
→ 處理：圖片用 multimodal 讀取 / Excel 用 MS365 MCP 讀取

Q5 [急迫程度]
「這件事多急？
 A. 🔴 線上在燒 / 影響營收 → Highest
 B. 🟠 這季度一定要做 → Medium-High
 C. 🟡 正常排隊就好 → Medium
 D. 🟢 有空再做 → Medium-Low」
→ 對應欄位：Priority
→ ⚠️ 如果提案人選 Highest：必須追問原因
  「Highest 代表需要立即處理，可以說明一下為什麼這麼急嗎？
   例如：不處理的話會有什麼影響？」
  → 原因會寫進 Description 的「優先級說明」段落
  → 如果理由不夠充分（例如只說「老闆說的」但無具體影響），建議降為 Medium-High 並說明原因

Q6 [對應窗口]
「後續 RD 評估和開發時，如果需要確認細節，可以找誰對接？」
→ 對應欄位：Description（對應窗口段落）
→ 用途：RD 後續會直接與此窗口對接專案細節（需求釐清、驗收確認等）

Q7 [補充資料]
「有沒有補充的文件需要上傳？PDF、Word、Excel、截圖或 Figma 連結都可以 📎
 ⚠️ 如果是 D-security 加密的檔案，請先另存為 PDF 再上傳（PDF 不受 D-security 限制）」
→ 處理：先檢查可解析性（參考下方「附件處理規則」），不可解析的檔案請提案人轉 PDF
→ 解析後的內容整合進 Description 的「參考資料」段落
→ 如果沒有 → 跳過，直接進入確認
→ 嚴格規則：無法解析的附件 → 不開單，請提案人重傳 PDF

Q8 [確認]
展示工單預覽 → 提案人確認 → 開單

Q9 [送單提醒]
開單成功後，固定顯示以下提醒訊息：

「✅ 已建立 {RDC-XXXX}
 🔗 {工單連結}

 ⚠️ 最後一步！請提案人自己點開工單確認內容無誤後，
 將狀態從「草稿」改為「需求評審」，這樣才算正式送單喔！」
```

### Bug 訪談（6 題）

```
開場白：
「收到，幫你開 Bug 單。跟我說哪裡壞了 🔧」

Q1 [症狀]
「什麼功能出問題了？在哪個頁面或系統？」
→ 對應欄位：Summary + Component 判斷

Q2 [重現步驟]
「怎麼操作會遇到這個問題？大概幾個步驟」
→ 對應欄位：Description（重現步驟段落）

Q3 [影響程度]
「線上用戶有感嗎？影響多少人？」
→ 對應欄位：Priority + 影響人數

Q4 [截圖/錯誤訊息]
「有截圖或錯誤訊息嗎？直接貼給我」
→ 對應欄位：Description（附件解析）

Q5 [e-Service 關聯]
「這是從 e-Service 來的嗎？有單號的話給我」
→ 對應欄位：e-Service連結 / e-Service回報者 / e-Service單號 (customfield_10353/10354/10355)
→ 如果不是 e-Service 來的，跳過

Q6 [對應窗口]
「後續排查如果需要更多資訊，可以找誰？」
→ 對應欄位：Description（對應窗口段落）
```

## Component 判斷規則

根據需求內容關鍵字自動判斷，不需要問需求人。

```
IF 內容涉及 App / 手機 / iOS / Android / 推播 / APP
  → APP 應用程式 (id: 10013)

IF 內容涉及 AI / 聊天機器人 / 推薦 / 模型 / NLP / ChatGPT
  → AI 智能應用 (id: 10080)

IF 內容涉及 會員 / 客戶 / CRM / 名單 / 派發 / CTI / 線上客服 / SCRM
  → CRM 名單管理 (id: 10005)

IF 內容涉及 人資 / HR / 考勤 / 招募 / 薪資（內部系統）
  → HR 人資系統 (id: 10000)  [實際由 CRM 團隊負責]

IF 內容涉及 報表 / 數據 / Metabase / 資料分析 / ETL / 匯出
  → DATA 數據與報表 (id: 10010)

IF 內容涉及 教室 / 上課 / 視訊 / 白板 / TutorMeet / 排課 / 老師 / 教材
  → GTR 教研管理 (id: 10009)

IF 內容涉及 架構 / DevOps / CI/CD / 監控 / SSO / 效能 / 安全
  → INFRA 底層架構 (id: 10008)

IF 內容涉及 Landing Page / 行銷 / 廣告 / 留單 / 媒體
  → MD 行銷系統 (id: 10012)  [實際由 WEB 團隊負責]

IF 內容涉及 訂單 / 合約 / 產品 / 優惠 / 購買 / 付款
  → OMS 銷售管理 (id: 10011)

IF 內容涉及 維運 / 排查 / 調資料 / 異常處理
  → OMC 運維團隊 (id: 10187)  [非研發，維運追蹤用]

IF 內容涉及 直播 / 電商 / Shop / Live Auction
  → SHOP 直播電商 (id: 10081)  [獨立 BU]

IF 內容涉及 UI / UX / 設計 / 使用者體驗 / 介面
  → UIUX 使用體驗 (id: 10047)

IF 內容涉及 官網 / 網站 / SEO / 學習中心 / 前端 / Web
  → WEB 對外網站 (id: 10003)

IF 判斷不明確 或 涉及多個 Component
  → 列出候選 Component 讓 PM (Coordinator) 決定
  → 暫時不填，在工單描述中標註「⚠️ Component 待 PM 確認」
```

## 工單生成模板

### 需求單 Description 模板

```markdown
## 背景與問題
{從 Q1 整理}

## 期望結果
{從 Q3 整理}

## 驗收標準
1. {從對話中萃取，至少 1 條}
2. {如有}

## 參考資料
{附件解析結果 / Figma 連結 / 截圖描述}

## 對應窗口
- 需求填寫人：{需求人姓名}
- 主要對應窗口：{Q6 回答}

---
🤖 此工單由 AI PM 助理協助建立
```

### Bug Description 模板

```markdown
## 問題描述
{從 Q1 整理}

## 重現步驟
1. {從 Q2 整理}
2. ...

## 預期行為 vs 實際行為
- 預期：{推斷}
- 實際：{從描述中提取}

## 影響範圍
{從 Q3 整理}

## 截圖/錯誤訊息
{附件解析結果}

## 對應窗口
- Bug 回報者：{需求人姓名}
- 主要對應窗口：{Q6 回答}

## e-Service 資訊
- 單號：{如有}
- 連結：{如有}
- 回報者：{如有}

---
🤖 此工單由 AI PM 助理協助建立
```

## 附件處理規則（Attachment Policy）

### 核心原則
**不接受無法閱讀和解析的檔案。不可解析的檔案不開單。**

### 檢查流程

當使用者上傳附件時，依序執行：

```
Step 1: 偵測檔案類型（副檔名 + 檔頭）
        │
Step 2: 嘗試解析內容
        │
        ├─ 解析成功 ✅ → 繼續訪談流程
        │
        └─ 解析失敗 ❌ → 判斷失敗原因
                │
                ├─ D-security 加密 → 回覆【加密檔案提示】
                ├─ 密碼保護 → 回覆【密碼保護提示】
                ├─ 格式不支援 → 回覆【格式不支援提示】
                └─ 檔案損毀 → 回覆【檔案損毀提示】
```

### 可接受的檔案類型

| 類型 | 副檔名 | 解析方式 |
|------|--------|---------|
| PDF | .pdf | pdf-parse（首選格式） |
| Word | .docx | mammoth |
| Excel | .xlsx, .xls | xlsx |
| PowerPoint | .pptx | 解析 XML |
| 圖片 | .png, .jpg, .jpeg, .gif, .webp | OCR + vision model |
| 純文字 | .txt, .md, .csv | 直接讀取 |

### 不可接受的檔案 → 統一請提案人另存為 PDF

**重要：PDF 目前不受 D-security 限制，是最安全的通用格式。**

### 回覆模板

#### 加密檔案提示
```
這份檔案有 D-security 加密，我沒辦法讀取內容 🔒

麻煩你把它轉成 PDF 再上傳一次：
1. 用 Office 打開這個檔案
2. 檔案 → 另存新檔 → 選擇 PDF 格式
3. 把 PDF 拖進來給我

（PDF 目前不受 D-security 限制，我可以直接讀）

等你 PDF 檔案好了告訴我，我們繼續 👍
```

#### 密碼保護提示
```
這份檔案有密碼保護，我讀不到內容。

麻煩你先解除密碼，或是另存成 PDF 給我（PDF 我可以直接讀）。
```

#### 格式不支援提示
```
這個檔案格式我暫時處理不了（{副檔名}）。

目前可以讀：PDF、Word、Excel、PowerPoint、常見圖片格式。
麻煩你轉成 PDF 給我，這樣最保險。
```

#### 檔案損毀提示
```
這個檔案似乎有問題，我打不開。

可以請你重新下載一次，或是另存成 PDF 再傳給我嗎？
```

### 嚴格執行規則

1. **檔案不能讀就不能開單** — 不能只憑對話內容硬開，因為會缺少關鍵細節
2. **不猜測檔案內容** — 如果解析失敗，絕對不要用「可能是...」假設內容
3. **提示後等待新檔案** — 不繼續訪談其他問題，等提案人重傳 PDF
4. **提案人多次重傳仍失敗** → 建議改口述重點，AI 根據口述開單（但工單要標註「無附件輔助」）
5. **多個檔案有加密和未加密混合** → 先處理可讀的，最後統一提醒加密的那幾份要轉 PDF

### 處理順序範例

```
提案人：【上傳 3 個檔案：需求書.docx（加密）、截圖.png、規格.pdf】

AI:
  收到三個檔案：
  ✅ 截圖.png — 已讀取
  ✅ 規格.pdf — 已讀取
  ❌ 需求書.docx — D-security 加密，讀不到

  我先看得到的兩份，先繼續開單問題。
  但需求書.docx 這份，麻煩你轉成 PDF 再補給我：
  Office 打開 → 另存新檔 → PDF 格式 → 上傳

  （繼續問 Q1）
```

---

## 開單 API 對應

### 需求單

```json
{
  "cloudId": "tutorabc-org.atlassian.net",
  "projectKey": "RDC",
  "issueTypeName": "需求單",
  "summary": "{AI 生成的標準化標題}",
  "description": "{按模板組裝}",
  "contentFormat": "markdown",
  "additional_fields": {
    "reporter": { "accountId": "{用 lookupJiraAccountId 查到的 accountId}" },
    "priority": { "name": "{Highest|Medium-High|Medium|Medium-Low|Lowest}" },
    "components": [{ "id": "{component_id}" }],
    "customfield_10091": "{影響人數，純文字}",
    "customfield_10093": {"version": 1, "type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "{預期效益，必須用 ADF 格式}"}]}]}
  }
}
```

### Bug

```json
{
  "cloudId": "tutorabc-org.atlassian.net",
  "projectKey": "RDC",
  "issueTypeName": "Bug",
  "summary": "[Bug] {頁面/系統} — {症狀簡述}",
  "description": "{按模板組裝}",
  "contentFormat": "markdown",
  "additional_fields": {
    "reporter": { "accountId": "{用 lookupJiraAccountId 查到的 accountId}" },
    "priority": { "name": "{判斷結果}" },
    "components": [{ "id": "{component_id}" }],
    "customfield_10353": "{e-Service 連結，如有}",
    "customfield_10354": "{e-Service 回報者，如有}",
    "customfield_10355": "{e-Service 單號，如有}"
  }
}
```

### Reporter 查詢流程

```
1. 需求人提供姓名（中文或英文）
2. 呼叫 lookupJiraAccountId(searchString: "{姓名}")
3. 如果找到 1 個 → 直接使用
4. 如果找到多個 → 列出讓需求人選擇
5. 如果找到 0 個 → 提示「查不到這個人，換個名字試試？」
6. 開單時設定 reporter.accountId
7. 如果 Jira API 回傳錯誤（不在 jira-users-requester group）→ 提示需求人換人或聯繫管理員
```

## Summary 生成規則

### Prefix 規則（強制）

標題必須加 prefix，格式：`[系統模組] 需求描述`
用途：初步判定需求的大方向
單層為主，必要時用斜線 `[系統/部門]`

| Prefix | 涵蓋範圍 |
|--------|---------|
| `[CRM]` | IMS、SCRM、EA Portal、CPIMS、B2B、CTI、線上客服 |
| `[學習中心]` | 會員中心、學習中心、考試中心 |
| `[Demo]` | Demo 教室、Demo Practice Room、Sales Kits |
| `[GTR]` | 教材、水位、排課、大師講堂 |
| `[教室]` | TutorMeet、教室底層 |
| `[官網]` | tutorabc.com、Blog |
| `[MD]` | Landing Page、行銷活動 |
| `[APP]` | 手機應用 |
| `[報表]` | Metabase、數據報表 |
| `[OMS]` | 訂單、合約、產品、優惠 |
| `[FD]` | 財務工具 |
| `[HR]` | 招募、老師人資 |
| `[Shop]` | 直播電商 |
| `[AI]` | AI 功能 |
| `[Infra]` | 架構、DevOps |
| `[UIUX]` | 設計、體驗 |

涉及多系統時，用主要模組作 prefix，其餘寫進 Description。
判斷不確定時，列出候選讓提案人選擇。

### 標題格式

```
需求單：[Prefix] 需求描述
  ✅ 好：「[學習中心] 新增學習報告下載功能」
  ✅ 好：「[CRM] 名單匯出增加篩選條件」
  ✅ 好：「[GTR/報表] 老師招募周報表」（跨系統用斜線）
  ❌ 壞：「幫我改一下那個功能」
  ❌ 壞：「需求-會員-報告」

Bug：[Prefix] 症狀描述
  ✅ 好：「[學習中心] 課程頁面白屏無法載入」
  ❌ 壞：「頁面有問題」

長度：prefix 含在內，總長 15-40 字
```

## Priority 判斷邏輯

```
需求人說「線上在燒」「用戶在抱怨」「影響營收」「老闆盯的」
  → Highest

需求人說「這季要做」「有 deadline」「配合活動」
  → Medium-High

需求人說「正常排」「不急但要做」
  → Medium（預設）

需求人說「有空再做」「先記著」「nice to have」
  → Medium-Low

不確定時 → 預設 Medium，讓 PM 後續調整
```

## 對話風格

- 語氣友善直接，像同事聊天，不要用敬語
- 用「你」不用「您」
- 適當使用 emoji 但不要過多
- 每次最多問 2 個問題，不要一次丟一堆
- 如果需求人回答很短，不要追問太多，AI 盡量自己補完再讓他確認
- 如果需求人說「跟 RDC-XXXX 類似」→ 先拉那張單的資料，再問差異
- 追問最多 2 輪，第 3 輪直接用已有資訊開單，標註缺少的部分

## Examples

### Example 1：順利的需求單訪談

```
需求人：我想要在學習中心加一個下載報告的功能
AI：收到！先選一下需求來源，打個名字關鍵字：
需求人：王大明
AI：🔍 找到 1 位：王大明 (daming.wang@tutorabc.com)
    需求來源：王大明 ✅
    再問幾個問題幫你開單：
    1. 這個報告要包含哪些內容？上課時數、出席率之類的？
    2. 大概影響多少用戶？全部會員都看得到嗎？

需求人：對，上課時數、出席率、測驗成績。全部付費會員都能用，大概 8 萬人

AI：了解。這個功能做完你期望達到什麼效果？
    例如減少客服查詢量、提升會員滿意度之類的

需求人：對 減少客服量 現在每個月大概有 500 通在問學習紀錄

AI：最後兩個問題：
    1. 這件事多急？正常排隊還是有 deadline？
    2. 後續細節有誰可以當對應窗口？

需求人：正常排就好。找 Lisa 對接

AI：幫你整理好了，確認一下：

    ┌────────────────────────────────────┐
    │ 📋 需求單預覽                       │
    │                                    │
    │ 需求人：王大明                       │
    │ 標題：會員中心新增學習報告下載功能      │
    │ 類型：需求單                         │
    │ 優先：Medium                        │
    │ Component：WEB 對外網站              │
    │ 影響人數：付費會員約 8 萬人            │
    │ 預期效益：減少每月約 500 通客服查詢     │
    │ 對應窗口：Lisa                       │
    │                                    │
    │ 描述：在學習中心的學習紀錄頁面新增      │
    │ 「下載報告」按鈕，報告內容包含上課      │
    │ 時數、出席率、測驗成績...             │
    └────────────────────────────────────┘

    OK 就幫你開單了？

需求人：OK

AI：✅ 已建立 RDC-XXXX「會員中心新增學習報告下載功能」
    https://tutorabc-org.atlassian.net/browse/RDC-XXXX
```

### Example 2：附件型需求

```
需求人：[上傳了一個 Excel 檔案]
       幫我照這個開單

AI：收到你的 Excel，我來看一下內容...
    📊 我讀到的內容是：
    - 第一個 sheet 是「課程類型調整」，列了 15 種課程的新分類方式
    - 第二個 sheet 是「前台顯示規則」，定義了不同課程在官網的排序

    我理解這是要調整課程分類和前台顯示邏輯，對嗎？

需求人：對

AI：好，再問兩個：
    1. 影響到多少用戶？是全站都會變嗎？
    2. 後續細節找誰對接？

需求人：全站 大概50萬會員都看得到 找 Kevin

AI：了解。這件事多急？

需求人：這季要上

AI：幫你整理好了...
    [展示預覽，含 Excel 解析後的結構化內容]
```
