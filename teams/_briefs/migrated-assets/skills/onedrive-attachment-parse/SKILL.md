---
name: onedrive-attachment-parse
description: Parse attachments (PDF/Word/Excel/PowerPoint/images) uploaded during stakeholder interview. Detect unreadable files (D-security encrypted, password-protected) and request PDF re-upload. Use whenever a director sends an attachment during intake.
---

# OneDrive Attachment Parse

## Purpose

處理訪談過程中需求人上傳的附件，確保只接受可解析的檔案。不可解析的檔案（D-security 加密、密碼保護、格式不支援、檔案損毀）要統一請提案人轉 PDF 重傳。

## 核心原則 ⚠️

> **不接受無法閱讀和解析的檔案。不可解析的檔案不開單。**

原因：硬憑對話內容開單會缺少關鍵細節。

## Related Skills / Rules

- 訪談流程中的附件觸發點（Q4 / Q7）→ `stakeholder-interview-q0q9` skill
- 解析結果整合進 Description → `jira-ticket-create` skill

## 檢查流程

```
Step 1: 偵測檔案類型（副檔名 + 檔頭）
        │
Step 2: 嘗試解析內容
        │
        ├─ 解析成功 ✅ → 整合進 Description，繼續訪談
        │
        └─ 解析失敗 ❌ → 判斷失敗原因
                │
                ├─ D-security 加密 → 回覆【加密檔案提示】
                ├─ 密碼保護 → 回覆【密碼保護提示】
                ├─ 格式不支援 → 回覆【格式不支援提示】
                └─ 檔案損毀 → 回覆【檔案損毀提示】
```

## 可接受的檔案類型

| 類型 | 副檔名 | 解析方式 |
|------|--------|---------|
| PDF | `.pdf` | pdf-parse（**首選格式**，不受 D-security 限制） |
| Word | `.docx` | mammoth |
| Excel | `.xlsx`, `.xls` | xlsx |
| PowerPoint | `.pptx` | 解析 XML |
| 圖片 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | OCR + vision model（Claude multimodal） |
| 純文字 | `.txt`, `.md`, `.csv` | 直接讀取 |

**不可接受的檔案**：統一請提案人**另存為 PDF**。

## 回覆模板

### 加密檔案提示（D-security）

```
這份檔案有 D-security 加密，我沒辦法讀取內容 🔒

麻煩你把它轉成 PDF 再上傳一次：
1. 用 Office 打開這個檔案
2. 檔案 → 另存新檔 → 選擇 PDF 格式
3. 把 PDF 拖進來給我

（PDF 目前不受 D-security 限制，我可以直接讀）

等你 PDF 檔案好了告訴我，我們繼續 👍
```

### 密碼保護提示

```
這份檔案有密碼保護，我讀不到內容。

麻煩你先解除密碼，或是另存成 PDF 給我（PDF 我可以直接讀）。
```

### 格式不支援提示

```
這個檔案格式我暫時處理不了（{副檔名}）。

目前可以讀：PDF、Word、Excel、PowerPoint、常見圖片格式。
麻煩你轉成 PDF 給我，這樣最保險。
```

### 檔案損毀提示

```
這個檔案似乎有問題，我打不開。

可以請你重新下載一次，或是另存成 PDF 再傳給我嗎？
```

## 嚴格執行規則

1. **檔案不能讀就不能開單** — 不能只憑對話內容硬開（會缺關鍵細節）
2. **不猜測檔案內容** — 解析失敗時**絕對不要**用「可能是...」假設內容
3. **提示後等待新檔案** — 不繼續訪談其他問題，等提案人重傳 PDF
4. **多次重傳仍失敗** → 建議改口述重點，AI 根據口述開單（工單標註「無附件輔助」）
5. **多個檔案混合** → 先處理可讀的，最後統一提醒加密的那幾份要轉 PDF

## 處理順序範例

### 多檔案混合（加密 + 可讀）

```
提案人：【上傳 3 個檔案：需求書.docx（加密）、截圖.png、規格.pdf】

AI:
  收到三個檔案：
  ✅ 截圖.png — 已讀取
  ✅ 規格.pdf — 已讀取
  ❌ 需求書.docx — D-security 加密，讀不到

  我先看得到的兩份，先繼續開單問題。
  但需求書.docx 這份，麻煩你轉成 PDF 再補給我：
  Office 打開 → 另存新檔 → PDF 格式 → 上傳

  （繼續問 Q1）
```

### 單一附件（可讀）

```
提案人：[上傳 user-flow.xlsx]

AI:
  📊 收到 Excel 了，我看一下...
  
  讀到的內容：
  - Sheet 1「使用者流程」：列了 8 個步驟
  - Sheet 2「驗收清單」：12 項檢核點
  
  我理解這是要設計新的會員註冊流程，對嗎？
```

### 單一附件（加密，不可讀）

```
提案人：[上傳 需求清單.docx]

AI:
  這份檔案有 D-security 加密，我沒辦法讀取內容 🔒

  麻煩你把它轉成 PDF 再上傳一次：
  1. 用 Office 打開這個檔案
  2. 檔案 → 另存新檔 → 選擇 PDF 格式
  3. 把 PDF 拖進來給我

  （PDF 目前不受 D-security 限制，我可以直接讀）

  等你 PDF 檔案好了告訴我，我們繼續 👍

[等待中 —— 不繼續問 Q1]
```

## MS365 整合備忘

- Teams 上傳的檔案自動存到 OneDrive
- 用 MS365 MCP 讀取檔案內容
- 圖片用 Claude multimodal 直接分析，不需 OCR 預處理
- 需 IT admin consent（delegated permission）才能存取 OneDrive / Teams 內容

## Quality Gates

- 解析成功才能繼續訪談
- 解析結果必須整合到 Description 的「參考資料」段落
- 不可解析的檔案**不得**繞過 —— 一律請提案人轉 PDF
- 不得猜測或編造未解析出的內容
