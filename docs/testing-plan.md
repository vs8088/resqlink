# 測試驗證計畫 Test Plan（Phase 1–4）

本文件說明 ResQ-Link 系統由 Phase 1 至 Phase 4 的測試範圍、必測場景、回歸腳本及優先順序。  
This document defines the test scope, required scenarios, regression scripts, and priorities for ResQ-Link Phases 1–4.

---

## 1. 階段必測場景與完成度 Phased Coverage & Status

| Phase | 必測場景 / Required Scenarios | 完成度 / Status | 缺口 / Gaps |
| --- | --- | --- | --- |
| **Phase 1 – MVP（線上直連 / Online Direct）** | 1) 端對端加密簽章後直連 `/api/sos`、`/api/status` 成功。<br>1) End-to-end encrypted & signed payloads successfully reach `/api/sos` and `/api/status`.<br><br>2) 無網路時正確切換到 BLE 模式不中斷 UI 操作。<br>2) When network is lost, the app gracefully falls back to BLE mode without breaking UI flows.<br><br>3) GPS 權限與定位精度回傳（含多語系提示）。<br>3) GPS permission flow and location accuracy behave as expected, with localized prompts (EN/繁中). | 主要實作已存在（路線圖列出 SOS／安全流程、線上／離線切換與在地化皆完成）。<br>Core flows implemented (SOS/status, online/offline switching and localization completed). | 缺少自動化回歸腳本與真機網路切換覆蓋。<br>Missing automation scripts and real-device coverage for network switching. |
| **Phase 2 – BLE 單跳中繼 / Single-Hop Relay** | 1) Peripheral 廣播 + Central 掃描／連線／特徵值寫入完整流程。<br>1) Peripheral advertising plus Central scanning/connection/characteristic-write tested end-to-end.<br><br>2) 120-byte 分片與重組成功並可上傳伺服器。<br>2) 120-byte (or configured) chunking & reassembly works and uploads successfully to the server.<br><br>3) 斷線後自動取消連線、不殘留廣播。<br>3) After disconnection, the app stops advertising/connection attempts and leaves no stale BLE state. | BLE 廣播、掃描、分片／重組與 Notify 流程已在行動端實作；已有雙機手動測試劇本。<br>BLE advertising/scan, chunking/reassembly and notify flow implemented on mobile; two-device manual playbook exists. | 缺少自動化回歸腳本、異常（半途斷線）覆蓋與伺服端驗證流程。<br>Lack of automated regression, mid-transfer failure coverage, and server-side verification flows. |
| **Phase 3 – 多跳、重送／去重 Multi-hop Retry & Dedupe** | 1) TTL 控制下的多跳轉發與佇列重送。<br>1) Multi-hop forwarding under TTL control with queued retry.<br><br>2) 裝置端去重視窗 + 伺服端 hash 去重。<br>2) Device-side temporal de-duplication window plus server-side hash-based de-duplication.<br><br>3) 佇列重試與丟棄條件（例如 TTL 用盡、重試次數上限）。<br>3) Queue retry and drop conditions (TTL exhaustion, max retry exceeded, etc.). | Mesh 包裝／解包、TTL、佇列重送、行動端去重與伺服端 hash 去重均已存在。<br>Mesh wrap/unwrap, TTL, queue retry, device-side dedupe and server-side hash dedupe implemented. | 尚無跨三裝置的系統測試；需驗證 TTL 過期與佇列退避參數。<br>No tri-device system tests yet; need validation of TTL expiry behaviour and retry backoff parameters. |
| **Phase 4 – 親友查詢與通知 / Family Query & Push** | 1) `/status` 單／批量查詢回傳最新紀錄。<br>1) `/status` single and batch queries return the latest records per UID.<br><br>2) `/history/:uid` 依 `limit` 取回歷史紀錄。<br>2) `/history/:uid` respects the `limit` parameter and returns history in the correct order.<br><br>3) 狀態更新觸發推播並清理無效 Token。<br>3) Status updates trigger push notifications and clean up invalid tokens. | API、歷史查詢與 FCM 推播／Token 修剪邏輯已實作。<br>APIs, history queries, FCM push and token pruning logic implemented. | 未有端到端推播驗證與資料庫驗收腳本；需補授權／權限相關測試。<br>Missing end-to-end push tests, DB acceptance scripts, and auth/permission coverage. |

