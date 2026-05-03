---
name: TutorABC Product Context
description: Company, product, team domain knowledge shared across all agents and skills
---

# TutorABC Product Context

## Applicability

- Applies to: all agents, all skills

## Rule Content

### Company
- TutorABC: Online education platform (英語/中文/多語言教學)
- Business model: B2C subscription + B2B enterprise training
- Key products: TutorABC (成人英語), tutorJr (兒童), TutorMing (華語)

### Jira Projects
- **RDC** (R&D Demand Center): 主要研發需求管理
- **SDC** (Shop Demand Center): 商城相關需求

### R&D Teams (8 teams)

| Team | Domain | Typical Scope |
|------|--------|---------------|
| AI | AI/ML features, chatbot, recommendation | Model integration, NLP, data pipeline |
| APP | Mobile apps (iOS/Android) | Native UI, push notification, in-app features |
| CRM | Customer relationship, 會員系統 | User profile, membership, payment, coupon |
| DATA | Data platform, analytics, reporting | ETL, dashboard, A/B test infrastructure |
| GTR | Global tutoring room (教室) | Video/audio streaming, whiteboard, real-time |
| INFRA | Infrastructure, DevOps, security | Cloud, CI/CD, monitoring, SSO, performance |
| UIUX | Design system, UX research | Component library, prototyping, usability |
| WEB | Web frontend, landing pages | Website, SEO, campaign pages, web app |

### Jira Components → Team 對應（含代管關係）

| Component (Jira) | ID | 負責團隊 | 備註 |
|-------------------|------|---------|------|
| AI 智能應用 | 10080 | AI | |
| APP 應用程式 | 10013 | APP | |
| CRM 名單管理 | 10005 | CRM | |
| DATA 數據與報表 | 10010 | DATA | |
| GTR 教研管理 | 10009 | GTR | |
| HR 人資系統 | 10000 | CRM | CRM 代管 |
| INFRA 底層架構 | 10008 | INFRA | |
| MD 行銷系統 | 10012 | WEB | WEB 代管 |
| OMS 銷售管理 | 10011 | OMS | 從 CRM 獨立出來 |
| OMC 運維團隊 | 10187 | OMC | 非研發，維運追蹤用 |
| SHOP 直播電商 | 10081 | SHOP | 獨立 BU |
| UIUX 使用體驗 | 10047 | UIUX | |
| WEB 對外網站 | 10003 | WEB | |

### Issue Types
- 需求單 (id: 10000): Feature requests, enhancements — hierarchy level 1
- Bug (id: 10004): Defects in production or staging
- e-Service (id: 10071): 維運單，排查問題/調整資料/撈資料，由人工開立或維運系統自動轉派
- Task (id: 10002): Technical tasks, maintenance
- Sub-task (id: 10003): Breakdown of above types
- Sub-bug (id: 10104): Bug 的子項目

### Jira 工單標題 Prefix（強制）

標題必須加 `[系統模組]` prefix，用於初步判定需求大方向。

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

### 需求人與開單規則
- 需求人是各部門總監（老闆要求只有總監能開單）
- 總監的描述通常非常粗略，常用附件或口頭描述
- Reporter 限制：只有 `jira-users-requester` group 的成員才能作為工單 Reporter
  - 開單前須用 `lookupJiraAccountId` 查詢 accountId
  - 設定方式：`additional_fields.reporter.accountId`
- 需求單必填欄位（含 workflow 卡控）：Reporter、Summary、Description、Priority、Components、影響人數、預期效益
- Bug 必填欄位：Reporter、Summary、Description、Priority、Components
- e-Service 必填欄位：Reporter、Summary、Description、Priority、Components
- 預估開發規模 (cf 10092) 由 Owner（RD Team Leader 或 PM）後續填寫
- 項目優先級除 Highest 外，通常依開單日期排定

### Key Jira Fields
| Field | Custom Field ID | Usage |
|-------|----------------|-------|
| Rank Number | cf[10237] | Priority ordering for requirements |
| EPIC Rank | cf[10320] | Team filter ordering |
| 預估開發規模 | cf[10092] | Dev size estimate |
| 預期效益 | cf[10093] | Expected business impact |
| 影響人數 | cf[10091] | Number of affected users |
| 專案起始日 | cf[10129] | Project start date |
| 專案完成日 | cf[10134] | Project completion date |

### Workflow Reality
- PMs write requirements in Jira, but devs primarily reference **Figma** during development
- PRD is a secondary reference — must be concise or nobody reads it
- KICKOFF meetings use Figma walkthrough, not PRD presentation
- Dev estimation (粗估) happens before detailed PRD — teams need enough context to size the work
- Priority is driven by business impact + Rank Number in Jira

### Communication Standards
- Output language: 繁體中文 (technical terms may remain in English)
- Be direct and opinionated — PM needs honest assessment, not diplomatic hedging
- Use tables and bullet points — never walls of text
- Emoji usage: 🔴🟡🟢⚪❓ for classification, ✅❌ for status only

## Violation Determination

- Assigning a ticket to a team whose domain doesn't match the ticket content → Violation
- Using simplified Chinese (简体) instead of traditional Chinese (繁體) → Violation
- Fabricating requirements not found in the Jira ticket → Violation
- Producing output longer than necessary without scannable structure → Violation

## Exceptions

- When PM explicitly asks for detailed analysis, longer output is acceptable
- English-only output is acceptable when PM requests it or when communicating with non-Chinese speakers
