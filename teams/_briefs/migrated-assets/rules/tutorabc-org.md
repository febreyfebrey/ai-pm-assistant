---
name: TutorABC Organization Context
description: Company profile, product lines, R&D team domains — shared across all agents
applies_to: all agents, all skills
---

# TutorABC Organization Context

## Company

- **TutorABC**：Online education platform（英語 / 中文 / 多語言教學）
- **Business model**：B2C subscription + B2B enterprise training
- **Key products**：
  - TutorABC — 成人英語
  - tutorJr — 兒童英語
  - TutorMing — 華語教學

## Jira Projects

- **RDC** (R&D Demand Center) — 主要研發需求管理
- **SDC** (Shop Demand Center) — 商城相關需求

## R&D Teams (8 teams)

| Team | Domain | Typical Scope |
|------|--------|---------------|
| AI | AI/ML features, chatbot, recommendation | Model integration, NLP, data pipeline |
| APP | Mobile apps (iOS/Android) | Native UI, push notification, in-app features |
| CRM | Customer relationship, 會員系統 | User profile, membership, payment, coupon |
| DATA | Data platform, analytics, reporting | ETL, dashboard, A/B test infrastructure |
| GTR | Global tutoring room（教室） | Video/audio streaming, whiteboard, real-time |
| INFRA | Infrastructure, DevOps, security | Cloud, CI/CD, monitoring, SSO, performance |
| UIUX | Design system, UX research | Component library, prototyping, usability |
| WEB | Web frontend, landing pages | Website, SEO, campaign pages, web app |

## PM Context

- **Senior PM**：Febrey Huang（管理 8 個 R&D teams）
- **PM 痛點**：~100 active Jira tickets 要 triage + requirement analysis；會議量重；其他 PM 經驗較淺
- **AI PM Team 目標**：讓 AI 處理重複勞動（triage / brief / 開單引導），PM 專注判斷與權衡

## Related Rules

- Jira field specs → `jira-field-schema.md`
- Component → Team 對應 → `jira-component-team-map.md`
- 總監文化與互動 → `stakeholder-protocol.md`
- 輸出語言與格式 → `output-language.md`