---

## 2. 回歸腳本 Regression Scripts（Phase 2–4）

本節列出針對 Phase 2–4 的重點回歸場景與步驟，可轉寫成自動化腳本或手動測試案例。  
This section describes key regression scenarios and steps for Phases 2–4, which can be converted into automated scripts or manual test cases.

---

### 2.1 BLE 多跳（Phase 3） / Multi-hop BLE

**前置條件 Pre-conditions**

- 三部裝置：A／B／C。 / Three devices: A, B and C.  
  - A：無網路（飛航模式但開啟 BLE）。 / A: No Internet (airplane mode with BLE enabled).  
  - B：無網路，只開啟 BLE。 / B: No Internet, BLE enabled only.  
  - C：具備穩定網路連線（4G/5G/Wi-Fi）。 / C: Stable Internet connection (4G/5G/Wi-Fi).  
- A 上設定帶較長備註的 SOS，以確保產生多個分片。 / Configure an SOS on A with a long comment to guarantee multiple chunks are generated.

**步驟 Steps**

1. 在 A 啟動 SOS，呼叫 `broadcastSOS`。 / Start SOS on device A and call `broadcastSOS`.  
2. B 啟動掃描，偵測 A 的 `ResQ_Service` 並建立連線，取得所有分片。 / Start scanning on B, detect A’s `ResQ_Service`, connect, and receive all chunks.  
3. B 保持離線狀態，呼叫 `MeshRouter.unwrap`，確認 TTL > 0，將封包放入佇列 `enqueueRebroadcast`。 / Keep B offline, call `MeshRouter.unwrap`, verify TTL > 0, and enqueue the packet via `enqueueRebroadcast`.  
4. B 開始廣播；C 掃描並連線至 B，透過 BLE 取得封包。 / Start advertising on B; C scans, connects to B, and retrieves the packet via BLE.  
5. C 偵測自己有網路後，直接呼叫 API 上傳（例如 `/api/sos/relay`）。 / When C detects it has Internet, it uploads the payload to the server (e.g. `/api/sos/relay`).  

**驗證 Verify**

- B／C 日誌中： / On B/C logs:  
  - 出現 `ble_relay_rebroadcast`、`ble_queue_send`、`ble_relay_upload` 等事件。 / Events such as `ble_relay_rebroadcast`, `ble_queue_send`, and `ble_relay_upload` are present.  
- 伺服端紀錄： / On the server side:  
  - 資料列中 `relay_meta.hops` 含 hop 路徑（如 A→B→C）。 / `relay_meta.hops` includes the hop path (e.g. A→B→C).  
  - `relay_meta.ttl` 隨 hop 遞減，直至到達伺服端。 / `relay_meta.ttl` decreases with each hop until it reaches the server.

---

### 2.2 重送／去重（Phase 3） Retry & De-duplication

**前置條件 Pre-conditions**

- 兩部裝置：A／B。 / Two devices: A and B.  
- B 啟用離線佇列與廣播重送邏輯。 / B has offline queue and re-broadcast logic enabled.  
- 伺服端開啟重覆 hash 記錄（例如 `payload_hash` 唯一索引）。 / The server has hash-based duplicate tracking enabled (e.g. a unique `payload_hash` index).

**步驟 Steps**

1. A 產生同一組 SOS Payload，透過 BLE 向 B 傳送兩次（第二次在 2 分鐘內）。 / Generate the same SOS payload on A and send it to B twice via BLE (second time within 2 minutes).  
2. B 無網路，兩次封包均先進入佇列並嘗試廣播。 / With B offline, both payloads are placed into the queue and prepared for broadcast.  
3. 讓 B 連上網路，觸發佇列上傳。 / Bring B online and trigger queue upload to the server.  

