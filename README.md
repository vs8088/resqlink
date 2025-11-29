# ResQ-Link: Decentralized Disaster Relief Network  
# ResQ-Link：去中心化災難救援網絡

> **EN** – A Bluetooth-mesh enabled emergency app for disasters with partial or full network outage.  
> **繁中** – 面對災難導致通訊中斷時，透過藍牙網狀網絡將求救訊號「接力」到有網絡的節點，再送往救援伺服器。

---

## Table of Contents  
## 目錄

1. [Overview 概要](#overview--概要)
2. [Core Use Cases 核心使用情境](#core-use-cases--核心使用情境)
3. [System Architecture 系統架構](#system-architecture--系統架構)
4. [Data Flow 數據流程](#data-flow--數據流程)
5. [Tech Stack 技術棧](#tech-stack--技術棧)
6. [Features & App Logic 功能與邏輯](#features--app-logic--功能與邏輯)
7. [Security & Privacy 安全與私隱](#security--privacy--安全與私隱)
8. [BLE Communication Protocol 藍牙通訊協議](#ble-communication-protocol--藍牙通訊協議)
9. [Local Development Setup 本機開發環境設定教學](#local-development-setup--本機開發環境設定教學)
    - [Prerequisites 先決條件](#prerequisites--先決條件)
    - [Clone & Folder Structure 下載與目錄結構](#clone--folder-structure--下載與目錄結構)
    - [Backend Setup 後端設定步驟](#backend-setup--後端設定步驟)
    - [Database Setup 資料庫設定](#database-setup--資料庫設定)
    - [Mobile App Setup 行動裝置 App 設定](#mobile-app-setup--行動裝置-app-設定)
    - [Running the Stack 啟動整套系統](#running-the-stack--啟動整套系統)
10. [Configuration & Environment Variables 環境變數設定](#configuration--environment-variables--環境變數設定)
11. [Push Notification Setup 推播設定](#push-notification-setup--推播設定)
12. [Roadmap 開發藍圖](#roadmap--開發藍圖)
13. [How to Maintain Tables & Diagrams 表格與圖表維護指引](#how-to-maintain-tables--diagrams--表格與圖表維護指引)
14. [Contribution 貢獻方式](#contribution--貢獻方式)
15. [License 授權](#license--授權)

---

## Overview / 概要

**EN**

ResQ-Link is a cross-platform emergency relief application designed for natural disasters and mass-casualty incidents. When traditional communication infrastructure is down or unstable, ResQ-Link uses a **Bluetooth Mesh / P2P relay network** to:

- Broadcast **end-to-end encrypted SOS payloads** to nearby devices.
- Find a device with active Internet connectivity.
- Relay the SOS to a **central rescue server**.
- Provide **“Mark as Safe”** and **“Family Inquiry”** features so relatives can check the status of survivors.

**繁中**

ResQ-Link 是一個跨平台緊急救援應用程式，專為天災、事故等大規模災難而設計。當傳統通訊網絡（例如行動數據、Wi-Fi）中斷或嚴重受阻時，ResQ-Link 會利用 **藍牙網狀網絡／點對點中繼**：

- 廣播 **端對端加密** 的求救封包給附近裝置。
- 尋找仍然連得上 Internet 的裝置。
- 由該裝置代為將求救訊號送往 **中央救援伺服器**。
- 提供 **「報平安」** 及 **「親友查詢」** 功能，讓親友查閱受災者狀態。

---

## Core Use Cases / 核心使用情境

**EN**

1. **One-Tap SOS**: Survivors can send their profile + GPS location + medical info with a single tap.  
2. **Offline Relay via Bluetooth**: If the phone is offline, the SOS is relayed hop-by-hop via nearby devices until one has Internet.  
3. **Mark as Safe**: Survivors can update their status (Safe / Injured / Trapped / Hospitalized).  
4. **Family Inquiry**: Family and friends can query a survivor’s latest status and last-known location.  

**繁中**

1. **一鍵求救**：受災者一按即可發送個人檔案、GPS 位置及醫療資訊。  
2. **離線藍牙中繼**：若手機沒有網絡，SOS 封包會透過附近裝置一跳一跳中繼，直到有一部裝置能連網。  
3. **報平安**：受災者可更新狀態（平安／受傷／受困／已送院）。  
4. **親友查詢**：親友可以查詢受災者最新狀態及最後已知位置。

---

## System Architecture / 系統架構

**EN**

The system uses a **Client–Server** model with **P2P capabilities on the client side**. Clients can act as:

- **Survivor Node**: Originates SOS + status updates.
- **Relay Node**: Receives encrypted payloads via BLE and forwards them to the server when online.
- **Family Node**: Queries and subscribes to survivor status.

**繁中**

系統整體採用 **Client–Server 架構**，但 Client 端具備 **點對點（P2P）通訊能力**。每部裝置可以扮演：

- **求救節點 (Survivor Node)**：發出 SOS 與狀態更新。  
- **中繼節點 (Relay Node)**：透過 BLE 接收加密封包，待有網絡時上傳伺服器。  
- **親友節點 (Family Node)**：查詢及訂閱受災者狀態更新。

### High-Level Architecture Diagram  
### 高階架構圖（Mermaid）

```mermaid
flowchart LR
    subgraph Mobile Clients
        S[Survivor App] --- R[Relay App]
        F[Family App]
    end

    S -->|Encrypted SOS / Status| R
    R -->|Relay via BLE / HTTP| API[ResQ-Link Backend API]
    F -->|Status Inquiry| API

    API --> DB[(PostgreSQL + PostGIS)]
    API --> PUSH[[FCM / APNS]]
    API --> ORG[Rescue Organisations]
```

---

## Data Flow / 數據流程

```mermaid
flowchart TD
    User[Survivor 使用者] -->|Tap SOS| App[ResQ-Link App]

    App -->|Encrypt Payload| Local[Secure Local Storage]

    App --> NetCheck{Internet Available? <br/> 有網絡？}

    NetCheck -- YES 是 --> Server[Backend Server]
    Server -->|Decrypt & Process| Dec[Decryption & Routing]
    Dec --> Rescue[Rescue Org 救援單位]
    Dec --> FamilyPush[Notify Family 親友通知]

    NetCheck -- NO 否 --> BLE[Start BLE Advertising / Scan]
    BLE -->|Broadcast Encrypted Payload| Neighbor[Nearby Devices 鄰近裝置]

    Neighbor --> NeighborNet{Has Internet? 有網絡？}
    NeighborNet -- YES 是 --> Server
    NeighborNet -- NO 否 --> Relay[Relay to Next Device 再中繼]
    Relay --> BLE
```

---

## Tech Stack / 技術棧

| Component (EN)           | 組件（繁中）                   | Technology              | 技術說明（繁中）                                      |
| ------------------------ | ----------------------------- | ----------------------- | ----------------------------------------------------- |
| Mobile Framework         | 行動框架                      | React Native            | iOS 與 Android 跨平台開發                            |
| Bluetooth / P2P          | 藍牙／點對點                  | `react-native-ble-plx` / custom native modules | 處理 BLE 廣播、掃描、中繼數據傳輸 |
| Location                 | 位置服務                      | `react-native-geolocation-service` | 取得高精度 GPS 座標                     |
| Local Security           | 本地安全存儲                  | `react-native-keychain` | 加密後個人資料與密鑰存放於安全儲存區                  |
| Cryptography             | 加解密                        | RSA + AES (Hybrid)      | RSA 管理密鑰、AES 加密封包                             |
| Backend                  | 後端服務                      | Node.js / TypeScript (or Python) | 處理 API、解密與工作排程                    |
| Database                 | 資料庫                        | PostgreSQL + PostGIS    | 儲存位置、狀態紀錄及 Token                            |
| Push Notifications       | 推播                          | FCM / APNS              | 向親友與倖存者發送狀態更新通知                        |

---

## Features & App Logic / 功能與邏輯

### 1. One-Click SOS & Mesh Relay  
### 1. 一鍵求救與網狀中繼

**EN – Logic**

1. Read user profile from secure storage (name, medical info, emergency contacts).  
2. Acquire current GPS location & timestamp.  
3. Encrypt payload using server public key (Hybrid RSA+AES).  
4. If Internet is available → send via HTTPS.  
5. If Internet is not available → enable BLE advertising + scanning and start relay mode.  

**繁中 – 邏輯**

1. 從安全儲存讀取用戶個人檔案（姓名、醫療資訊、緊急聯絡人）。  
2. 取得當前 GPS 位置及時間戳。  
3. 使用伺服器公鑰進行混合加密（RSA + AES）。  
4. 若偵測到有網絡 → 透過 HTTPS 直接上傳伺服器。  
5. 若無網絡 → 啟動 BLE 廣播與掃描，進入中繼模式。

```ts
// src/features/sos/handleSOS.ts
import { NetworkInfo } from 'react-native-network-info';
import { BLEService } from '../services/BLEService';
import { CryptoService } from '../services/CryptoService';
import { APIService } from '../services/APIService';

export const handleSOS = async (userProfile, currentLocation) => {
  const rawData = {
    uid: userProfile.id,
    medical: userProfile.medicalInfo,
    location: currentLocation,
    timestamp: Date.now(),
    status: 'CRITICAL',
  };

  // 1) Encrypt payload using server public key
  const encryptedPayload = await CryptoService.encryptPayload(rawData);

  // 2) Check network state
  const isOnline = await NetworkInfo.isConnected();

  if (isOnline) {
    await APIService.sendSOS(encryptedPayload);
    console.log('[ResQ-Link] SOS sent via Internet');
  } else {
    console.log('[ResQ-Link] No Internet – starting BLE relay mode...');
    await BLEService.broadcastSOS(encryptedPayload);

    BLEService.scanForGateway(async (device) => {
      await BLEService.transferDataTo(device, encryptedPayload);
    });
  }
};
```

---

### 2. Survivor Status & Family Inquiry  
### 2. 倖存者狀態與親友查詢

**EN**

- **I am Safe**: Survivors can submit status such as `SAFE`, `INJURED`, `TRAPPED`, `HOSPITALIZED`.  
- **Family Search**: Family members query by ID/phone. Backend verifies permission and returns latest status + location + time if available.  
- **Notifications**: Status updates trigger push notifications to registered family tokens.

**繁中**

- **報平安**：倖存者可設定狀態，例如 `SAFE`（平安）、`INJURED`（受傷）、`TRAPPED`（受困）、`HOSPITALIZED`（已送院）。  
- **親友查詢**：親友以受災者 ID／電話查詢，伺服器驗證權限後回傳最新狀態與位置。  
- **通知推送**：當受災者狀態更新時，系統會向已綁定的親友裝置發送推播通知。

---

## Security & Privacy / 安全與私隱

### Client Side / 客戶端

- **Encryption at Rest 靜態加密**  
  - User profile (name, blood type, medical conditions, emergency contacts) is stored only after AES-256 encryption.  
  - AES key is protected by biometrics / device passcode via `react-native-keychain`.

- **Encryption in Transit 傳輸加密**  
  - SOS payload uses Hybrid Encryption:  
    - AES key is randomly generated per session.  
    - AES key is encrypted with server RSA public key.  
  - Relay devices only see encrypted binary / Base64 strings and cannot decrypt the content.

### Server Side / 伺服器端

- **Decryption 解密流程**  
  - Only backend holds RSA private key.  
  - Data is decrypted only at the moment of routing to rescue organizations or serving authorized family queries.

- **Access Control 存取控制**  
  - All API routes require auth tokens / API keys.  
  - All accesses are logged for audit.

---

## BLE Communication Protocol / 藍牙通訊協議

### Roles / 角色

- **Survivor (發送端)** – BLE Peripheral / GATT Server  
- **Relay (中繼端)** – BLE Central / GATT Client  

### UUID Definitions / UUID 定義

| Name (EN)        | 名稱（繁中）       | Type        | Example UUID                              | Properties | 說明（繁中）                                   |
| ---------------- | ------------------ | ----------- | ----------------------------------------- | ---------- | ---------------------------------------------- |
| ResQ_Service     | 主服務             | Service     | `0000FFE0-0000-1000-8000-00805F9B34FB`    | -          | 用作廣播與發現裝置                             |
| SOS_Data_Char    | 求救數據通道       | Characteristic | `0000FFE1-0000-1000-8000-00805F9B34FB` | Write / Notify | 主要數據傳輸通道，封包分段傳輸與確認 |
| Status_Char      | 狀態檢查           | Characteristic | `0000FFE2-0000-1000-8000-00805F9B34FB` | Read       | 讀取求救裝置當前狀態（待中繼／已上傳等）         |

> **Note / 注意**：實際開發時請為正式產品產生專屬 128-bit UUID，避免與其他裝置衝突。

### Protocol Workflow / 協議流程圖

```mermaid
sequenceDiagram
    participant S as Survivor (Peripheral)
    participant R as Relay (Central)
    participant V as Server (API)

    Note over S: SOS mode enabled (no Internet)
    S->>S: Start Advertising (ResQ_Service UUID)

    Note over R: Scanning in background
    R->>R: Scan filter: ResQ_Service
    R->>S: Connect()
    R->>S: discoverAllServicesAndCharacteristics()

    R->>S: Write "REQ_INFO" to SOS_Data_Char
    S->>S: Prepare encrypted payload & header
    S-->>R: Notify "HEAD|TOTAL_SIZE|CHECKSUM"

    loop Chunk Transfer
        S-->>R: Notify Chunk[i] (Base64 payload)
        R->>R: Append & validate
    end

    S-->>R: Notify "EOM" (End of Message)
    R->>R: Verify checksum
    alt OK
        R->>S: Write "ACK_OK"
        R->>V: Upload payload via HTTPS
    else Failed
        R->>S: Write "RESEND"
    end

    R->>S: Disconnect()
```

### Chunking Example / 分包傳輸範例

```ts
const CHUNK_SIZE = 150;

export const sendDataInChunks = async (characteristic, encryptedString: string) => {
  const totalChunks = Math.ceil(encryptedString.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunk = encryptedString.substring(start, end);

    const packet = JSON.stringify({
      i,            // chunk index
      t: totalChunks,
      d: chunk,
    });

    await characteristic.writeWithResponse(Base64.encode(packet));
    await delay(20); // small delay to reduce congestion
  }
};
```

---

## Local Development Setup / 本機開發環境設定教學

### Prerequisites / 先決條件

**EN**

- Node.js ≥ 18  
- Yarn or npm  
- React Native CLI environment (Xcode for iOS, Android Studio for Android)  
- PostgreSQL ≥ 14 (with PostGIS if geospatial queries are needed)  
- OpenSSL (for generating RSA keys)  
- Firebase project (for push notifications)

**繁中**

- Node.js 版本 18 或以上  
- Yarn 或 npm 套件管理工具  
- React Native 開發環境（iOS 需安裝 Xcode，Android 需安裝 Android Studio）  
- PostgreSQL 14 以上版本（若需地理查詢，建議啟用 PostGIS）  
- OpenSSL（用來產生 RSA 金鑰）  
- Firebase 專案（用於推播服務）

---

### Clone & Folder Structure / 下載與目錄結構

```bash
git clone https://github.com/<your-org>/resq-link.git
cd resq-link

# Example structure
.
├── mobile/          # React Native app
├── server/          # Backend (Node.js / TypeScript)
├── server/migrations/
├── docs/            # Additional docs / diagrams
└── README.md
```

---

### Backend Setup / 後端設定步驟

**Step 1 – Install dependencies / 安裝相依套件**

```bash
cd server
npm install
# or
yarn install
```

**Step 2 – Create environment file / 建立環境設定檔**

在 `server/.env` 新增（範例）：

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/resq_link
PGSSL=false

# Crypto
SERVER_PRIVATE_KEY_PATH=./keys/private.pem
SERVER_PUBLIC_KEY_PATH=./keys/public.pem

# Push Notifications
FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY

# API Auth
API_SHARED_SECRET=change-me-dev-token
API_AUTH_REQUIRED=false

# Server
PORT=4000
NODE_ENV=development
```

**Step 3 – Generate RSA key pair / 產生 RSA 金鑰**

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 4096
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

---

### Database Setup / 資料庫設定

**Step 1 – Create database / 建立資料庫**

```bash
createdb resq_link
```

**Step 2 – Enable PostGIS (optional) / 啟用 PostGIS（選用）**

進入 `psql`：

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Step 3 – Run migrations / 執行資料庫遷移**

```bash
psql -d resq_link -f server/migrations/0001_init.sql
```

---

### Mobile App Setup / 行動裝置 App 設定

```bash
cd mobile
npm install
# or
yarn install
```

#### iOS

1. 安裝 CocoaPods 依賴：

    ```bash
    cd ios
    pod install
    cd ..
    ```

2. 修改 `Info.plist`（加入權限描述）：

   - `NSBluetoothAlwaysUsageDescription`
   - `NSLocationWhenInUseUsageDescription`
   - `NSLocationAlwaysAndWhenInUseUsageDescription`

3. 啟用 Background Modes：

   - 使用 Xcode 開啟 `Runner` 專案  
   - 在 **Signing & Capabilities → Background Modes** 勾選：  
     - `Uses Bluetooth LE accessories`  
     - `Background fetch`（如有需要）  

4. 加入 Firebase 設定 `GoogleService-Info.plist` 至 iOS 專案根目錄。

#### Android

1. 在 `AndroidManifest.xml` 加入權限（示例）：  

   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

2. 設定 Foreground Service，用於長時間 BLE 掃描（於 `AndroidManifest.xml` 新增 `<service>` 並附 `foregroundServiceType="location|dataSync"` 等）。  

3. 將 `google-services.json` 放到 `android/app/` 目錄，並在 `build.gradle` 啟用 Firebase。

---

### Running the Stack / 啟動整套系統

**Start backend / 啟動後端：**

```bash
cd server
npm run dev      # nodemon / ts-node
# or
npm run build && npm start
```

**Start mobile app / 啟動 App：**

```bash
cd mobile

# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Configuration & Environment Variables / 環境變數設定

| Key                     | 說明（EN）                                           | 說明（繁中）                                      |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                        | PostgreSQL 連線字串                               |
| `PGSSL`                 | Whether to enforce SSL (true/false)                 | 是否啟用資料庫 SSL                                |
| `RSA_PRIVATE_KEY_PATH`  | Path to private key file                            | RSA 私鑰檔案路徑                                  |
| `RSA_PUBLIC_KEY_PATH`   | Path to public key file                             | RSA 公鑰檔案路徑                                  |
| `FCM_SERVER_KEY`        | Firebase Cloud Messaging legacy server key          | Firebase 推播 Server Key                          |
| `PORT`                  | Backend HTTP port                                   | 後端 HTTP 服務埠                                  |
| `NODE_ENV`              | `development` / `production`                        | 執行環境                                         |

---

## Push Notification Setup / 推播設定

**Backend**

- 設定 `FCM_SERVER_KEY`，伺服器會於 SOS／狀態更新時呼叫 FCM API。  

**Mobile**

- 啟用 Firebase Messaging：  
  - Android：`google-services.json` + `apply plugin: 'com.google.gms.google-services'`  
  - iOS：`GoogleService-Info.plist` + 在 App 啟動時註冊通知權限。  
- App 啟動時會：  
  - 取得當前 `uid`  
  - 向 FCM 註冊 Token  
  - 呼叫 `/api/status/register-token` 上傳 Token。

---

## Roadmap / 開發藍圖

```text
[ ] Phase 1: MVP - Basic UI, GPS, Hybrid Encryption (AES+RSA), Direct API Upload.
    - [x] SOS / Safe flows with encrypted payloads.
    - [x] Online/offline detection and fallback to BLE path.
    - [x] EN / 繁中 localization.
    - [x] Panic-proof SOS UI & family list scaffold.

[ ] Phase 2: BLE Relay - 1-hop relay (Device A -> Device B -> Server).
    - [x] Payload chunking/reassembly (PacketManager).
    - [x] Server-side hybrid decrypt.
    - [x] Survivor Peripheral advertising + Relay upload.

[ ] Phase 3: Mesh Network - Multi-hop (A -> B -> C -> Server).
    - [x] Hop TTL & dedupe.
    - [x] Retry / congestion control.
    - [x] Node queue & health tracking.

[ ] Phase 4: Inquiry System - Family connection & notifications.
    - [x] Family status API + history.
    - [x] Push notifications.
    - [x] Location history / last-known lookup.
```

**繁中小結**

- Phase 1：完成基礎 UI、定位、加密與直接上傳。  
- Phase 2：支援單跳藍牙中繼。  
- Phase 3：支援多跳網狀網絡與重覆封包過濾。  
- Phase 4：親友查詢與推播通知成熟化。

---

## How to Maintain Tables & Diagrams / 表格與圖表維護指引

**EN – Guidelines**

- **Tables**:  
  - Use standard GitHub Markdown tables.  
  - Keep English and Traditional Chinese in separate columns for readability.  
  - When adding new tech components, update the **Tech Stack** table and briefly describe both languages.

- **Diagrams** (Mermaid):  
  - All system / flow diagrams use Mermaid fenced blocks:  

    ```markdown
    ```mermaid
    flowchart TD
      ...
    ```
    ```

  - When you change any API or flow:
    - Update **System Architecture** if roles or components change.
    - Update **Data Flow** if data paths or conditions change.
    - Update **BLE Sequence Diagram** if the handshake/protocol changes.

- **Versioning**:  
  - For any breaking change, mention it under a `## Changelog` section (you can add this section later).  

**繁中 – 維護原則**

- **表格**：  
  - 一律使用 GitHub Markdown 表格格式。  
  - 英文與繁中分欄撰寫，方便閱讀。  
  - 如新增技術組件，請同步更新「技術棧」表格，並在兩種語言簡要說明用途。

- **系統圖與流程圖**：  
  - 所有架構圖／流程圖統一使用 Mermaid 語法。  
  - 如有 API、資料流程或 BLE 協議變動，請同步修改：  
    - 「系統架構圖」  
    - 「數據流程圖」  
    - 「BLE 協議 Sequence Diagram」  

- **版本紀錄**：  
  - 若為破壞性變更，建議於日後增設 `## Changelog / 變更紀錄` 小節，簡述變更內容。

---

## Contribution / 貢獻方式

**EN**

Pull Requests are welcome. Please:

1. Open an issue first for major changes (protocol, DB schema, security model).  
2. Keep code style consistent (ESLint / Prettier for TS, standard formatting for RN).  
3. Add or update tests for new features (especially around encryption, BLE, and status API).  

**繁中**

歡迎提交 Pull Request。建議流程：

1. 如涉及重大修改（通訊協議、資料庫 Schema、安全模型），請先建立 Issue 討論。  
2. 提交程式碼時請保持風格一致（前端／後端遵循現有 ESLint / Prettier 設定）。  
3. 新功能請同時補上或更新測試，特別是加密邏輯、BLE 中繼、狀態查詢 API 等核心模組。

---

## License / 授權

Mozilla Public License Version 2.0

