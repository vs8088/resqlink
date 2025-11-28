# resqlink

Apart from emergency alerts, the app also allows survivors to mark themselves as safe. Family and friends can check the status of affected people in the app, or survivors can actively notify their contacts that they are safe, have been rescued, have been sent to hospital, or have some other status update.

呢個 App 主要用途係喺發生災難或者意外嘅時候，用戶可以透過 internet 一鍵向當地救援單位求救。如果裝置冇網絡，或者連唔到 server，App 會嘗試搵附近同樣有安裝呢個 App 嘅裝置，用藍牙幫手轉發訊息，再由有網絡嘅裝置代為發出求救訊號（即係喺藍牙網絡入面，搵到連到 internet 嘅裝置，由嗰部機幫手發送求救、個人資料、位置等等）。

ResQ-Link: Decentralized Disaster Relief Network
ResQ-Link：去中心化災難救援網絡


ResQ-Link 是一個跨平台的緊急救援應用程式。它能在災難發生導致通訊中斷時，利用藍牙網狀網絡（或點對點中繼）尋找附近有互聯網連接的裝置，將加密的求救訊號「接力」傳送至救援伺服器。同時提供報平安與親友查詢功能。


除咗求救之外，App 仲可以俾生還者「報平安」。親友可以喺 App 入面查詢受災人士狀況，或者由生還者主動通知親友自己已經平安／已獲救／已送院／或者其他最新情況。


ResQ-Link is a cross-platform emergency relief application. In the event of a disaster causing communication blackouts, it uses Bluetooth Mesh (or P2P Relay) to find nearby devices with Internet connectivity, "relaying" encrypted SOS signals to the rescue server. It also provides "Mark as Safe" and "Family Inquiry" features.


🏗 System Architecture (系統結構)系統採用 Client-Server 架構，但 Client 端具備 P2P (Peer-to-Peer) 通訊能力。
The system adopts a Client-Server architecture, but the Client side possesses P2P (Peer-to-Peer) communication capabilities.


Data Flow Diagram (數據流程圖)程式碼片段graph TD
    User(受災者 Survivor) -->|Click SOS| App
    App -->|Encrypt Data| LocalStore[Secure Storage]
    
    App -- Check Internet --> Network{Internet Available?}
    
    %% Scenario 1: Online
    Network -- YES --> Server[Backend Server]
    
    %% Scenario 2: Offline
    Network -- NO --> BLE[Bluetooth Scanning]
    BLE -->|Broadcast Encrypted Payload| Neighbor[鄰近裝置 Nearby Device]
    Neighbor -- Check Internet --> NeighborNet{Has Internet?}
    
    NeighborNet -- YES --> Server
    NeighborNet -- NO --> BLE2[Relay to Next Device...]
    
    %% Server Processing
    Server -->|Decrypt Private Key| DecryptedData
    DecryptedData -->|Forward Info| RescueOrg[救援組織 Rescue Org]
    DecryptedData -->|Notify| Family[親友 Family App]


🛠 Tech Stack (技術棧)
Component (組件),Technology (技術),Function (功能)
Mobile Framework,React Native,iOS & Android Cross-platform code.iOS 與 Android 跨平台代碼。
Bluetooth / P2P,react-native-ble-plx or react-native-nearby-api,"Handle BLE broadcasting, scanning, and data handshake.處理藍牙廣播、掃描與數據握手。"
Location,react-native-geolocation-service,High-accuracy GPS coordinates.高精度 GPS 坐標。
Local Security,react-native-keychain,Secure storage for encrypted User Profile.安全存儲加密的用戶個人資料。
Cryptography,react-native-rsa-native + AES,"Hybrid Encryption (RSA for keys, AES for payload).混合加密（RSA 用於密鑰，AES 用於數據負載）。"
Backend,Node.js / Python,"Request handling, decryption, and dispatching.請求處理、解密與調度。"
Database,PostgreSQL + PostGIS,Storing location data and encrypted records.存儲位置數據與加密記錄。