**驗證 Verify**

- 行動端： / On the mobile side:  
  - `seenPayloads` 或類似去重結構命中第二次封包，第二次不再重覆入佇列。 / `seenPayloads` (or equivalent dedupe structure) marks the second payload as seen, preventing it from being re-queued.  
- 伺服端： / On the server side:  
  - `MeshService.isDuplicate` 返回 `duplicate: true`（或等價欄位）。 / `MeshService.isDuplicate` returns `duplicate: true` (or equivalent field).  
  - 資料庫中只新增一筆紀錄，第二次請求被判定為重覆。 / Only one record is inserted into the database; the second request is flagged as duplicate and not persisted as a new row.

---

### 2.3 推播通知（Phase 4） Push Notification

**前置條件 Pre-conditions**

- 測試帳號 A（倖存者）、B（親友）。 / Test accounts: A (survivor) and B (family).  
- B 裝置完成 FCM／APNS 設定並成功註冊 Token。 / Device B has FCM/APNS configured and a push token successfully registered.  
- DB 中 `contact_tokens`（或等價表）已有一筆綁定 B 裝置的 Token。 / Table `contact_tokens` (or equivalent) contains a row linking B’s device to the token.

**步驟 Steps**

1. 以 A 身份呼叫 `/api/status` 上報新狀態（例如 `status=SAFE` 或 `status=CRITICAL`）。 / As A, call `/api/status` to submit a new status (e.g. `status=SAFE` or `status=CRITICAL`).  
2. 伺服端觸發 `NotificationService.sendPush`，向 B 裝置 Token 發送推播。 / The server triggers `NotificationService.sendPush` and sends a push notification to B’s token.  
3. 模擬一組失效 Token（例如刻意刪除 App 或使用過期 Token），再次觸發狀態更新。 / Simulate an invalid token (uninstall app or use an expired token) and trigger another status update.  

**驗證 Verify**

- 伺服端： / On the server:  
  - 日誌中出現 `notify_sent` 或等價事件。 / Log entries for `notify_sent` (or equivalent) are present.  
  - 對失效 Token，FCM 回傳錯誤碼並觸發 Token 清除，`contact_tokens` 中對應列被移除或標記為無效。 / For invalid tokens, FCM returns an error and triggers token cleanup; the row in `contact_tokens` is removed or marked invalid.  
- 行動端： / On the client:  
  - B 裝置實際收到推播，payload 中含 `uid`、`status`、`timestamp` 等欄位。 / Device B receives a push notification whose payload includes `uid`, `status`, `timestamp`, etc.

---

### 2.4 歷史查詢（Phase 4） History Queries

**前置條件 Pre-conditions**

- 同一 UID 預先插入 3 筆時間不同的 SOS／Status 記錄（例如使用測試 Seed Script）。 / Pre-insert three SOS/Status records for the same UID with different timestamps (e.g. via a seed script).

**步驟 Steps**

1. 呼叫 `/api/status/:uid`。 / Call `/api/status/:uid`.  
2. 呼叫 `/api/history/:uid?limit=2`。 / Call `/api/history/:uid?limit=2`.  

**驗證 Verify**

- `/api/status/:uid`： / For `/api/status/:uid`:  
  - 回傳的紀錄為時間最新的那一筆。 / The response contains only the latest record by timestamp.  
- `/api/history/:uid?limit=2`： / For `/api/history/:uid?limit=2`:  
  - 只回傳 2 筆資料，並以時間倒序排列。 / Exactly two records are returned in reverse chronological order.  
  - 每筆的 `relay_meta` 與位置欄位與 DB 一致，無越權資料洩漏。 / For each record, `relay_meta` and location fields match the database and no unauthorized data is exposed.

---

