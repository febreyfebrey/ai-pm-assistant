---
name: jira-ticket-create
description: Create Jira tickets (需求單/Bug/e-Service) in RDC/SDC projects with proper Summary prefix, structured Description, ADF formatting, and Reporter account lookup. Use after stakeholder-interview-q0q9 has collected info.
---

# Jira Ticket Create

## Purpose

把訪談收集到的資訊組裝成合法的 Jira 工單 API 呼叫，處理所有 TutorABC 特有細節：Prefix 規則、Description 模板、ADF 格式、Reporter 查詢、Component 填寫。

## Related Skills / Rules

- 互動流程收集資訊 → `stakeholder-interview-q0q9` skill
- 附件處理 → `onedrive-attachment-parse` skill
- Component 判斷與 Prefix 對照 → `jira-component-team-map` rule
- Custom field 規格 → `jira-field-schema` rule

## Summary 生成規則

### Prefix 規則（強制加）

**格式**：`[系統模組] 需求描述`

完整 Prefix 對照表在 `jira-component-team-map` rule。

**涉及多系統時**：用主要模組作 prefix，其餘寫進 Description。
**判斷不確定時**：列出候選讓提案人選擇。

### 標題格式範例

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

## Description 模板

### 需求單 Description

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

### Bug Description

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

## API 呼叫規格

### 需求單 createJiraIssue

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
    "customfield_10093": {
      "version": 1,
      "type": "doc",
      "content": [{
        "type": "paragraph",
        "content": [{
          "type": "text",
          "text": "{預期效益，必須用 ADF 格式}"
        }]
      }]
    }
  }
}
```

### Bug createJiraIssue

```json
{
  "cloudId": "tutorabc-org.atlassian.net",
  "projectKey": "RDC",
  "issueTypeName": "Bug",
  "summary": "[{Prefix}] {頁面/系統} — {症狀簡述}",
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

## Reporter 查詢流程

```
1. 需求人提供姓名（中文或英文）
2. 呼叫 lookupJiraAccountId(searchString: "{姓名}")
3. 找到 1 個 → 直接使用
4. 找到多個 → 列出讓需求人選擇
5. 找到 0 個 → 提示「查不到這個人，換個名字試試？」
6. 開單時設 reporter.accountId
7. Jira API 回錯（不在 jira-users-requester group）→ 提示需求人換人或聯繫管理員
```

## ADF 格式（⚠️ 關鍵）

`customfield_10093`（預期效益）雖然是文字欄位，**API 必須傳 ADF 格式**，不能傳純文字。完整 schema 見 `jira-field-schema` rule。

## Quality Gates

- Summary 必須有 Prefix，長度 15-40 字
- Description 必須包含：背景/問題 → 期望結果 → 驗收標準（至少 1 條）
- Reporter 必須透過 `lookupJiraAccountId` 查到有效 accountId
- Component 必須由 AI 判斷填入（參考 `jira-component-team-map`）
- `customfield_10093` 必須用 ADF 格式
- 開單前**必須**讓需求人看過預覽並確認
- 開單成功後**必須**顯示送單提醒訊息（見 `stakeholder-protocol`）
- **絕不捏造**訪談中未提及的需求

## 錯誤處理

| 錯誤 | 處理 |
|-----|------|
| Reporter 不在 `jira-users-requester` group | 提示換人，問是否改用其他總監 |
| Component ID 不存在 | 標註「⚠️ Component 待 PM 確認」，交 pm-lead 處理 |
| Summary 超過長度限制 | 請需求人確認縮短版 |
| API timeout / 500 錯誤 | 重試 1 次，仍失敗則記錄完整 payload 給 pm-lead |
