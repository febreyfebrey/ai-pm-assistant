---
name: Jira Field Schema
description: Issue types, custom fields, required fields, ADF format rules for TutorABC Jira
applies_to: all agents that create/edit Jira tickets
---

# Jira Field Schema

## Jira 連線資訊

- **Site**：`tutorabc-org.atlassian.net`
- **cloudId**：`6f5220b3-36a0-4e8e-8609-9817fb6bf074`
- **PM Account ID**：`6386014d9960988ef6c03cce`（Febrey Huang）
- **時區**：Asia/Taipei

## Issue Types (RDC 專案)

| Type | ID | 用途 |
|------|-----|------|
| 需求單 | 10000 | Feature requests, hierarchy level 1 |
| Bug | 10004 | Defects in production or staging |
| e-Service | 10071 | 維運單（排查問題 / 調整資料 / 撈資料） |
| Task | 10002 | Technical tasks, maintenance |
| Sub-task | 10003 | 子任務 |
| Sub-bug | 10104 | Bug 子項目 |

## Key Custom Fields

| Field | Custom Field ID | Type | 用途 |
|-------|-----------------|------|------|
| Rank Number | `cf[10237]` = `customfield_10237` | number | Filter 10399 需求單排序 |
| EPIC Rank | `cf[10320]` = `customfield_10320` | number | 團隊 Filter 子任務 Parent Epic Rank |
| 影響人數 | `cf[10091]` = `customfield_10091` | text | 受影響使用者數量 |
| 預期效益 | `cf[10093]` = `customfield_10093` | **ADF** ⚠️ | 期望業務效果（文字欄位但 API 要傳 ADF） |
| 預估開發規模 | `cf[10092]` = `customfield_10092` | text | RD TL 或 PM 後續填寫 |
| 專案起始日 | `cf[10129]` = `customfield_10129` | date | — |
| 專案完成日 | `cf[10134]` = `customfield_10134` | date | — |
| e-Service 連結 | `cf[10353]` = `customfield_10353` | url | Bug 用 |
| e-Service 回報者 | `cf[10354]` = `customfield_10354` | text | Bug 用 |
| e-Service 單號 | `cf[10355]` = `customfield_10355` | text | Bug 用 |

## Required Fields（含 workflow 卡控）

### 需求單
| 欄位 | API 必填 | Workflow 卡控 |
|------|---------|-------------|
| Summary | ✅ | — |
| Description | ✅ | — |
| Priority | ✅（預設 Medium） | — |
| Components | — | ✅ |
| 影響人數 (cf10091) | — | ✅ |
| 預期效益 (cf10093) | — | ✅ |
| Reporter | — | ✅ 限 `jira-users-requester` group |

### Bug
必填：Summary, Description, Priority, Components
選填：cf10353 (e-Service 連結), cf10354 (e-Service 回報者), cf10355 (e-Service 單號), Parent

### e-Service
必填：Reporter, Summary, Description, Priority, Components

## ⚠️ 關鍵技術細節

### ADF 格式（customfield_10093 預期效益）
`預期效益` 雖然是文字欄位，API **必須**用 ADF 格式，不能傳純文字：

```json
"customfield_10093": {
  "version": 1,
  "type": "doc",
  "content": [{
    "type": "paragraph",
    "content": [{
      "type": "text",
      "text": "{預期效益內容}"
    }]
  }]
}
```

### Reporter 查詢流程
1. 需求人提供姓名（中/英文）
2. 呼叫 `lookupJiraAccountId(searchString: "{姓名}")`
3. 找到 1 個 → 直接使用
4. 找到多個 → 列出讓需求人選擇（autocomplete UI）
5. 找到 0 個 → 提示換名字
6. 開單時設 `additional_fields.reporter.accountId`
7. 若 Jira API 回錯（不在 `jira-users-requester` group）→ 提示需求人換人或聯繫管理員

### Assignee
由 Component automation 自動派發，**不用在開單時填**。

### 開單後狀態
預設為「草稿」，提案人需自行改為「需求評審」才算送單（要在開單成功回傳時提醒）。

## 重要 Filter

| Filter ID | JQL | 用途 |
|-----------|-----|------|
| `10399` | `project = RDC and issuetype = 需求單 and status not in (已關閉, 草稿) and (labels is empty or labels NOT IN ("Shop")) ORDER BY cf[10237] ASC` | R&D Top 10 Projects 報告 |
| `10643` | AI 團隊 | assignee in membersOf("jira-team-rd-AI") |
| `10659` | APP 團隊 | — |
| `10651` | CRM 團隊 | — |
| `10670` | DATA 團隊 | — |
| `10660` | GTR 團隊 | — |
| `10655` | INFRA 團隊 | — |
| `10647` | UIUX 團隊 | — |
| `10167` | WEB 團隊 | — |

團隊 Filter 共用 JQL：`assignee in membersOf("jira-team-rd-{team}") AND project in ("R&D Demand Center","Shop Demand Center") ... order by cf[10320] ASC`

## 資料抓取注意事項

- 必須分頁取完：`maxResults=50`，用 `nextPageToken`
- Filter 10399 排序用 `customfield_10237`
- 團隊 Filter 排序用 `customfield_10320`
- 去重時**不可**排除已關閉的 Parent 或 SDC 專案
