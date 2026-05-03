---
name: m3-design-spec
description: Generate Material Design 3 compliant UI design specs — color tokens, typography, M3 component selection, responsive layouts, interaction states. Use when building web interfaces, chat UIs, or any frontend needing developer-ready design specs (not Figma mockups).
---

# UIUX Design (Material Design 3)

## Purpose

根據 Material Design 3 規範，為團隊產出可直接實作的 UI 設計規格。包含 color tokens、typography、component 選用、layout 結構、responsive 斷點。不出 Figma 稿，產出的是**開發者可直接用的 design spec + CSS tokens**。

## Design System: Material Design 3

### 設計原則
- **Personal** — Dynamic Color，根據品牌/使用者偏好生成配色
- **Adaptive** — Window Size Classes 適配不同裝置
- **Expressive** — Shape + Motion + Typography 協同，有品牌個性
- **Design Tokens** — 所有樣式值的 single source of truth（Reference → System → Component 三層）

---

## Color System

### Color Roles（29 色）

#### Accent Colors（3 組 x 4 色 = 12 色）
| Role | 用途 |
|------|------|
| `primary` / `on-primary` | 主要操作按鈕、重要元素 |
| `primary-container` / `on-primary-container` | 次要強調區域（如：自己的訊息氣泡） |
| `secondary` / `on-secondary` | 輔助操作 |
| `secondary-container` / `on-secondary-container` | 輔助區域 |
| `tertiary` / `on-tertiary` | 第三層強調 |
| `tertiary-container` / `on-tertiary-container` | 第三層區域 |

#### Error（4 色）
| Role | 用途 |
|------|------|
| `error` / `on-error` | 錯誤狀態 |
| `error-container` / `on-error-container` | 錯誤提示背景 |

#### Surface（7+ 色）
| Role | 用途 |
|------|------|
| `surface` | 頁面底色 |
| `on-surface` | 主要文字 |
| `surface-variant` / `on-surface-variant` | 次要區域 |
| `surface-container-lowest` | 最底層容器 |
| `surface-container-low` | 低層容器 |
| `surface-container` | 標準容器 |
| `surface-container-high` | 高層容器 |
| `surface-container-highest` | 最高層容器（如：輸入框） |
| `inverse-surface` / `inverse-on-surface` | 反色區域（Snackbar） |

#### Outline（2 色）
| Role | 用途 |
|------|------|
| `outline` | 邊框、輸入框外框 |
| `outline-variant` | 分隔線、低強調邊框 |

### Tonal Palette
- 每色生成 13 tone 值（0-100）
- Light / Dark theme 從同一 palette 取不同 tone
- 工具：https://m3.material.io/theme-builder

### TutorABC 品牌色建議
```css
/* Seed color 從品牌主色推導 */
--md-sys-color-primary: #1A73E8;        /* TutorABC 藍 */
--md-sys-color-on-primary: #FFFFFF;
--md-sys-color-primary-container: #D3E3FD;
--md-sys-color-on-primary-container: #041E49;
```

---

## Typography

### Type Scale（5 roles x 3 sizes = 15 styles）

| Role | Large | Medium | Small | 用途 |
|------|-------|--------|-------|------|
| **Display** | 57/64 | 45/52 | 36/44 | 極大標題（Hero） |
| **Headline** | 32/40 | 28/36 | 24/32 | 頁面標題 |
| **Title** | 22/28 | 16/24 | 14/20 | 區塊標題、對話標題 |
| **Body** | 16/24 | 14/20 | 12/16 | 內文、訊息內容 |
| **Label** | 14/20 | 12/16 | 11/16 | 按鈕、標籤、時間戳 |

（格式：font-size/line-height，單位 sp/px）

### 字體建議
- 英文：Roboto / Roboto Flex（variable font）
- 中文：Noto Sans TC（Google Fonts 免費）
- Monospace：Roboto Mono（程式碼、工單編號）

---

## Shape System

### Corner Radius Scale
| Token | Value | 適用元件 |
|-------|-------|---------|
| `none` | 0dp | 無圓角 |
| `extra-small` | 4dp | Chip、Badge |
| `small` | 8dp | Button、Text Field |
| `medium` | 12dp | Card、Dialog |
| `large` | 16dp | 訊息氣泡、Sheet |
| `extra-large` | 28dp | FAB、大型 Card |
| `full` | 9999dp | Avatar、Pill |

### 訊息氣泡圓角建議
```css
/* 自己的訊息 — 右上角方角 */
.message-self {
  border-radius: 16px 4px 16px 16px;
}
/* 對方的訊息 — 左上角方角 */
.message-other {
  border-radius: 4px 16px 16px 16px;
}
```

---

## Elevation

| Level | Value | 用途 |
|-------|-------|------|
| 0 | 0dp | 平面元素 |
| 1 | 1dp | Card、App Bar |
| 2 | 3dp | Elevated Button |
| 3 | 6dp | FAB、Snackbar |
| 4 | 8dp | Bottom Sheet |
| 5 | 12dp | Dialog、Modal |

- M3 偏好 **tonal elevation**（用 surface tint color 表達層級）而非 drop shadow
- Shadow 僅用於需明確分離的元件（FAB、Dialog、Bottom Sheet）

---