🚀 Key Features & Logic (核心功能與邏輯)
1. 1-Click SOS & Mesh Relay (一鍵求救與中繼)當用戶點擊求救按鈕時，App 將執行以下邏輯：When the user clicks the SOS button, the App executes the following logic:
    A. Acquire Data: 獲取當前 GPS 位置 + 從安全存儲讀取個人資料 (Profile)。
    B. Encryption: 使用伺服器的 Public Key (公鑰) 對數據包進行加密。
    注意：中繼者（鄰居裝置）無法解密此數據，只有伺服器持有 Private Key (私鑰) 能解讀。
    C. Network Check:
    Online: 直接 HTTP POST 到 Server。
    Offline: 啟動 BLE Peripheral Mode (廣播模式) 發送包含 UUID 的信標。
    D. Relay (中繼):
    附近的 App (Scanner) 偵測到求救信標。
    建立 BLE 連接 (GATT connection)。
    受災者 App 將「加密封包」傳輸給鄰居 App。
    鄰居 App 暫存該封包，並嘗試連接 Internet 上傳 Server。
2. Survivor Status & Inquiry (倖存者狀態與查詢)
    A. I am Safe (報平安): 用戶可發送狀態（平安/受傷/受困）。
    B. Search (親友查詢): 親友輸入受災者 ID/電話。Server 驗證權限後，若受災者已報平安或發出 SOS，Server 返回最新狀態及位置。
    C. Notifications: 當受災者狀態更新時，主動推送通知給已綁定的親友。


🔒 Security & Privacy (安全與私隱)
Client Side (客戶端)
    Encryption at Rest (靜態加密): 個人資料（姓名、血型、病歷、緊急聯絡人）在本地使用 AES-256 加密存儲，密鑰由用戶生物特徵（FaceID/TouchID）保護。
    Encryption in Transit (傳輸加密):
    求救封包使用 Hybrid Encryption (混合加密)。
    數據由隨機生成的 AES Key 加密。
    AES Key 由伺服器的 RSA Public Key 加密。
    Result: 中繼裝置 (Relay Device) 只能看到亂碼，無法窺探受災者隱私。
Server Side (伺服器端)
    Decryption (解密): 伺服器是唯一持有 RSA Private Key 的實體，僅在需要轉發給救援組織時才解密數據。Access Control (存取控制): 嚴格限制救援組織 API 的調用權限，所有數據存取皆有 Log 記錄。
📝 Implementation Snippets (實作代碼片段)
SOS Logic (Concept)
JavaScript
import { NetworkInfo } from 'react-native-network-info';
import { BLEService } from './services/BLEService';
import { CryptoService } from './services/CryptoService';
import { APIService } from './services/APIService';


const handleSOS = async (userProfile, currentLocation) => {
  // 1. Prepare Payload
  const rawData = {
    uid: userProfile.id,
    medical: userProfile.medicalInfo,
    location: currentLocation,
    timestamp: Date.now(),
    status: 'CRITICAL'
  };


  // 2. Encrypt Data (Using Server Public Key)
  // 即使通過藍牙傳輸，中繼者也無法破解
  const encryptedPayload = await CryptoService.encryptPayload(rawData);


  // 3. Check Network
  const isOnline = await NetworkInfo.isConnected();


  if (isOnline) {
    // Scenario A: Direct Upload
    await APIService.sendSOS(encryptedPayload);
    console.log('SOS sent via Internet');
  } else {
    // Scenario B: Offline Relay via Bluetooth
    console.log('No Internet. Starting BLE Broadcast...');
    
    // 廣播此加密包，尋找附近的 "Relay"
    await BLEService.broadcastSOS(encryptedPayload);
    
    // 同時掃描是否有其他裝置可以充當 Gateway
    BLEService.scanForGateway((device) => {
       BLEService.transferDataTo(device, encryptedPayload);
    });
  }
};




針對 Android 與 iOS 跨平台（使用 React Native）的 BLE (Bluetooth Low Energy) 握手協議設計。


由於 iOS 和 Android 在藍牙後台權限處理上有顯著差異，設計協議時必須考慮「連接穩定性」與「數據分包傳輸（Chunking）」。


我們採用 GATT (Generic Attribute Profile) 架構，定義兩種角色：


