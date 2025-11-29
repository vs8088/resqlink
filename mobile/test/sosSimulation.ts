import { Buffer } from 'buffer';
import { MeshRouter } from '../src/services/MeshRouter';
import { DisasterStatus, EncryptedPayload, UserProfile } from '../src/types';
import { Packet, PacketManager } from '../src/utils/PacketManager';

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type SosContext = {
  profile: UserProfile;
  location: Coordinates;
  status: DisasterStatus;
  note?: string;
};

type ServerRecord = {
  via: 'internet' | 'mesh';
  hops: string[];
  decrypted: Record<string, unknown>;
};

type SimulationResult = {
  flow: 'online' | 'mesh';
  chunkCount: number;
  serverRecords: ServerRecord[];
  path: string[];
};

class FakeServer {
  records: ServerRecord[] = [];

  receive(payload: EncryptedPayload, via: ServerRecord['via'], hops: string[]) {
    const decrypted = decodePayload(payload);
    this.records.push({ via, hops, decrypted });
  }
}

class MockAPIService {
  constructor(private server: FakeServer, private online: boolean) {}

  async hasInternet() {
    return this.online;
  }

  async sendSOS(payload: EncryptedPayload) {
    if (!this.online) {
      throw new Error('Device offline');
    }
    this.server.receive(payload, 'internet', []);
  }

  setOnline(next: boolean) {
    this.online = next;
  }

  getRecords() {
    return this.server.records;
  }
}

type MockDevice = { id: string; name?: string };

class MockGateway {
  constructor(private server: FakeServer, private online: boolean) {}

  async forward(wrappedPayload: EncryptedPayload) {
    const { payload, ttl, hops } = MeshRouter.unwrap(wrappedPayload);
    if (this.online) {
      this.server.receive(payload, 'mesh', [...hops, 'gateway']);
      return;
    }

    if (ttl > 0) {
      const rebroadcast = MeshRouter.wrap(payload, ttl - 1, [...hops, 'gateway-offline']);
      throw new Error(`Gateway offline, would rebroadcast: ${rebroadcast}`);
    }

    throw new Error('Gateway offline, TTL expired');
  }
}

class MockBLEService {
  private preparedChunks: string[] = [];

  constructor(private gateway: MockGateway) {}

  async broadcastSOS(payload: EncryptedPayload) {
    this.preparedChunks = PacketManager.chunkData(payload);
    console.log(`🔹 Broadcasting ${this.preparedChunks.length} BLE chunks`);
  }

  async notifyPreparedChunks() {
    if (!this.preparedChunks.length) return;
    console.log('🔹 Notifying subscribers with prepared chunks');
  }

  async scanForGateway(onGateway: (device: MockDevice) => Promise<void>) {
    const device: MockDevice = { id: 'relay-gw', name: 'Relay Gateway' };
    await onGateway(device);
  }

  async transferDataTo(device: MockDevice, payload: EncryptedPayload) {
    console.log(`🔹 Transferring chunks to ${device.name || device.id}`);
    const packets: Packet[] = this.preparedChunks.map(chunk => JSON.parse(chunk) as Packet);
    const reassembled = PacketManager.reassembleData(packets);
    if (!reassembled) {
      throw new Error('Failed to reassemble payload from chunks');
    }

    await this.gateway.forward(reassembled);
  }

  getChunkCount() {
    return this.preparedChunks.length;
  }
}

const encodePayload = (context: SosContext): EncryptedPayload => {
  const serialized = JSON.stringify({
    ver: '1.0',
    uid: context.profile.id,
    ts: Date.now(),
    loc: { lat: context.location.latitude, lng: context.location.longitude, acc: context.location.accuracy ?? null },
    med: context.profile.medicalInfo,
    status: context.status,
    note: context.note
  });
  return Buffer.from(serialized, 'utf8').toString('base64');
};

const decodePayload = (payload: EncryptedPayload): Record<string, unknown> => {
  const raw = Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(raw) as Record<string, unknown>;
};

const runHandleSOS = async (
  ctx: SosContext,
  services: { api: MockAPIService; ble: MockBLEService },
  meshTTL = 2
): Promise<SimulationResult> => {
  const payload = encodePayload(ctx);
  const isOnline = await services.api.hasInternet();

  if (isOnline) {
    await services.api.sendSOS(payload);
    return { flow: 'online', chunkCount: 0, serverRecords: services.api.getRecords(), path: ['device', 'cloud'] };
  }

  const wrapped = MeshRouter.wrap(payload, meshTTL, ['device']);
  await services.ble.broadcastSOS(wrapped);
  await services.ble.notifyPreparedChunks();
  await services.ble.scanForGateway(async device => {
    await services.ble.transferDataTo(device, wrapped);
  });

  return {
    flow: 'mesh',
    chunkCount: services.ble.getChunkCount(),
    serverRecords: services.api.getRecords(),
    path: ['device', 'relay-gw', 'cloud']
  };
};

const prettyPrint = (label: string, result: SimulationResult) => {
  console.log(`\n=== ${label} ===`);
  console.log(`Flow: ${result.flow}`);
  console.log(`Chunks sent: ${result.chunkCount}`);
  console.log(`Path: ${result.path.join(' -> ')}`);
  result.serverRecords.forEach((record, idx) => {
    console.log(`Record #${idx + 1}: via ${record.via}, hops=${record.hops.join(' | ')}`);
    console.log(`  Decrypted payload: ${JSON.stringify(record.decrypted)}`);
  });
};

const buildContext = (status: DisasterStatus, note?: string): SosContext => ({
  profile: { id: 'user-001', name: 'Test User', medicalInfo: { bloodType: 'A+', conditions: ['asthma'] } },
  location: { latitude: 25.033, longitude: 121.5654, accuracy: 5 },
  status,
  note
});

const main = async () => {
  const server = new FakeServer();
  const apiOnline = new MockAPIService(server, true);
  const bleOnline = new MockBLEService(new MockGateway(server, true));
  const onlineResult = await runHandleSOS(buildContext('CRITICAL'), { api: apiOnline, ble: bleOnline });
  prettyPrint('Internet path', onlineResult);

  const meshServer = new FakeServer();
  const apiOffline = new MockAPIService(meshServer, false);
  const bleWithGateway = new MockBLEService(new MockGateway(meshServer, true));
  const meshResult = await runHandleSOS(buildContext('CRITICAL', 'No signal, using mesh'), { api: apiOffline, ble: bleWithGateway });
  prettyPrint('Mesh relay path', meshResult);
};

main().catch(error => {
  console.error('Simulation failed', error);
  process.exitCode = 1;
});