## Layout & Responsive

### Window Size Classes
| Class | Width | Columns | Margins | 典型裝置 |
|-------|-------|---------|---------|---------|
| **Compact** | < 600dp | 4 | 16dp | 手機 |
| **Medium** | 600-840dp | 8 | 24dp | 平板直式 |
| **Expanded** | > 840dp | 12 | 24dp | 桌面、平板橫式 |

### Spacing（4dp grid）
- 常用間距：4, 8, 12, 16, 24, 32, 48dp
- 元件間：8-16dp
- 區塊間：24-32dp
- 頁面邊距：16dp（Compact）/ 24dp（Medium+）

### Canonical Layouts
| Layout | 適用場景 |
|--------|---------|
| **List-Detail** | 對話列表 + 聊天視窗（Chat App 首選） |
| **Feed** | 通知列表、工單列表 |
| **Supporting Pane** | 主內容 + 側邊資訊面板 |

---

## Interaction States

| State | Overlay Opacity | 說明 |
|-------|----------------|------|
| Enabled | 0% | 預設 |
| Hovered | 8% | 滑鼠懸停 |
| Focused | 10% | 鍵盤 focus |
| Pressed | 10% | 點擊中 |
| Dragged | 16% | 拖曳中 |
| Disabled | 38% opacity on content | 不可操作 |

State layer 使用 `on-surface` 或 content color 的半透明覆蓋。

---

## Component Selection Guide

### 依場景選元件

#### Chat Interface
| 需求 | M3 元件 | 說明 |
|------|---------|------|
| 訊息輸入 | Text Field (Outlined) | 底部輸入框 |
| 訊息氣泡 | Card (Filled) | 自訂圓角 |
| 對話列表 | List | 帶 Avatar + 摘要 |
| 側邊欄 | Navigation Drawer / Rail | Compact 用 Drawer，Expanded 用 Rail |
| 標題列 | Top App Bar (Small) | 對話對象名稱 |
| 未讀標記 | Badge | 數字 badge |
| 快捷回覆 | Suggestion Chip | 預設選項 |
| 附件選擇 | Bottom Sheet | 檔案/圖片選擇器 |
| 訊息操作 | Menu (Dropdown) | 長按/右鍵選單 |
| 系統通知 | Snackbar | 短暫提示 |
| 載入中 | Progress Indicator (Circular) | 等待 AI 回覆 |
| 新對話 | FAB | 浮動按鈕 |
| 分類標籤 | Tabs | 需求單 / Bug / 歷史 |

#### Form Interface（開單表單）
| 需求 | M3 元件 | 說明 |
|------|---------|------|
| 文字輸入 | Text Field (Filled / Outlined) | 標題、描述 |
| 下拉選單 | Menu (Exposed Dropdown) | Component、Priority |
| 選擇 | Radio Button / Checkbox | 單選/多選 |
| 確認操作 | Button (Filled) | 送出 |
| 取消操作 | Button (Text / Outlined) | 取消 |
| 日期選擇 | Date Picker | 預計完成日 |
| 切換 | Switch | 開關設定 |
| 標籤 | Chip (Input) | 選取的標籤 |

---

## Design Spec Output Format

當被呼叫時，產出以下格式的設計規格：

```markdown
# {頁面/元件名稱} Design Spec

## Layout
- Window Size Class: {Compact / Medium / Expanded}
- Canonical Layout: {List-Detail / Feed / Supporting Pane}
- Grid: {columns} columns, {margin}dp margins, {gutter}dp gutters

## Color Tokens
| Element | Token | Light Value | Dark Value |
|---------|-------|-------------|------------|
| 背景 | surface | #FFF | #1C1B1F |
| ... | ... | ... | ... |

## Typography
| Element | Style | Font | Size/Height | Weight |
|---------|-------|------|-------------|--------|
| 標題 | title-large | Noto Sans TC | 22/28 | 400 |
| ... | ... | ... | ... | ... |

## Components
| Component | M3 Type | Props/Variant |
|-----------|---------|---------------|
| 送出按鈕 | Button | variant: filled, color: primary |
| ... | ... | ... |

## Spacing
| Between | Value |
|---------|-------|
| 元件間 | 16dp |
| ... | ... |

## Responsive Behavior
| Compact (< 600) | Medium (600-840) | Expanded (> 840) |
|------------------|------------------|-------------------|
| 單欄 | ... | ... |
```

---

## Quality Gates

- 每個元件必須對應到 M3 官方元件，不能自創
- Color 只能用 color role tokens，不能用 hex hardcode
- Typography 只能用 type scale tokens（display/headline/title/body/label x large/medium/small）
- Spacing 必須是 4dp 的倍數
- 必須提供 Compact + Expanded 兩種 layout（至少）
- 必須支援 Light / Dark theme
- 中文字體必須指定（Noto Sans TC 或公司指定字體）
- 不能忽略 Interaction States（hover, focus, pressed, disabled）

## References

- M3 Official: https://m3.material.io/
- M3 Theme Builder: https://m3.material.io/theme-builder
- M3 Components: https://m3.material.io/components
- M3 Foundations: https://m3.material.io/foundations
- Google Fonts (Noto Sans TC): https://fonts.google.com/noto/specimen/Noto+Sans+TC
