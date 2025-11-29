import { DisasterStatus, SOSPayload } from '../types';

const STATUS_VALUES: DisasterStatus[] = ['CRITICAL', 'SAFE', 'RESCUED', 'HOSPITAL', 'UNKNOWN'];

const isNumber = (val: unknown): val is number => typeof val === 'number' && Number.isFinite(val);
const isString = (val: unknown): val is string => typeof val === 'string' && val.length > 0;

export const validatePayload = (input: unknown): SOSPayload => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid payload');
  }

  const payload = input as Partial<SOSPayload>;

  if (!isString(payload.ver)) throw new Error('Missing version');
  if (!isString(payload.uid)) throw new Error('Missing uid');
  if (!isNumber(payload.ts)) throw new Error('Missing timestamp');

  if (!payload.loc || typeof payload.loc !== 'object') throw new Error('Missing location');
  const { lat, lng, acc } = payload.loc as Record<string, unknown>;
  if (!isNumber(lat) || !isNumber(lng)) throw new Error('Invalid location');
  let accVal: number | null = null;
  if (acc === null || acc === undefined) {
    accVal = null;
  } else if (isNumber(acc)) {
    accVal = acc;
  } else {
    throw new Error('Invalid accuracy');
  }

  if (!payload.med || typeof payload.med !== 'object') throw new Error('Missing medical info');
  const { bloodType, conditions } = payload.med as Record<string, unknown>;
  if (!isString(bloodType)) throw new Error('Invalid blood type');
  if (!Array.isArray(conditions) || !conditions.every(isString)) throw new Error('Invalid medical conditions');

  if (!isString(payload.status) || !STATUS_VALUES.includes(payload.status)) {
    throw new Error('Invalid status');
  }

  let signature: string | undefined;
  if (payload.sig !== undefined) {
    if (!isString(payload.sig)) throw new Error('Invalid signature');
    signature = payload.sig;
  }

  let note: string | undefined;
  if (payload.note !== undefined) {
    if (!isString(payload.note)) throw new Error('Invalid note');
    if (payload.note.length > 240) throw new Error('Note too long');
    note = payload.note;
  }

  return {
    ver: payload.ver,
    uid: payload.uid,
    ts: payload.ts,
    loc: { lat, lng, acc: accVal },
    med: { bloodType, conditions: conditions as string[] },
    status: payload.status,
    note,
    sig: signature
  };
};