Survivor (求救者/發送端): 作為 Peripheral (周邊設備/GATT Server)。因為求救者擁有數據（位置、個人資料），等待被讀取或發送。


Relay (中繼者/救援端): 作為 Central (中心設備/GATT Client)。它負責掃描、發起連接、接收數據並轉發上網。


📡 ResQ-Link BLE Communication Protocol
ResQ-Link 藍牙低功耗通訊協議
此協議旨在解決災難現場「無互聯網」環境下，設備間的發現、驗證與大數據包（加密後的個人檔案可能超過 BLE 單次傳輸上限）的傳輸問題。


這是一份針對 Android 與 iOS 跨平台（使用 React Native）的 BLE (Bluetooth Low Energy) 握手協議設計。


由於 iOS 和 Android 在藍牙後台權限處理上有顯著差異，設計協議時必須考慮「連接穩定性」與「數據分包傳輸（Chunking）」。


我們採用 GATT (Generic Attribute Profile) 架構，定義兩種角色：


Survivor (求救者/發送端): 作為 Peripheral (周邊設備/GATT Server)。因為求救者擁有數據（位置、個人資料），等待被讀取或發送。


Relay (中繼者/救援端): 作為 Central (中心設備/GATT Client)。它負責掃描、發起連接、接收數據並轉發上網。


📡 ResQ-Link BLE Communication Protocol
ResQ-Link 藍牙低功耗通訊協議
此協議旨在解決災難現場「無互聯網」環境下，設備間的發現、驗證與大數據包（加密後的個人檔案可能超過 BLE 單次傳輸上限）的傳輸問題。


1. UUID Definitions (UUID 定義)
為了避免與其他藍牙設備衝突，我們需要定義一組專屬的 UUID。建議使用 128-bit UUID。
名稱 (Name),類型 (Type),UUID (Example),權限 (Prop),功能描述 (Description)
ResQ_Service,Service,0000FFE0-0000-1000-8000-00805F9B34FB,-,主服務，用於廣播與發現。
SOS_Data_Char,Characteristic,0000FFE1-0000-1000-8000-00805F9B34FB,Write / Notify,數據傳輸通道。求救者透過 Notify 發送數據，中繼者透過 Write 確認接收。
Status_Char,Characteristic,0000FFE2-0000-1000-8000-00805F9B34FB,Read,"狀態檢查。讀取求救者的當前狀態（如：Waiting for Net, Uploaded）。"


2. Protocol Workflow (協議流程圖)
這個流程確保了從發現到數據傳輸完成的完整閉環。
sequenceDiagram
    participant S as Survivor (Peripheral/Server)
    participant R as Relay (Central/Client)
    
    Note over S: 1. 無網絡，啟動 SOS 模式
    S->>S: 開始廣播 (Advertising) <br/> Service UUID: ResQ_Service
    
    Note over R: 2. 發現附近的求救信號
    R->>R: 掃描 (Scanning) <br/> Filter: ResQ_Service
    R->>S: 建立連接 (Connect)
    
    Note over S, R: 3. 握手階段 (Handshake)
    R->>S: 寫入指令 "HELLO_RELAY" (to SOS_Data_Char)
    S->>S: 停止廣播 (節省電量/避免重複連接)
    S->>R: 回覆 "READY_TO_SEND, Size=2KB" (via Notify)
    
    Note over S, R: 4. 數據傳輸階段 (Chunk Transfer)
    loop 直到數據傳完
        S->>R: 發送數據包 Chunk N (via Notify)
        R->>R: 驗證接收
    end
    
    S->>R: 發送 "EOM" (End of Message)
    
    Note over S, R: 5. 結束與斷開
    R->>S: 回覆 "ACK_RECEIVED"
    R->>R: 斷開連接 (Disconnect)
    R->>Server: 有網絡時，上傳加密數據


3. Detailed Handshake Steps (詳細握手步驟)
Step 1: Advertising & Discovery (廣播與發現)
    - Survivor (App): 使用 react-native-ble-plx 的 startDeviceScan 失敗確認無網後，切換為 manager.startAdvertising (Android) 或 Peripheral Mode (iOS)。
        
        - Payload: 廣播包中僅包含 ResQ_Service UUID，不包含敏感數據（隱私考量）。


    - Relay (App): 在背景運行 scanForPeripherals。一旦發現包含 ResQ_Service 的設備，立即發起連接。