## 3. 優先順序與責任人 Priority & Ownership

### 3.1 優先級 Priority

1. **Phase 3 – 多跳 & 去重 Multi-hop & De-duplication（High Risk）**  
   - 風險最高（涉及 Mesh、TTL、佇列、去重等多模組協同）。 / Highest risk (involves multiple modules: mesh logic, TTL, queues, dedupe, etc.).  
   - 需先完成跨三裝置系統測試，確認 Mesh 協定行為穩定。 / Tri-device system tests must be completed first to validate mesh protocol stability.  

2. **Phase 2 – 單跳中繼 Single-Hop Relay（Baseline）**  
   - 作為 Phase 3 多跳的基線，需定期回歸以確保 BLE 基礎行為未回退。 / Serves as a baseline for Phase 3 multi-hop; should be part of regular regression to ensure BLE fundamentals don’t regress.  

3. **Phase 4 – 通知與歷史 Push & History**  
   - 直接影響親友體驗與法律／合規風險（資料呈現與授權）。 / Directly impacts family user experience and potential legal/compliance risks (data presentation and authorization).  
   - 須完成端到端推播與歷史查詢的驗收。 / End-to-end push and history query acceptance tests are required.  

4. **Phase 1 – 直連與權限 Online Direct & Permissions**  
   - 作為整體系統的基礎能力（加密、API、權限與在地化）。 / Provides the foundation (encryption, APIs, permissions, localization) for the whole system.  
   - 建議每個 Release 做一次「煙囪測試」（從安裝 → 首次啟動 → 權限 → 一鍵求救）。 / For every release, run a “smoke/silo test” from install → first launch → permissions → one-tap SOS.

### 3.2 責任分工 Ownership

- **Mobile QA（iOS／Android）**  
  - BLE 單跳／多跳場景（Phase 2–3）。 / BLE single-hop and multi-hop scenarios (Phases 2–3).  
  - 推播展示與在地化文案確認（Phase 4）。 / Verification of push notification rendering and localization strings (Phase 4).  
  - 權限流程、線上／離線切換（Phase 1）。 / Permission flows and online/offline switching tests (Phase 1).  

- **Backend QA**  
  - API 正確性與邊界情境（Phase 1, 4）。 / API correctness and edge cases (Phases 1 and 4).  
  - 資料庫 Schema 與去重邏輯驗證（Phase 3）。 / Validation of database schema and deduplication logic (Phase 3).  
  - 推播服務、Token 修剪、授權／權限測試。 / Push service, token pruning, and auth/permission tests.  

- **Integration QA／E2E**  
  - 三裝置多跳 Mesh 系統測試（Phase 3）。 / Tri-device multi-hop mesh system tests (Phase 3).  
  - 帳號關聯、親友查詢與通知的端到端路徑（Phase 4）。 / End-to-end flows for account linking, family inquiry, and notifications (Phase 4).  

---

## 4. 後續擴充建議 Next Steps

- 新增 `## Changelog / 變更紀錄` 區段，每次改動協議或 API 時記錄對應測試更新。  
  Add a `## Changelog / 變更紀錄` section and log test updates whenever the protocol or APIs change.  

- 將本文件中的場景轉換為自動化腳本（例如 Jest + Detox for mobile，Postman／Newman 或 Playwright for backend），並掛入 CI。  
  Convert the scenarios in this document into automated scripts (e.g. Jest + Detox for mobile; Postman/Newman or Playwright for backend) and run them in CI.  

- 補充「測試環境設定 Test Environment」段落（包含測試用 RSA key、測試 FCM 專案、Dummy GPS Routes 等）。  
  Add a **Test Environment** section (including test RSA keys, test FCM project, dummy GPS routes, etc.).  

此測試計畫可直接存成 `TEST_PLAN.md` 放在專案根目錄，並在 README 中加入連結方便查閱。  
You can store this as `TEST_PLAN.md` in the repo root and link it from the README for easy discovery.
