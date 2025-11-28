import { SOSPayload } from '../types';

export const canonicalPayload = (payload: SOSPayload) => ({
  ver: payload.ver,
  uid: payload.uid,
  ts: payload.ts,
  loc: {
    lat: payload.loc.lat,
    lng: payload.loc.lng,
    acc: payload.loc.acc ?? null
  },
  med: {
    bloodType: payload.med.bloodType,
    conditions: payload.med.conditions
  },
  status: payload.status,
  note: payload.note ?? null
});

export const serializePayloadForSignature = (payload: SOSPayload): string =>
  JSON.stringify(canonicalPayload(payload));