Step 2: Connection Establishment (建立連接)
    - Relay: 連接成功後，必須立即執行 discoverAllServicesAndCharacteristics。


    - MTU Negotiation: Android 預設 MTU 為 23 bytes。Relay 端應發起 requestMTU(512) 以提高傳輸速率。iOS 會自動協商，通常在 180~512 bytes 之間。


Step 3: The "Handshake" (握手確認)
在傳輸大量數據前，雙方確認準備就緒。


    1. Relay 發送: Write "REQ_INFO" 到 SOS_Data_Char。


    2. Survivor 收到後: 準備加密好的 JSON 封包。


    3. Survivor 回覆: 通過 Notify 發送 Header 信息。


        - Header 格式: HEAD|TOTAL_SIZE|CHECKSUM


        - 例如: HEAD|2048|a1b2c3d4


Step 4: Data Chunking (分包傳輸)
由於 BLE 封包大小限制，加密後的個人資料（圖片、文字）可能很大，必須切片。


    - 邏輯:


        - 假設 MTU = 180 bytes，保留 3 bytes 作 header。有效負載 = 177 bytes。


        - Survivor 將加密字串切割。


        - 封包結構: [Index(2 bytes)] [Flag(1 byte)] [Data(N bytes)]


    - Flag 定義: 0x00 = 中間包, 0x01 = 最後一包 (EOF)。


代碼邏輯範例 (Survivor - 發送端):
const CHUNK_SIZE = 150; // 保守設定
const sendData = async (characteristic, encryptedString) => {
  const totalChunks = Math.ceil(encryptedString.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunk = encryptedString.substring(start, end);
    
    // 構建封包: 這裡簡化為 JSON 字符串，實際建議用 Base64 或 Byte Array
    const packet = JSON.stringify({
      i: i, 
      t: totalChunks, 
      d: chunk
    });
    
    // 寫入 Notify
    await characteristic.notify(Base64.encode(packet));
    
    // 重要：稍微延遲避免擁塞 (Congestion)
    await delay(20); 
  }
};


Step 5: Verification & Disconnect (驗證與斷開)
    - Relay: 收到所有包後，將 Data 拼湊還原。


    - Relay: 計算拼湊後數據的 Checksum (Hash)。


    - Relay:


        - 若 Checksum 匹配 Header，發送 Write "ACK_OK".


        - 若不匹配，發送 Write "RESEND".


    - Survivor: 收到 ACK_OK 後，標記狀態為 "Relayed"（已中繼），並停止廣播以節省電量，等待一段時間後再檢查狀態。


4. Cross-Platform Limitations & Solutions (跨平台限制與解決方案)
這是開發中最棘手的部分，必須特別注意：


A. iOS Background Advertising (iOS 後台廣播限制)
    - 問題: iOS App 進入後台後，廣播頻率會降低，且 Service UUID 可能會被隱藏在 "Overflow Area"，導致 Android 設備難以掃描到。


    - 解決方案:


        1. Foreground Service (Android): Relay 端（Android）使用前台服務強力掃描。


        2. Local Notifications: 當 iOS Survivor 處於 SOS 模式並進入後台時，使用本地通知提醒用戶「請保持 App 在前台以增加被救援機率」。


        3. Role Reversal (備用方案): 如果 Survivor 是 iOS 且在後台，可以讓 Relay (如果是 Android) 進行廣播，Survivor 定期甦醒（iOS Background Fetch）進行掃描。但這會延遲救援。建議主推 Survivor 保持在前台。


B. MTU Size Mismatch
 - 問題: iOS 和 Android 協商出的 MTU 不同。


 - 解決方案: 在應用層（App Logic）將 CHUNK_SIZE 設定為較小的保守值（例如 128 bytes），確保在任何協商結果下都不會丟包。


5. Security Payload Structure (安全封包結構)
雖然這是傳輸協議，但必須定義傳輸內容的結構以確保安全。


