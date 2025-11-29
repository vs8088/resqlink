---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''

---

---
name: "Feature request"
about: "Suggest a new feature or improvement for ResQ-Link"
title: "[Feature] "
labels: ["feature"]
assignees: ""
---

## 1. Summary

> Short and clear summary of the feature.

Example:
- Add an "Export to CSV" button on the incident list page in the ResQ-Link mobile app.

---

## 2. User Story

> Describe who needs this and why.

As a **[role / user type]**,  
I want **[the capability]**,  
so that **[the value / outcome]**.

Example:
- As a duty officer, I want to export incident records to CSV so that I can analyze them in Excel.

---

## 3. Scope & Details

### 3.1 Affected Area (check all that apply)

- [ ] Mobile app – iOS (ResQ-Link Mobile)
- [ ] Mobile app – Android (ResQ-Link Mobile)
- [ ] Backend API
- [ ] Admin / Web portal
- [ ] Other: `...`

### 3.2 Feature Details

> Explain what should happen. Prefer behaviour over UI design details.

- What should the user see / do?
- What data needs to be stored / changed?
- How should it interact with existing flows in ResQ-Link?

Example:
- Add a new "Export CSV" button to the top-right of the incident list.
- Export only filtered incidents (status, date range, assignee).
- Filename pattern: `incidents-<yyyyMMdd>-<environment>.csv`.

---

## 4. Acceptance Criteria

> Define conditions we can test and tick off.  
> Use bullet points or checkboxes.

- [ ] User can trigger the feature without errors.
- [ ] The result matches what is shown in the UI (filters applied correctly).
- [ ] Works in **dev**, **staging**, and **production** environments.
- [ ] Error states are handled gracefully (e.g. network error, empty data).

---

## 5. Non-functional Requirements (if any)

> Performance, security, permissions, etc.

- Performance:
  - Example: Export should complete within 10 seconds for up to 10,000 records.
- Permissions:
  - Example: Only users with role **Supervisor** or above can access this feature.
- Other:
  - Example: Follow existing ResQ-Link logging & auditing pattern.

---

## 6. Dependencies / Related Tickets

> Link anything that might affect this feature.

- Related issues: #123, #456
- Related PRs: #789
- Design / mockups: Figma link, screenshots, or documents.

---

## 7. Additional Notes

> Anything else the team should know? Edge cases, open questions, etc.

- ...

---
name: "功能需求 / Feature Request（繁體中文）"
about: "提交 ResQ-Link 新功能或優化需求"
title: "[功能] "
labels: ["feature"]
assignees: ""
---

## 1. 功能摘要（Summary）

> 用 1–2 句簡單說明你想加嘅功能。

範例：
- 在 ResQ-Link 手機 App 嘅事件列表頁面新增一個「匯出 CSV」按鈕。

---

## 2. 使用者故事（User Story）

> 說明係邊個需要呢個功能、想做到咩、以及帶來咩好處。

身為一個 **【角色 / 使用者類型】**，  
我想要 **【做到的事情 / 功能】**，  
從而可以 **【得到的好處 / 價值】**。

範例：
- 身為當值主管，我想可以把事件紀錄匯出成 CSV，方便用 Excel 做統計分析。

---

## 3. 範圍與詳細內容（Scope & Details）

### 3.1 影響範圍（勾選適用項目）

- [ ] 手機 App – iOS（ResQ-Link Mobile）
- [ ] 手機 App – Android（ResQ-Link Mobile）
- [ ] 後端 API
- [ ] 管理後台 / Web Portal
- [ ] 其他：`...`

### 3.2 功能說明（行為為主）

> 盡量描述「行為」同「流程」，唔好只寫 UI 見到咩顏色。

- 使用者可以喺邊個畫面、做咩操作？
- 有咩資料需要儲存 / 更新？
- 同 ResQ-Link 目前既有流程點樣銜接？

範例：
- 喺事件列表右上角新增「匯出 CSV」按鈕。
- 匯出內容只包含目前列表 filter 後嘅事件（狀態、日期範圍、負責人）。
- 檔案命名規則：`incidents-<yyyyMMdd>-<environment>.csv`。

---

## 4. 驗收標準（Acceptance Criteria）

> 寫出可以測試、可以打勾嘅條件。

- [ ] 使用者可以順利觸發新功能，冇錯誤訊息。
- [ ] 匯出結果與畫面顯示一致（有套用 filter 時亦正確）。
- [ ] 在 **dev / staging / production** 三個環境都可以正常運作。
- [ ] 當發生錯誤（例如：網路錯誤、冇資料）時，有清楚提示。

---

## 5. 非功能性需求（Non-functional Requirements，如有）

> 包括效能、安全性、權限管理等等。

- 效能：
  - 例：在 10,000 筆資料內，匯出時間應少於 10 秒。
- 權限：
  - 例：只有角色為 **Supervisor** 或以上的使用者先可以使用此功能。
- 其他：
  - 例：需跟隨 ResQ-Link 既有的 logging / audit 記錄方式。

---

## 6. 依賴與相關 Ticket（Dependencies / Related）

> 列出相關 issue / PR / 設計。

- 相關 issue：#123、#456
- 相關 PR：#789
- 設計 / Mockup：Figma 連結、截圖或其他文件。

---

## 7. 補充說明（Additional Notes）

> 其他想提醒團隊留意的事項、邊界情況、未決問題等等。

- ...
