---
name: Migrated Assets Index
description: Pre-built rules and skills ready to drop into the A-Team generated software-pm-team
---

# Migrated Assets Index

本資料夾是 **pre-built 的 rules + skills**，來自舊 `D:\ai-team\.claude\` 拆解+改寫，可以直接 drop-in 到 A-Team 生成的 `teams\software-pm-team\.claude\` 對應位置。

## 📋 目錄

### Rules (5 個，共 437 行)
| 檔案 | 行數 | 來源 |
|------|------|------|
| [tutorabc-org.md](rules/tutorabc-org.md) | 47 | tutorabc-context.md 拆解 — 組織脈絡 |
| [jira-field-schema.md](rules/jira-field-schema.md) | 117 | 新寫 — 含 ADF 格式、Filter、custom fields |
| [jira-component-team-map.md](rules/jira-component-team-map.md) | 117 | tutorabc-context.md 拆解 — Component/Team/Prefix 3 表 |
| [stakeholder-protocol.md](rules/stakeholder-protocol.md) | 80 | 新寫 — 總監文化、Priority 判斷、Workflow Reality |
| [output-language.md](rules/output-language.md) | 76 | 新寫 — 繁中、emoji 5 類、格式規範 |

### Skills (6 個，共 1,158 行)
| 檔案 | 行數 | 來源 |
|------|------|------|
| [stakeholder-interview-q0q9/](skills/stakeholder-interview-q0q9/SKILL.md) | 284 | intake-interview.md Q0-Q9 段落 |
| [jira-ticket-create/](skills/jira-ticket-create/SKILL.md) | 193 | intake-interview.md Summary + API + 模板段落 |
| [onedrive-attachment-parse/](skills/onedrive-attachment-parse/SKILL.md) | 170 | intake-interview.md 附件政策段落 |
| [jira-triage-5class/](skills/jira-triage-5class/SKILL.md) | 128 | 原 jira-triage（改名） |
| [requirement-brief-onepage/](skills/requirement-brief-onepage/SKILL.md) | 107 | 原 requirement-brief（改名） |
| [m3-design-spec/](skills/m3-design-spec/SKILL.md) | 276 | 原 uiux-design（改名） |

## 🎯 跟 A-Team 對話時要強調

在 Phase 2 Planning 時，請告訴 A-Team：

> 我已經 pre-built 了 5 個 rules + 6 個 skills 在 `D:\ai-team\teams\_briefs\migrated-assets\`。請 skill-planner 規劃時**直接引用這些**，不要重新生成同名檔案。A-Team 需要補齊的是：
>
> **Rules 部分（A-Team 自帶的，保留即可）：**
> - anti-sycophancy.md
> - context-management.md
> - worklog-discipline.md
> - reviewer-mandate.md
> - coordinator-mandate.md
>
> **Skills 部分（A-Team 需要新生成的）：**
> - framework-rice（RICE 評分）
> - framework-moscow（MoSCoW 分類）
> - framework-jtbd（Jobs-to-be-Done）
> - framework-value-prop-canvas（Value Proposition Canvas）
> - framework-invest-user-story（INVEST 原則）
> - template-prd（標準 PRD 模板）
> - template-experiment-design（A/B test）
> - jira-filter-report（跑 Filter 產週報）
> - teams-chat-scan（掃 Teams 接需求）
> - boss（A-Team 強制，呼叫 coordinator 用）

## 🔀 合併動作（A-Team 生成完後執行）

```bash
# 假設 A-Team 產出在
#   D:\ai-team-generator\A-Team\teams\software-pm-team\

# Step 1: 把 A-Team 產出複製到你的實際位置
cp -r /d/ai-team-generator/A-Team/teams/software-pm-team /d/ai-team/teams/

# Step 2: 把 migrated-assets 的 rules 複製進去
cp /d/ai-team/teams/_briefs/migrated-assets/rules/*.md /d/ai-team/teams/software-pm-team/.claude/rules/

# Step 3: 把 migrated-assets 的 skills 複製進去
cp -r /d/ai-team/teams/_briefs/migrated-assets/skills/* /d/ai-team/teams/software-pm-team/.claude/skills/

# Step 4: 如果 A-Team 產出有同名檔案，檢視差異決定保留哪版
#   通常保留 migrated-assets 版（比較完整、TutorABC 定制）
```

## ⚠️ 遷移注意事項

1. **Component 判斷規則**只在 `jira-component-team-map.md` rule 出現一次，不要重複放到 skill 裡
2. **ADF 格式細節**只在 `jira-field-schema.md` rule，`jira-ticket-create` skill 引用它
3. **附件處理**獨立成 `onedrive-attachment-parse` skill，`stakeholder-interview-q0q9` 只引用觸發點
4. **Prefix 表**只在 `jira-component-team-map.md` rule，`jira-ticket-create` skill 引用它
5. **舊檔絕對不要刪**（`.claude.bak_20260421` 已備份，但原始 `.claude/` 也保留當 reference）
