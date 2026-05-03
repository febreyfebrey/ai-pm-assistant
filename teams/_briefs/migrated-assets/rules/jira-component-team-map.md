---
name: Jira Component ↔ Team ↔ Prefix Mapping
description: Authoritative mapping between Jira Components, R&D Teams, and title Prefixes — used for auto-classification
applies_to: demand-triager, demand-interviewer, jira-ticket-create skill
---

# Jira Component ↔ Team ↔ Prefix Mapping

## Component → Team 對應（含代管關係）

| Component (Jira) | Component ID | 負責團隊 | 備註 |
|-------------------|------|---------|------|
| AI 智能應用 | 10080 | AI | — |
| APP 應用程式 | 10013 | APP | — |
| CRM 名單管理 | 10005 | CRM | — |
| DATA 數據與報表 | 10010 | DATA | — |
| GTR 教研管理 | 10009 | GTR | — |
| HR 人資系統 | 10000 | CRM | **CRM 代管** |
| INFRA 底層架構 | 10008 | INFRA | — |
| MD 行銷系統 | 10012 | WEB | **WEB 代管** |
| OMS 銷售管理 | 10011 | OMS | 從 CRM 獨立出來 |
| OMC 運維團隊 | 10187 | OMC | 非研發，維運追蹤用 |
| SHOP 直播電商 | 10081 | SHOP | 獨立 BU |
| UIUX 使用體驗 | 10047 | UIUX | — |
| WEB 對外網站 | 10003 | WEB | — |

## 標題 Prefix（強制加）

**規則**：標題必須加 `[系統模組]` prefix，用於初步判定需求大方向。單層為主，必要時用斜線 `[系統/部門]`。

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

### Prefix 使用原則
- 涉及多系統時，用**主要模組**做 prefix，其餘寫進 Description
- 判斷不確定時，列出候選讓提案人選擇
- 跨系統用斜線格式，例如 `[GTR/報表] 老師招募周報表`

## Component 自動判斷規則（for 開單）

根據需求內容關鍵字自動判斷 Component，**不需要問需求人**：

```
IF 內容涉及 App / 手機 / iOS / Android / 推播
  → APP 應用程式 (id: 10013)

IF 內容涉及 AI / 聊天機器人 / 推薦 / 模型 / NLP / ChatGPT / LLM
  → AI 智能應用 (id: 10080)

IF 內容涉及 會員 / 客戶 / CRM / 名單 / 派發 / CTI / 線上客服 / SCRM
  → CRM 名單管理 (id: 10005)

IF 內容涉及 人資 / HR / 考勤 / 招募 / 薪資（內部系統）
  → HR 人資系統 (id: 10000) [實際由 CRM 團隊負責]

IF 內容涉及 報表 / 數據 / Metabase / 資料分析 / ETL / 匯出
  → DATA 數據與報表 (id: 10010)

IF 內容涉及 教室 / 上課 / 視訊 / 白板 / TutorMeet / 排課 / 老師 / 教材
  → GTR 教研管理 (id: 10009)

IF 內容涉及 架構 / DevOps / CI/CD / 監控 / SSO / 效能 / 安全
  → INFRA 底層架構 (id: 10008)

IF 內容涉及 Landing Page / 行銷 / 廣告 / 留單 / 媒體
  → MD 行銷系統 (id: 10012) [實際由 WEB 團隊負責]

IF 內容涉及 訂單 / 合約 / 產品 / 優惠 / 購買 / 付款
  → OMS 銷售管理 (id: 10011)

IF 內容涉及 維運 / 排查 / 調資料 / 異常處理
  → OMC 運維團隊 (id: 10187) [非研發，維運追蹤用]

IF 內容涉及 直播 / 電商 / Shop / Live Auction
  → SHOP 直播電商 (id: 10081) [獨立 BU]

IF 內容涉及 UI / UX / 設計 / 使用者體驗 / 介面
  → UIUX 使用體驗 (id: 10047)

IF 內容涉及 官網 / 網站 / SEO / 學習中心 / 前端 / Web
  → WEB 對外網站 (id: 10003)

IF 判斷不明確 或 涉及多個 Component
  → 列出候選 Component 讓 PM (pm-lead) 決定
  → 暫時不填，在工單描述中標註「⚠️ Component 待 PM 確認」
```

## Team Assignment Logic（for 需求 brief 與 triage）

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
