import crypto from 'crypto';
import { query } from '../db/pool';
import { SOSPayload } from '../types';
import { canonicalPayload } from '../utils/payloadSerialization';

export type RelayMeta = { hops: string[]; ttlRemaining: number; hash: string };

export type SOSRecord = Omit<SOSPayload, 'sig'> & {
  sig?: string;
  id: number;
  receivedAt: number;
  relay?: RelayMeta;
};

type SosRow = {
  id: number;
  uid: string;
  ver: string;
  ts_ms: string;
  lat: string;
  lng: string;
  acc: string | null;
  status: string;
  med: { bloodType: string; conditions: string[] };
  note: string | null;
  payload_hash: string;
  relay_meta: RelayMeta | null;
  inserted_at: string;
};

const hashPayload = (payload: SOSPayload): string => {
  const normalized = JSON.stringify(canonicalPayload(payload));
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const mapRow = (row: SosRow): SOSRecord => ({
  id: row.id,
  ver: row.ver,
  uid: row.uid,
  ts: Number(row.ts_ms),
  loc: {
    lat: Number(row.lat),
    lng: Number(row.lng),
    acc: row.acc === null ? null : Number(row.acc)
  },
  med: row.med,
  status: row.status as SOSPayload['status'],
  note: row.note ?? undefined,
  sig: undefined,
  receivedAt: new Date(row.inserted_at).getTime(),
  relay: row.relay_meta || undefined
});

export class DatabaseService {
  static async saveSOS(
    payload: SOSPayload,
    relayMeta?: RelayMeta
  ): Promise<{ stored: boolean; duplicate?: boolean; stale?: boolean; record?: SOSRecord }> {
    const digest = hashPayload(payload);

    const latest = await query<SosRow>(
      `SELECT id, uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta, inserted_at
       FROM sos_events
       WHERE uid = $1
       ORDER BY ts_ms DESC
       LIMIT 1`,
      [payload.uid]
    );

    if (latest.length) {
      const latestRow = latest[0];
      if (payload.ts < Number(latestRow.ts_ms)) {
        return { stored: false, stale: true, record: mapRow(latestRow) };
      }
      if (payload.ts === Number(latestRow.ts_ms) && latestRow.payload_hash === digest) {
        return { stored: false, duplicate: true, record: mapRow(latestRow) };
      }
    }

    const inserted = await query<SosRow>(
      `INSERT INTO sos_events (uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta, inserted_at`,
      [
        payload.uid,
        payload.ver,
        payload.ts,
        payload.loc.lat,
        payload.loc.lng,
        payload.loc.acc ?? null,
        payload.status,
        payload.med,
        payload.note ?? null,
        digest,
        relayMeta ?? null
      ]
    );

    return { stored: true, record: mapRow(inserted[0]) };
  }

  static async getLatestForUser(uid: string) {
    const rows = await query<SosRow>(
      `SELECT id, uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta, inserted_at
       FROM sos_events
       WHERE uid = $1
       ORDER BY ts_ms DESC
       LIMIT 1`,
      [uid]
    );
    if (!rows.length) return null;
    return mapRow(rows[0]);
  }

  static async getHistory(uid: string, limit = 20) {
    const rows = await query<SosRow>(
      `SELECT id, uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta, inserted_at
       FROM sos_events
       WHERE uid = $1
       ORDER BY ts_ms DESC
       LIMIT $2`,
      [uid, limit]
    );
    return rows.map(mapRow);
  }

  static async batchLatest(uids: string[]) {
    if (!uids.length) return [];
    const rows = await query<SosRow>(
      `SELECT DISTINCT ON (uid) id, uid, ver, ts_ms, lat, lng, acc, status, med, note, payload_hash, relay_meta, inserted_at
       FROM sos_events
       WHERE uid = ANY($1)
       ORDER BY uid, ts_ms DESC`,
      [uids]
    );
    // Ensure output order matches input list for predictable responses.
    const byUid = new Map(rows.map(row => [row.uid, mapRow(row)]));
    return uids.map(uid => byUid.get(uid) ?? null);
  }

  static async registerContactToken(uid: string, token: string, platform?: string) {
    await query(
      `INSERT INTO contact_tokens (uid, token, platform, last_seen_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (token) DO UPDATE SET uid = EXCLUDED.uid, platform = EXCLUDED.platform, last_seen_at = NOW()`,
      [uid, token, platform ?? null]
    );
  }

  static async getContactTokens(uid: string): Promise<string[]> {
    const rows = await query<{ token: string }>(`SELECT token FROM contact_tokens WHERE uid = $1`, [uid]);
    return rows.map(r => r.token);
  }

  // Family links
  static async inviteFamily(ownerUid: string, contactUid: string, alias?: string, role?: string) {
    const token = crypto.randomBytes(12).toString('hex');
    await query(
      `INSERT INTO family_links (owner_uid, contact_uid, alias, role, invite_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_uid, contact_uid) DO UPDATE
       SET alias = EXCLUDED.alias, role = EXCLUDED.role, invite_token = EXCLUDED.invite_token, verified_at = family_links.verified_at`,
      [ownerUid, contactUid, alias ?? null, role ?? 'family', token]
    );
    return token;
  }

  static async acceptFamily(token: string, contactUid: string) {
    const rows = await query<{ owner_uid: string; contact_uid: string }>(
      `UPDATE family_links
       SET verified_at = NOW(), contact_uid = $2
       WHERE invite_token = $1
       RETURNING owner_uid, contact_uid`,
      [token, contactUid]
    );
    return rows[0] || null;
  }

  static async listFamily(ownerUid: string) {
    return query<{ owner_uid: string; contact_uid: string; alias: string | null; role: string; verified_at: string | null }>(
      `SELECT owner_uid, contact_uid, alias, role, verified_at
       FROM family_links
       WHERE owner_uid = $1`,
      [ownerUid]
    );
  }

  static async deleteFamily(ownerUid: string, contactUid: string) {
    await query(`DELETE FROM family_links WHERE owner_uid = $1 AND contact_uid = $2`, [ownerUid, contactUid]);
  }
}
