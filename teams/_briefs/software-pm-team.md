---
name: Software PM Team Discovery Brief
target_team_name: software-pm-team
prepared_for: /A-Team 軟體產品經理團隊
prepared_by: Febrey Huang + AI 助理
date: 2026-04-21
---

# Discovery Brief — Software PM Team

這份 brief 是給 `/A-Team` 訪談時當答題腳本用的。每一段都對應 A-Team 會問的問題。

---

## 🎯 30 秒電梯稿（A-Team 問「你想建什麼團隊」時貼這段）

> 我要建一個**軟體產品經理團隊**（software-pm-team），服務 TutorABC R&D 的 8 個開發團隊。
>
> 團隊要處理 PM 全鏈路工作：需求訪談開單 → 工單分類 → 需求 brief/PRD → RICE 優先序 → UI/UX 設計規格 → 技術可行性 → 品質審閱。
>
> 主要使用者是我（Senior PM）和其他 PM，上游是各部門總監（需求人），下游是 8 個 RD 團隊（AI/APP/CRM/DATA/GTR/INFRA/UIUX/WEB）。
>
> 整合 Jira MCP（tutorabc-org.atlassian.net）+ MS365 MCP（Teams 對話 / OneDrive 附件 / Email）。
>
> 我有 1,447 行既有 PM 資產要遷移進來（見第 7 段），請當成素材庫。

---

## 📐 Phase 1 — Discovery：預答題庫

### Q: 團隊目標與範圍是什麼？
- **目標**：讓 PM 從「人工跑流程」變成「AI 輔助決策」—— 重複勞動交給 agent，PM 專注判斷與權衡
- **範圍涵蓋**：Discovery（需求探索）→ Definition（需求定義）→ Delivery（交付規格）三階段
- **不涵蓋**：實際開發（那是 RD）、營銷/業務決策（那是各總監）

### Q: 主要使用者是誰？次要使用者是誰？
| 角色 | 誰 | 怎麼用 |
|---|---|---|
| **Primary** | Febrey Huang（Senior PM） | 日常 triage / brief / 排序 / PRD |
| **Primary** | 其他 PM（經驗較淺） | 輔助開單、套用方法論 |
| **Secondary** | 各部門總監（需求人） | 透過 demand-interviewer 開單 |
| **Secondary** | 8 個 RD Team Leaders | 讀 brief / PRD、回饋品質 |

### Q: 執行模式是單 agent 還是多 agent？
**多 agent（subagent mode）**。理由：PM 工作的不同階段需要不同 mindset（訪談 vs 分類 vs 寫 PRD vs 評估），單一 agent 容易混淆專業邊界。

### Q: 團隊成員有哪些 role？
**必備 9 個 role**（含 A-Team 強制的 2 個 reviewer）：

| # | Role | 面對誰 | 核心產出 |
|---|---|---|---|
| 1 | **pm-lead** (coordinator) | PM（你） | 路由、排程、品質把關、週報 |
| 2 | **demand-interviewer** | 各部門總監 | Jira 開單（經 Teams） |
| 3 | **demand-triager** | PM | 工單分類（🔴🟡🟢⚪❓） |
| 4 | **prd-writer** | RD | 一頁 brief / 完整 PRD |
| 5 | **prioritizer** | PM | RICE / MoSCoW 評分與排序 |
| 6 | **uiux-designer** | RD / Designer | M3 design spec |
| 7 | **tech-analyst** | RD Team Leader | 技術可行性、API 變動評估 |
| 8 | **process-reviewer** (A-Team 強制) | 全隊 | 流程品質審閱 |
| 9 | **qa-reviewer** (A-Team 強制) | 全隊 | 產出品質審閱（內容正確性、完整性） |

