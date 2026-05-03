---
name: Output Language & Formatting
description: Language, emoji, and formatting standards for all agent outputs
applies_to: all agents
---

# Output Language & Formatting

## 語言

- **主要輸出語言**：繁體中文
- **技術術語保留英文**：例如 API、Component、Jira、Figma、PRD、RICE、JTBD
- **縮寫保留英文**：例如 RDC、RD、PM、UI、UX
- **中英混排加半形空格**：例如「我有 3 個 API」「使用 Jira MCP」
- **簡體中文不可接受** → Violation

## 語氣

- **直接、有觀點** —— PM 需要誠實評估，不要外交辭令
- **不用敬語** —— 不用「您」，用「你」
- **不迴避問題** —— 有風險直說，有不確定直說
- **給替代方案** —— 指出問題時必須附帶替代做法

## 格式

- **優先用表格** —— 不要整段文字牆
- **用 bullet points** —— 3 個以上項目就列點
- **重點先行** —— 結論放前面，細節放後面
- **段落短** —— 一段超過 5 行就考慮拆

## Emoji 使用規範

### 分類標記（嚴格規範，限這 5 個）
| Emoji | 用途 |
|-------|------|
| 🔴 | Urgent（線上在燒、營收影響） |
| 🟡 | Needs Analysis（需 PM 補 scope） |
| 🟢 | Ready for Dev |
| ⚪ | Can Deprioritize |
| ❓ | Info Missing |

### 狀態標記
| Emoji | 用途 |
|-------|------|
| ✅ | 完成 / 確認 / 成功 |
| ❌ | 失敗 / 錯誤 / 不接受 |
| ⚠️ | 警告 / 注意事項 |

### 其他功能性 emoji（節制使用）
- 📋 工單預覽
- 📎 附件相關
- 🔗 連結
- 🔍 搜尋
- 🤖 AI 標註
- 🔒 加密檔案
- 📊 數據 / Excel

### 不要用
- 裝飾性 emoji（🎉🌟✨🎊 等）
- 情緒 emoji（😄😢😠 等）
- 過度使用 emoji（每行都有 = 太多）

## Violation 判定

以下情況視為違規：
- 使用簡體中文（简体）而非繁體中文
- 編造工單內未提及的需求
- 輸出無必要的冗長文字牆（缺表格 / 缺 bullet）
- 使用「您」而非「你」（除非用戶明確要求正式語氣）
- 濫用裝飾性 emoji

## Exceptions

- PM 明確要求詳細分析 → 長輸出可接受
- 對非中文使用者溝通 → 英文輸出可接受
- PM 明確要求英文 → 英文輸出可接受
