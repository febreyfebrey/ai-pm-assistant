---
name: requirement-brief
description: Produce concise requirement briefs from Jira tickets that give devs enough context to estimate. Trigger when user asks to analyze a requirement, write a brief, or prepare for estimation.
---

# Requirement Brief

## Purpose

Turn a vague or detailed Jira ticket into a **one-page brief** that devs can scan in 2 minutes and give a rough size estimate. This is NOT a full PRD — it's the minimum viable spec.

## Brief Template

```markdown
# {Ticket Key}: {Title}
> Status: {status} | Priority: {priority} | Reporter: {reporter}

## 一句話說明
{用一句話說清楚這個需求要解決什麼問題，給誰用}

## 為什麼做 (Business Context)
- 問題: {目前的痛點是什麼}
- 影響: {影響多少用戶 / 多少營收 / 什麼流程}
- 目標: {做完之後期望的結果}

## 做什麼 (Scope)
### 包含 ✅
- {功能點 1}
- {功能點 2}
- {功能點 3}

### 不包含 ❌
- {明確排除的範圍}

## 涉及團隊
| Team | Role | Why |
|------|------|-----|
| {WEB} | {主要開發} | {因為涉及前端頁面改動} |
| {CRM} | {API 支援} | {因為需要會員資料} |

## 給 RD 的關鍵資訊
- **Figma**: {link or "尚無，需設計"}
- **API 變動**: {有 / 無 / 待確認}
- **資料庫變動**: {有 / 無 / 待確認}
- **第三方串接**: {有的話列出}
- **上線限制**: {有特定時間嗎}

## 未釐清事項 ⚠️
1. {需要確認的問題 1} → 建議問 {誰}
2. {需要確認的問題 2} → 建議問 {誰}

## 初步規模評估
- **建議 Size**: {S/M/L/XL}
- **理由**: {為什麼是這個 size}
- **風險**: {可能讓 size 變大的因素}
```

## Writing Rules

### DO
- Extract info from ticket description, comments, and linked issues
- Infer scope from context when reasonably clear
- Be specific: "修改登入頁的密碼欄位驗證" not "修改登入相關功能"
- List unknowns explicitly — devs respect honesty over fake completeness
- Mention Figma link if found in ticket or comments

### DON'T
- Don't fabricate requirements not mentioned anywhere in the ticket
- Don't write more than 1 page — if it needs more, the requirement needs splitting
- Don't use jargon the dev team wouldn't know
- Don't skip "未釐清事項" — every ticket has unknowns, be honest about them
- Don't give size estimate without rationale

## Team Assignment Logic

| Signal in Ticket | Primary Team | Why |
|-----------------|--------------|-----|
| 前端、頁面、UI、按鈕、RWD | WEB or APP | Frontend work |
| API、後端、資料庫、migration | Depends on domain | Backend work |
| 會員、登入、付款、coupon | CRM | Member system |
| 報表、Dashboard、數據 | DATA | Analytics |
| 教室、視訊、白板 | GTR | Tutoring room |
| 部署、效能、監控、SSL | INFRA | Infrastructure |
| 設計、Mockup、Component | UIUX | Design system |
| AI、推薦、NLP、chatbot | AI | ML/AI features |
| APP、推播、iOS、Android | APP | Mobile |
| 官網、SEO、Landing page | WEB | Web |

## Size Estimation Heuristics

| Factor | Adds to Size |
|--------|-------------|
| Multi-team coordination | +1 size (S→M, M→L) |
| No Figma yet | +1 size (design phase needed) |
| Database schema change | +1 size |
| Third-party API integration | +1 size |
| Affects payment/billing flow | +1 size (extra testing) |
| Pure config/text change | Keep at S |
| Similar to recent feature | Keep or -1 size |

## Handling Poor-Quality Tickets

When a ticket has minimal information:

1. **No description**: Write "⚠️ 此工單無描述，無法進行需求分析。建議 Reporter 補充以下資訊：" then list what's needed
2. **One-liner description**: Try to infer from title + comments, but flag assumptions clearly with "⚠️ 以下為推測，需確認："
3. **Only has Figma link**: Note "需求主要透過 Figma 定義，建議搭配 Figma 閱讀此 Brief"
