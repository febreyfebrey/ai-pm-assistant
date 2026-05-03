# AI PM Team

## 預設行為

所有任務一律先經過 **Coordinator Agent** (`.claude/agents/coordinator.md`) 路由。

Coordinator 會根據 Skill Catalog 自動判斷使用哪些 skill/agent，你只需要描述目標。

## 快速指令

| 你說 | Coordinator 做什麼 |
|------|-------------------|
| 「幫我看新進的單」 | → jira-triage 分類 → Highest 自動跑 requirement-brief |
| 「幫我分析 RDC-XXXX」 | → requirement-brief 產出需求簡報 |
| 「我要開單」 | → 轉交 Interviewer Agent 訪談開單 |
| 「掃一下工單品質」 | → ticket-audit 品質稽核 |
| 「看一下排序」 | → rank-review 排序健檢 |
| 「這週報告」 | → weekly-digest 週報摘要 |
| 「做個 UI」「設計規格」 | → uiux-design 產出 M3 design spec |

## 重要規則

- 輸出語言：繁體中文（技術名詞可用英文）
- 語氣：友善直接，不用敬語，不要八股
- 工單標題強制加 prefix（參照 `.claude/rules/tutorabc-context.md`）
- 不確定歸哪個 skill 時，先問 PM 目標再推薦
- **附件政策**：不接受無法閱讀和解析的檔案。加密檔請提案人另存為 PDF（PDF 不受 D-security 限制）。不可解析的附件不開單。
