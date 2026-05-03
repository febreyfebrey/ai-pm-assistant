---
name: jira-triage
description: Batch classify Jira tickets by urgency, readiness, and missing information. Trigger when user asks to triage, classify, sort, or prioritize tickets.
---

# Jira Triage

## Purpose

Quickly classify a batch of Jira tickets so the PM knows what needs attention first, what's ready to move forward, and what's missing critical information.

## Classification Categories

| Category | Emoji | Criteria |
|----------|-------|----------|
| **Urgent** | 🔴 | Production bug, revenue impact, or blocking other teams |
| **Needs Analysis** | 🟡 | Has description but needs PM to define scope/acceptance criteria |
| **Ready for Dev** | 🟢 | Clear requirement, has acceptance criteria, team can estimate |
| **Can Deprioritize** | ⚪ | Nice-to-have, low impact, or duplicate |
| **Info Missing** | ❓ | Description empty/vague, cannot assess without more info |

## Output Template

```markdown
## 工單分類結果 — {date}
共 {N} 張 | 🔴 {n} | 🟡 {n} | 🟢 {n} | ⚪ {n} | ❓ {n}

### 🔴 Urgent ({n})
| Key | Title | Reason | Suggested Team |
|-----|-------|--------|----------------|
| RDC-1234 | 登入頁面白屏 | Production bug, 影響所有用戶 | WEB |

### 🟡 Needs Analysis ({n})
| Key | Title | Missing | Next Step |
|-----|-------|---------|-----------|
| RDC-2345 | 會員等級改版 | 無驗收標準、影響範圍不明 | PM 定義 scope |

### 🟢 Ready for Dev ({n})
| Key | Title | Suggested Team | Est. Size |
|-----|-------|----------------|-----------|
| RDC-3456 | 新增匯出CSV | DATA | S |

### ⚪ Can Deprioritize ({n})
| Key | Title | Reason |
|-----|-------|--------|
| RDC-4567 | 修改footer文字 | Low impact, cosmetic |

### ❓ Info Missing ({n})
| Key | Title | What's Missing |
|-----|-------|----------------|
| RDC-5678 | (no title) | 無標題、無描述 |
```

## Decision Rules

### Input: Ticket fields → Output: Classification

```
IF issuetype = Bug AND (priority = Highest OR description contains "線上|production|urgent")
  → 🔴 Urgent

IF issuetype = Bug AND priority = High
  → 🟡 Needs Analysis (may be urgent, need PM to verify)

IF issuetype = 需求單 AND description length < 50 chars AND no comments
  → ❓ Info Missing

IF issuetype = 需求單 AND has acceptance criteria AND has Figma link
  → 🟢 Ready for Dev

IF issuetype = 需求單 AND description length > 100 chars AND no acceptance criteria
  → 🟡 Needs Analysis

IF status = Backlog AND updated > 30 days ago AND no comments in 30 days
  → ⚪ Can Deprioritize (stale)

DEFAULT → 🟡 Needs Analysis
```

## Size Estimation Guide (T-shirt)

| Size | Dev Effort | Characteristics |
|------|-----------|-----------------|
| **S** | 1-3 days | Single team, config change, UI tweak, simple API |
| **M** | 1-2 weeks | Single team, new feature with defined scope |
| **L** | 2-4 weeks | Multi-team or complex logic, needs design |
| **XL** | 1+ month | Architecture change, multi-phase, new system |

## Examples

### Input: Bug ticket with vague description
```
Key: RDC-9001
Type: Bug
Priority: High  
Summary: 課程頁面有問題
Description: 用戶反映課程頁面打不開
Status: Open
```

### Output:
```
| RDC-9001 | 課程頁面有問題 | 🟡 | "打不開" 定義不明：白屏？404？Loading 卡住？需確認重現步驟 | WEB or GTR |
```

### Input: Well-defined requirement
```
Key: RDC-9002
Type: 需求單
Priority: Medium
Summary: 會員中心新增學習報告下載功能
Description: 在會員中心的學習紀錄頁面，新增「下載報告」按鈕。
  點擊後產生 PDF 報告，包含：上課時數、出席率、測驗成績。
  驗收標準：1. 按鈕出現在正確位置 2. PDF 內容正確 3. 下載速度 < 3秒
Figma: https://figma.com/xxx
```

### Output:
```
| RDC-9002 | 會員中心新增學習報告下載 | 🟢 | 需求清楚、有驗收標準、有 Figma | WEB + DATA | M |
```

## Data Fetching

- Use `searchJiraIssuesUsingJql` with PM's filter or custom JQL
- Required fields: key, summary, description, status, priority, issuetype, assignee, created, updated, comment
- Paginate if > 50 results (use `nextPageToken`)
- Sort by priority descending, then by updated descending
