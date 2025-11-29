# BLE Field Test Playbook

This guide walks through the on-device checks requested for the BLE relay path.
It assumes two physical phones running the ResQ-Link app built from the current branch.

## Devices & Tools
- **Device A – Peripheral (survivor):** Bluetooth on, **cellular/Wi‑Fi off** to force mesh mode.
- **Device B – Central/Gateway (relay):** Bluetooth + Internet on.
- Optional terminal for logs:
  - Android: `adb logcat | grep -i "ble_"`
  - iOS: Xcode console filter `ble_`.

## 1) Peripheral / Central Role Walkthrough
1. Launch the app on **both devices** and grant location + Bluetooth permissions.
2. On **Device A**, long‑press the SOS button for ~3 seconds until the status changes to **Preparing → Broadcasting → Relaying** and the mesh screen shows the hop path.
3. Keep Device B online; it continuously scans via `scanReceiveAndUpload()`. When it discovers Device A:
   - Logs show `ble_scan` followed by `ble_transfer`.
   - The mesh UI on Device A updates to `you → <relay name> → cloud` with status `relayed:<deviceId>`.
4. Confirm Device B connects, discovers the `0000FFE0` service and `0000FFE1` characteristic, uploads to the server, and then automatically **cancels the BLE connection**.

## 2) Chunked Transfer Validation (150-byte packets)
> Default app chunking is **120 bytes** (cross-platform MTU limit). For this test-only scenario, import `PacketManagerExperimental` from `mobile/test/PacketManagerExperimental.ts` in place of the production `PacketManager` so the app emits 150-byte packets.

1. On **Device A**, enter a long SOS note (~450+ characters) so the encrypted payload requires multiple 150-byte chunks.
2. Trigger SOS again (still offline) to start advertising; logs should show `ble_notify` with the chunk count.
3. On **Device B**, watch for:
   - `ble_transfer` with the same chunk count and `ble_relay_upload` after reassembly succeeds.
   - In the failure path, temporarily toggle Bluetooth off on Device B mid-transfer. You should see `ble_relay_chunk_error` or missing `ble_relay_upload`; re-enable Bluetooth and re-trigger the scan to confirm chunks are resent and a clean upload occurs.

## 3) Post-upload Disconnect / Release
1. After a successful upload (`ble_relay_upload` on Device B), verify that:
   - Device B logs `cancelConnection` (connection dropped) and no further notifications arrive.
   - Device A stops showing **Broadcasting/Relaying** after returning to the home screen.
2. If Device A stays in broadcast mode, manually return to the home screen and trigger SOS again to ensure advertising stops and restarts cleanly.