傳輸的 Payload (AES Encrypted String) 解密後應包含：
{
  "ver": "1.0",
  "uid": "user_123456",
  "ts": 1716960000, (Timestamp)
  "loc": {
    "lat": 22.28552,
    "lng": 114.15769,
    "acc": 10 (Accuracy in meters)
  },
  "med": {
    "bg": "O+", (Blood Type)
    "cond": "Diabetic" (Conditions)
  },
  "sig": "rsa_signature_of_content" (防止數據篡改)
}



📅 Roadmap (開發藍圖)
[ ] Phase 1: MVP - Basic UI, GPS, Hybrid Encryption (AES+RSA), Direct API Upload.
    - [x] SOS / Safe flows with encrypted payloads.
    - [x] Online/offline detection and fallback to BLE path.
    - [x] EN / 繁中 localization with user-toggle + device locale default.
    - [x] UI refresh: panic-proof SOS, mesh route preview, radar feedback, family list scaffold.
[ ] Phase 2: BLE Relay - Implement 1-hop relay (Device A -> Device B -> Server).
    - [x] Payload chunking/reassembly (PacketManager) + Base64 chunks over BLE.
    - [x] Server-side hybrid decrypt (RSA unwrap + AES-256-CBC decrypt).
    - [x] Survivor Peripheral advertising/notify (react-native-peripheral, UUIDs wired).
    - [x] Relay reassembly + upload to server (relay buffer + API upload hook).
[ ] Phase 3: Mesh Network - Implement multi-hop logic (A -> B -> C -> Server).
    - [x] Routing / retry / congestion control strategy (TTL envelope wrap/unwrap, rebroadcast when offline, paced chunk send).
    - [x] Node health/queue management and hop TTL (client dedupe + queue; server envelope unwrap + dedupe hash + hop TTL record).
[ ] Phase 4: Inquiry System - Family connection and push notifications.
    - [x] Family status API + live list (batch latest, history, token registration).
    - [x] Push notifications (stub sender; trigger on SOS/status).
    - [x] Location history / last-known lookup (in-memory history by uid).


Backend setup (PostgreSQL/PostGIS)
- Install PostgreSQL (and PostGIS extension if you need geospatial features).
- Create a database: `createdb resq_link`.
- Run the migration: `psql -d resq_link -f server/migrations/0001_init.sql` from the repo root.
- Set env vars: `DATABASE_URL=postgres://user:pass@localhost:5432/resq_link` and `PGSSL=true` if your DB requires SSL.
- Start the server in `server/`: `npm install && npm run dev` (or `npm run build` then `npm run start`).


New features (English / 繁中)
- Push notifications: FCM server key env `FCM_SERVER_KEY`; mobile uses Firebase messaging to register tokens and sends to `/api/status/register-token`. 伺服器使用 FCM (`FCM_SERVER_KEY`)，手機端啟用 Firebase Messaging 自動註冊推播 Token 並上傳伺服器。
- Inquiry/Family live data: Family screen now fetches `/api/status` and shows latest status/location/time for specified UIDs; no more static mock data. 親友查詢畫面向 `/api/status` 拉取最新狀態與位置，取代靜態假資料。
- PostgreSQL persistence: SOS/Status/Token data stored in Postgres with dedupe and freshness checks; survives restarts. SOS、狀態與 Token 會寫入 Postgres，具重覆/過期阻擋，重啟不丟失。
- Biometric-gated profile storage: Profile AES key is stored in Keychain with biometrics/device passcode required to load. 個人資料密鑰受生物辨識/裝置密碼保護，讀取需解鎖。
- BLE background hardening: SOS advertising periodically re-issues keep-alive to reduce OS stopping background adverts. BLE 廣播加入 keep-alive，減少背景被系統停用。


Push setup (FCM)
- Backend: set `FCM_SERVER_KEY` (legacy server key) to enable push dispatch.
- Mobile: configure Firebase in the native projects and add `google-services.json` (Android) / `GoogleService-Info.plist` (iOS). The app will request permissions and register the push token for the current `uid` automatically on launch.



🤝 Contribution (貢獻)歡迎提交 Pull Request 或 Issue。請確保遵循 Code of Conduct。Pull requests are welcome. Please ensure you follow the Code of Conduct.