### Q: 領域研究（domain-researcher 會跑）
這三份資源已經研究過，可直接引用：
- [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) — 47 個 PM frameworks，3 層結構（Component / Interactive / Workflow）
- [VoltAgent product-manager.md](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/08-business-product/product-manager.md) — 多 agent 協作清單
- [pmprompt.com](https://pmprompt.com/prompts) — RICE、PRD、User Story 標準 prompt

---

## 🧩 Phase 2 — Planning：Skills 與 Rules 規劃

### 共用 Skills（所有 agent 都能用）

#### 📚 PM 方法論類（來自 deanpeters + pmprompt）
| Skill | 用途 | 來源 |
|---|---|---|
| `framework-rice` | RICE 評分（Reach × Impact × Confidence / Effort） | pmprompt |
| `framework-moscow` | Must / Should / Could / Won't 分類 | pmprompt |
| `framework-jtbd` | Jobs-to-be-Done 訪談與分析 | deanpeters |
| `framework-value-prop-canvas` | Value Proposition Canvas | deanpeters |
| `framework-invest-user-story` | INVEST 原則寫 user story | pmprompt |
| `template-prd` | 標準 PRD 格式（問題/方案/驗收/指標） | pmprompt |
| `template-experiment-design` | A/B test 設計 | deanpeters |

#### 🛠️ 工具類（來自既有資產，是你量身定制的精華）
| Skill | 用途 | 來源 |
|---|---|---|
| `jira-ticket-create` | 建立 Jira 工單（含 ADF 格式、Reporter 查詢、Component 判斷） | **既有 intake-interview** |
| `jira-triage-5class` | 🔴🟡🟢⚪❓ 5 類分類 + T-shirt size | **既有 jira-triage** |
| `requirement-brief-onepage` | 一頁需求 brief（不是完整 PRD） | **既有 requirement-brief** |
| `stakeholder-interview-q0q9` | Q0-Q9 總監訪談流程 + 附件政策 | **既有 intake-interview** |
| `m3-design-spec` | Material Design 3 UI 規格產出 | **既有 uiux-design** |

#### 🔗 整合類
| Skill | 用途 |
|---|---|
| `jira-filter-report` | 跑 Filter 10399 / 8 團隊 filter 產週報 |
| `teams-chat-scan` | 掃 Teams 頻道接收需求 |
| `onedrive-attachment-parse` | 解析 OneDrive 附件（Excel/PDF/圖片） |

### 規則（Rules）

#### 🔒 A-Team 標配（clone 來的會自帶）
- `anti-sycophancy.md` — 禁模糊稱讚、禁閃躲
- `context-management.md` — 上下文分層
- `worklog-discipline.md` — 證據鏈三檔案（references/findings/decisions）
- `reviewer-mandate.md` — process/qa reviewer 強制
- `coordinator-mandate.md` — coordinator 不寫內容、只派單與審核

#### 🏢 TutorABC 定制（拆自舊的 tutorabc-context.md）
| Rule | 內容 |
|---|---|
| `tutorabc-org.md` | 公司、團隊、部門（只放組織脈絡） |
| `jira-field-schema.md` | Custom field、ADF 格式、必填規則 |
| `jira-component-team-map.md` | Component → Team → Prefix 三表 |
| `stakeholder-protocol.md` | 總監文化、粗略描述處理、Highest 追問 |
| `output-language.md` | 繁體中文，專業術語保留英文，emoji 規範 |

---

## 🏗️ Phase 3 — Generation：最終目錄預期

```
D:\ai-team\teams\software-pm-team\
├── CLAUDE.md
├── .claude\
│   ├── agents\
│   │   ├── pm-lead.md                        ← coordinator
│   │   ├── demand-interviewer.md
│   │   ├── demand-triager.md
│   │   ├── prd-writer.md
│   │   ├── prioritizer.md
│   │   ├── uiux-designer.md
│   │   ├── tech-analyst.md
│   │   ├── process-reviewer.md
│   │   └── qa-reviewer.md
│   ├── rules\
│   │   ├── anti-sycophancy.md
│   │   ├── context-management.md
│   │   ├── worklog-discipline.md
│   │   ├── reviewer-mandate.md
│   │   ├── coordinator-mandate.md
│   │   ├── tutorabc-org.md
│   │   ├── jira-field-schema.md
│   │   ├── jira-component-team-map.md
│   │   ├── stakeholder-protocol.md
│   │   └── output-language.md
│   └── skills\
│       ├── framework-rice\
│       ├── framework-moscow\
│       ├── framework-jtbd\
│       ├── framework-value-prop-canvas\
│       ├── framework-invest-user-story\
│       ├── template-prd\
│       ├── template-experiment-design\
│       ├── jira-ticket-create\
│       ├── jira-triage-5class\
│       ├── requirement-brief-onepage\
│       ├── stakeholder-interview-q0q9\
│       ├── m3-design-spec\
│       ├── jira-filter-report\
│       ├── teams-chat-scan\
│       ├── onedrive-attachment-parse\
│       └── boss\                              ← A-Team 強制
└── .worklog\
    └── 202604\
```

---

## 📦 既有資產遷移對照表

| 舊檔案 (D:\ai-team\.claude\) | 行數 | 遷移目標 | 備註 |
|---|---|---|---|
| `agents/coordinator.md` | 143 | `agents/pm-lead.md` | **職責會拆** — Skill Catalog 抽到 pm-lead，分析職能給 prd-writer、排序給 prioritizer |
| `agents/interviewer.md` | 99 | `agents/demand-interviewer.md` | 大部分保留，改名對齊新命名 |
| `skills/intake-interview/SKILL.md` | **559** | 拆成 3 個 skill：<br>• `stakeholder-interview-q0q9`（訪談流程）<br>• `jira-ticket-create`（API 規格）<br>• `onedrive-attachment-parse`（附件政策） | 單檔太大，拆成職責明確的 3 個 |
| `skills/jira-triage/SKILL.md` | 129 | `skills/jira-triage-5class` | 原封遷移 |
| `skills/requirement-brief/SKILL.md` | 108 | `skills/requirement-brief-onepage` | 原封遷移，新增 `template-prd` 作為完整版 |
| `skills/uiux-design/SKILL.md` | 277 | `skills/m3-design-spec` | 原封遷移 |
| `rules/tutorabc-context.md` | 132 | 拆成 5 個 rule（見上面 Rules 段落） | 單檔太散，依職責拆 |

---

## 🔌 外部整合（已就緒）

### Jira MCP
- Site: `tutorabc-org.atlassian.net`
- cloudId: `6f5220b3-36a0-4e8e-8609-9817fb6bf074`
- 主要 Filter：
  - `10399` — R&D Top 10 需求單（按 Rank Number）
  - 8 個團隊 Filter（AI/APP/CRM/DATA/GTR/INFRA/UIUX/WEB）
- Custom Fields（都在舊的 tutorabc-context.md 裡，完整對照）

### MS365 MCP
- 狀態：待 IT admin consent（delegated permission）
- 用途：Teams 對話接需求、OneDrive 附件解析、Email 轉寄

---

## 🎨 PM 專業靈魂 Checklist（A-Team 生成完後要驗證都有）

- [ ] JTBD framework (skill: framework-jtbd)
- [ ] Value Prop Canvas (skill: framework-value-prop-canvas)
- [ ] RICE scoring (skill: framework-rice)
- [ ] MoSCoW prioritization (skill: framework-moscow)
- [ ] INVEST user story (skill: framework-invest-user-story)
- [ ] PRD standard template (skill: template-prd)
- [ ] Cross-functional coordination（pm-lead 要能 delegate 給其他 agent）
- [ ] Discovery → Definition → Delivery lifecycle（workflow）
- [ ] 3-tier skills 結構：Component（單一工具）/ Interactive（多輪對話）/ Workflow（跨天流程）

---

## 🚨 A-Team 訪談時特別要強調

1. **不要從零發明** —— 我有 1,447 行既有資產，Phase 3 生成時請引用遷移對照表，不要重寫
2. **避免 agent/skill 命名重複** —— 舊的 `interviewer` 跟 `intake-interview` 重複過，這次嚴禁
3. **rules 必須拆檔** —— 舊的 `tutorabc-context.md` 把 5 件事塞一檔是痛點
4. **skills 命名要一眼看懂** —— 前綴分類：`framework-*`（方法論）、`template-*`（模板）、`jira-*`（工具）
5. **coordinator 只派工不動手** —— 舊 coordinator 把 Skill Catalog 跟實際 workflow 混在一起，這次嚴格分離

---

## 🎬 對話操作流程（Febrey 實際動作）

```bash
# 1. 進入 A-Team 工廠
cd /d/ai-team-generator/A-Team
claude

# 2. 在 Claude 對話中貼：
/A-Team 軟體產品經理團隊

# 3. A-Team 開始 Phase 1 訪談 —— 參考本 brief 回答
#    第一題通常問「你想建什麼團隊」—— 貼最上面的「30 秒電梯稿」
#    後續問題對照各 Phase 段落

# 4. Phase 3 Generation 完成後，產出位置：
#    D:\ai-team-generator\A-Team\teams\software-pm-team\

# 5. 搬家到實際使用位置：
cp -r /d/ai-team-generator/A-Team/teams/software-pm-team /d/ai-team/teams/

# 6. Migrate 舊資產（參考上面「既有資產遷移對照表」）

# 7. 日常使用：
cd /d/ai-team/teams/software-pm-team
claude
> /boss                          # 喚起 pm-lead
```
