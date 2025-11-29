import { Router } from 'express';
import { DatabaseService } from '../services/db';
import { CryptoService } from '../services/crypto';
import { NotificationService } from '../services/notifications';
import { MeshService } from '../services/mesh';
import { validatePayload } from '../utils/payloadValidation';
import { serializePayloadForSignature } from '../utils/payloadSerialization';

export const statusRouter = Router();

statusRouter.get('/status/:uid', async (req, res) => {
  const { uid } = req.params;
  const record = await DatabaseService.getLatestForUser(uid);

  if (!record) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(record);
});

statusRouter.get('/status', async (req, res) => {
  const { uids } = req.query as { uids?: string };
  if (!uids) return res.status(400).json({ error: 'uids query required' });
  const list = uids.split(',').map(s => s.trim()).filter(Boolean);
  const results = await DatabaseService.batchLatest(list);
  return res.json(results);
});

statusRouter.get('/history/:uid', async (req, res) => {
  const { uid } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const records = await DatabaseService.getHistory(uid, limit);
  return res.json(records);
});

statusRouter.post('/status', async (req, res) => {
  const { payload } = req.body as { payload?: string };
  if (!payload) return res.status(400).json({ error: 'Missing payload' });

  try {
    const { payload: encryptedPayload, ttl, hops, hash } = MeshService.unwrapPayloadEnvelope(payload);
    if (MeshService.isDuplicate(hash)) {
      return res.json({ ok: true, duplicate: true });
    }
    const decrypted = CryptoService.decryptPayload(encryptedPayload);
    const validated = validatePayload(decrypted);
    if (validated.sig) {
      const canonical = serializePayloadForSignature(validated);
      if (!CryptoService.verifySignature(canonical, validated.sig)) {
        throw new Error('Invalid signature');
      }
    }
    const result = await DatabaseService.saveSOS(validated, { hops, ttlRemaining: ttl, hash });
    if (result.duplicate) return res.json({ ok: true, duplicate: true, reason: 'same_payload' });
    if (result.stale) return res.json({ ok: true, stale: true, reason: 'older_timestamp' });

    const tokens = await DatabaseService.getContactTokens(validated.uid);
    NotificationService.sendPush(tokens, 'Status Update', `Status: ${validated.status}`, {
      uid: validated.uid,
      status: validated.status
    });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

statusRouter.post('/status/register-token', async (req, res) => {
  const { uid, token, platform } = req.body as { uid?: string; token?: string; platform?: string };
  if (!uid || !token) return res.status(400).json({ error: 'uid and token required' });
  await DatabaseService.registerContactToken(uid, token, platform);
  return res.json({ ok: true });
});
