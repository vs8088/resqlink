import fetch from 'node-fetch';
import { FCM_SERVER_KEY } from '../config';
import { DatabaseService } from './db';
import { log } from '../utils/log';

type PushPayload = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

export class NotificationService {
  /**
   * Send push via FCM legacy API. APNS can be added similarly by platform filtering contact_tokens.
   */
  static async sendPush(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return;
    if (!FCM_SERVER_KEY) {
      log('notify_skip', 'FCM_SERVER_KEY not set; skipping push');
      return;
    }

    const payload: PushPayload = { tokens, title, body, data };
    await sendFcm(payload);
  }
}

const sendFcm = async ({ tokens, title, body, data }: PushPayload) => {
  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: { title, body },
        data: data ?? {}
      })
    });

    if (!res.ok) {
      const text = await res.text();
      log('notify_error', { status: res.status, body: text });
      return;
    }

    const json = await res.json();
    const invalidTokens: string[] = [];
    if (Array.isArray(json.results)) {
      json.results.forEach((result: { error?: string }, idx: number) => {
        if (['NotRegistered', 'InvalidRegistration', 'MismatchSenderId'].includes(result.error ?? '')) {
          invalidTokens.push(tokens[idx]);
        }
      });
    }

    if (invalidTokens.length) {
      await DatabaseService.removeContactTokens(invalidTokens);
      log('notify_prune_tokens', { removed: invalidTokens.length });
    }

    log('notify_sent', { success: json.success, failure: json.failure });
  } catch (error) {
    log('notify_error', error);
  }
};
