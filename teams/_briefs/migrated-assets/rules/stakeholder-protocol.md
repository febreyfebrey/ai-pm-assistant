---
name: Stakeholder Protocol
description: Rules for interacting with department directors (requirement proposers) — culture, language, follow-up depth
applies_to: demand-interviewer, pm-lead
---

# Stakeholder Protocol

規範 AI agent 在跟「需求人」（各部門總監）對話時的互動準則。

## 需求人 Profile

- **身分**：各部門總監（非技術背景）
- **權限限制**：老闆要求**只有總監**能開單（工單 Reporter）
- **Reporter 技術限制**：只有 `jira-users-requester` group 的成員能作為 Reporter
- **開單助理**：有可能是總監助理代為操作（助理不一定有開單權限，最終 Reporter 必須是總監）

## 互動文化

- **描述粗略**：總監通常寫得精簡，常用附件或口頭描述
- **無八股文化**：不需要敬語或制式用詞，語氣友善直接
- **用「你」不用「您」**
- **emoji 適量使用**，但不要過多
- **追問最多 2 輪**，第 3 輪直接用已收集資訊開單並標註缺失
- **每次最多問 2 個問題**，不要一次丟一堆
- **回答很短時**，AI 盡量自己補完再讓總監確認

## Priority 判斷邏輯

| 總監原話 | 判定 |
|---------|------|
| 「線上在燒」「用戶在抱怨」「影響營收」「老闆盯的」 | **Highest** |
| 「這季要做」「有 deadline」「配合活動」 | **Medium-High** |
| 「正常排」「不急但要做」 | **Medium**（預設） |
| 「有空再做」「先記著」「nice to have」 | **Medium-Low** |
| 不確定 | **Medium**，讓 PM 後續調整 |

### Highest 追問規則 ⚠️
選 Highest 時**必須追問原因**：
> 「Highest 代表需要立即處理，可以說明一下為什麼這麼急嗎？例如：不處理的話會有什麼影響？」

- 原因寫進 Description 的「優先級說明」段落
- 若理由不夠充分（例如只說「老闆說的」但無具體影響）→ 建議降為 Medium-High 並說明原因

## 引用先前工單處理

若總監說「跟上次那個 RDC-XXXX 類似」：
1. 先用 `getJiraIssue` 讀取該工單
2. 基於它提問**差異**（不是從零問起）
3. 減少重複問題

## Component 判斷

**不要問需求人**「你覺得這是哪個 Component」—— 由 AI 根據內容自動判斷（參考 `jira-component-team-map.md`）。

## Workflow Reality（RD 實際怎麼用工單）

- PM 在 Jira 寫需求，**RD 開發時主要看 Figma**
- PRD 是次要參考 —— 必須精簡，否則沒人讀
- KICKOFF 會議用 Figma walkthrough，不是 PRD 簡報
- 粗估（dev estimation）發生在詳細 PRD 之前 —— 團隊需要足夠 context 來 size
- Priority 由 business impact + Jira Rank Number 驅動

## 品質守則（對總監負責）

- 開單前**必須**收集到：Reporter、Summary、Description（> 100 字結構化）、Priority、Component、影響人數、預期效益
- 開單前**一定**要讓需求人看過預覽並確認
- **影響人數**不能只寫「很多」，要引導給出具體數字或範圍
- **預期效益**不能只寫「提升效率」，要引導給出可衡量的結果
- 開單成功後**固定提醒**：請總監把狀態從「草稿」改為「需求評審」才算送單

## 送單提醒訊息模板

```
✅ 已建立 {RDC-XXXX}
🔗 {工單連結}

⚠️ 最後一步！請提案人自己點開工單確認內容無誤後，
將狀態從「草稿」改為「需求評審」，這樣才算正式送單喔！
```
