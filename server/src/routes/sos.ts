import { Router } from 'express';
import { CryptoService } from '../services/crypto';
import { DatabaseService } from '../services/db';
import { MeshService } from '../services/mesh';
import { NotificationService } from '../services/notifications';
import { validatePayload } from '../utils/payloadValidation';
import { serializePayloadForSignature } from '../utils/payloadSerialization';

export const sosRouter = Router();

sosRouter.post('/sos', async (req, res) => {
  const { payload } = req.body as { payload?: string };

  if (!payload) {
    return res.status(400).json({ error: 'Missing payload' });
  }

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
    NotificationService.sendPush(tokens, 'SOS', `Status: ${validated.status}`, {
      uid: validated.uid,
      status: validated.status
    });
    return res.json({ ok: true, hops, ttlRemaining: ttl });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});
