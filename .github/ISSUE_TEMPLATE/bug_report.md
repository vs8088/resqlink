---
name: Bug report
about: Create a report to help us improve. Report a bug or unexpected behaviour.
title: "[BUG]"
labels: bug
assignees: ''

---

---
name: "Bug report"
about: "Report a bug or unexpected behaviour in ResQlink"
title: "[Bug] "
labels: ["bug"]
assignees: ""
---

## 1. Summary

> Short description of the bug.

Example:
- Incident list fails to load on ResQlink mobile app when filters are applied.

---

## 2. Environment

> Where did this bug happen?

- App / Module:  
  - Example: ResQlink Mobile – Incident List
- Platform / OS:  
  - Example: Android 14 / iOS 18
- App version / Build number:  
  - Example: 1.3.0 (build 145)
- Environment:  
  - [ ] Development  
  - [ ] Staging  
  - [ ] Production  

---

## 3. Steps to Reproduce

> Provide a clear, step-by-step list so we can reproduce the bug.

1. Go to `Incident List` in the ResQlink mobile app.
2. Set filter: Status = `Open`, Date range = `Last 7 days`.
3. Tap on **Apply**.
4. Observe the blank screen / error message.

---

## 4. Expected Behaviour

> What did you expect to happen?

Example:
- Filtered incidents should be displayed in the list without errors.

---

## 5. Actual Behaviour

> What actually happened?

- What did you see on the screen?
- Any error messages or codes?
- Did the app crash or freeze?

Example:
- Screen stays blank with a spinning loader.
- After 10 seconds, a generic "Something went wrong" toast appears.

---

## 6. Screenshots / Screen Recording (if available)

> Attach images or videos that show the issue.

- Screenshot(s):  
- Screen recording(s):  

---

## 7. Logs / Error Messages (if available)

> Paste relevant logs, stack traces, or network error messages.  
> Please remove any sensitive data before sharing.

[Paste logs here]

---

## 8. Frequency & Impact
Frequency:

    Happens every time

    Happens often

    Happens rarely

Impact:

    Blocking – cannot use a core feature

    High – severe impact on daily use

    Medium – workaround exists

    Low – minor issue / visual glitch

---

## 9. Additional Context
Any other details that might help? (e.g. specific user account, time range, network condition, steps you already tried)

---

## 2️⃣ 繁體中文模板 — `bug_report_zh-Hant.md`

```markdown
---
name: "錯誤回報 / Bug Report（繁體中文）"
about: "回報 ResQlink 中出現的錯誤或異常行為"
title: "[錯誤] "
labels: ["bug"]
assignees: ""
---

## 1. 問題摘要（Summary）

> 用 1–2 句簡單描述問題。

範例：
- 在 ResQlink 手機 App 套用篩選條件後，事件列表無法載入。

---

## 2. 發生環境（Environment）

> 呢個問題喺邊度出現？

- App / 模組：  
  - 例：ResQlink Mobile – 事件列表（Incident List）
- 平台 / 作業系統：  
  - 例：Android 14 / iOS 18
- App 版本 / Build 編號：  
  - 例：1.3.0（build 145）
- 環境（Environment）：  
  - [ ] Development（開發）  
  - [ ] Staging（測試）  
  - [ ] Production（正式）  

---

## 3. 重現步驟（Steps to Reproduce）

> 請列出具體步驟，方便我們重現問題。

1. 進入 ResQlink 手機 App 嘅「事件列表」頁面。
2. 設定篩選條件：狀態 = `Open`、日期區間 = `最近 7 日`。
3. 點選 **套用（Apply）**。
4. 觀察畫面出現空白 / 錯誤提示。

---

## 4. 預期結果（Expected Behaviour）

> 正常情況下，你期望見到乜嘢？

範例：
- 應該顯示符合篩選條件的事件列表，並且沒有錯誤訊息。

---

## 5. 實際結果（Actual Behaviour）

> 實際發生咗乜嘢？

- 畫面實際顯示點？
- 有冇錯誤訊息或錯誤碼？
- App 會唔會當機 / Freeze？

範例：
- 畫面保持空白，只見到 Loading 圖示。
- 約 10 秒後出現「系統發生錯誤，請稍後再試」提示。

---

## 6. 截圖 / 錄影（如有）

> 請附上截圖或畫面錄影，有助更快定位問題。

- 截圖：  
- 錄影：  

---

## 7. 日誌 / 錯誤訊息（如有）

> 貼上相關的 log、錯誤訊息或 API 回應內容。  
> 請先移除任何敏感資料。


【請在此貼上 log / 錯誤訊息】

## 8. 發生頻率與影響程度（Frequency & Impact）

發生頻率：

     每次都會重現

     經常發生

     偶爾發生

影響程度：

     阻斷性（核心功能完全無法使用）

     高（嚴重影響日常使用）

     中（有替代方案，可以暫時繞過）

     低（輕微問題 / 版面顯示小 bug）

## 9. 其他補充說明（Additional Context）

任何可能有幫助的資訊：
例如特定帳號、時間範圍、網路狀況、你已經嘗試過嘅排除方法等。
