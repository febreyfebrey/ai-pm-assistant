# 測試案例清單

對應 PRD（`web-chat/PRD.md`）的功能需求，每次改動後跑 `npm test` 自動驗證。

**測試原則：**
- ✅ **結構性測試**（無 Claude API 呼叫）— 跑幾百次都便宜
- ⚠️ **Smoke 測試**（1-2 次真實 API 呼叫）— 每次跑約花 $0.02 USD
- 🚫 **UI 操作測試**（browser）— 暫不在自動化範圍，由人工測試

---

## TC-01: Backend 基礎 API（結構性）

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-01-01 | `GET /api/health` | 200 + `{status:"ok", model, conversations, uptime}` |
| TC-01-02 | `POST /api/chat` 空 body | 400 + error 訊息 |
| TC-01-03 | `POST /api/chat` 只有 conversationId 無 message/attachments | 400 |
| TC-01-04 | `POST /api/reset` 正常 | 200 + `{ok:true}` |
| TC-01-05 | CORS 允許設定的 origin | Response 有 `Access-Control-Allow-Origin` |

## TC-02: 對話基本流程（Smoke）

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-02-01 | 送出純文字訊息 | 200 + 回覆含 AI 文字 + conversationId |
| TC-02-02 | 用同一個 conversationId 送第二則 | AI 記得上下文 |
| TC-02-03 | 使用者打「我要開需求單」 | AI 引導進入訪談，回覆有「提案人」字眼 |
| TC-02-04 | Reporter 驗證：虛構名字應被拒絕 | AI 說「不在清單內」且不進下一題 |
| TC-02-05 | Reporter 驗證：清單內名字應被接受 | AI 確認姓名準備進 Q1 |

## TC-03: 附件處理

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-03-01 | 附帶 image/png base64 的 request | 200 無 error |
| TC-03-02 | 附帶 application/pdf base64 的 request | 200 無 error |
| TC-03-03 | 空 message + 有 attachments | 200（backend 會自動補「請分析附件」）|

## TC-04: Tool Use（結構性）

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-04-01 | Backend 定義了 `generate_ticket_preview` tool schema | 檢查 server.js |
| TC-04-02 | Backend 定義了 `generate_wireframe` tool schema | 檢查 server.js |
| TC-04-03 | Tool schema 有所有必填欄位 | type/summary/priority/component/reporter/description |

## TC-05: 系統提示詞載入

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-05-01 | 啟動 backend 時載入 `interviewer.md` | 在 prompt 中可找到關鍵字 |
| TC-05-02 | 啟動 backend 時載入 `intake-interview/SKILL.md` | 訪談流程規則在 prompt 中 |
| TC-05-03 | 啟動 backend 時載入 `tutorabc-context.md` | Prefix/Component 對照表在 prompt 中 |
| TC-05-04 | System prompt 總字數 > 5000 | 足夠豐富 |

## TC-06: 前端靜態檔案

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-06-01 | `GET /` 回傳 HTML | 200 + `<title>AI PM Assistant</title>` |
| TC-06-02 | `GET /style.css` 存在 | 200 |
| TC-06-03 | `GET /app.js` 存在 | 200 |
| TC-06-04 | JS 語法正確（node --check）| 無 syntax error |

## TC-07: 環境設定

| ID | 測試項目 | 預期結果 |
|----|---------|---------|
| TC-07-01 | `.env` 有 `ANTHROPIC_API_KEY` | 且格式 `sk-ant-*` |
| TC-07-02 | `.env` 有 `PORT` | 預設 3002 |
| TC-07-03 | `.env` 有 `ALLOWED_ORIGIN` | 預設 `http://localhost:3000` |

---

## 新增需求的測試清單（未來）

| 需求 | 測試案例 |
|------|---------|
| Reporter 驗證 jira-users-requester | TC-08: 非 group member 應被拒絕 |
| 接 Jira createIssue | TC-09: 確認送出後 Jira 有新工單 |
| Streaming 回應 | TC-10: 收到 SSE `text_delta` 事件 |
| SSO 登入 | TC-11: 未登入跳 login 頁 |
