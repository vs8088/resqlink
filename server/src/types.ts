export type DisasterStatus = 'CRITICAL' | 'SAFE' | 'RESCUED' | 'HOSPITAL' | 'UNKNOWN';

export type Location = {
  lat: number;
  lng: number;
  acc?: number | null;
};

export type SOSPayload = {
  ver: string;
  uid: string;
  ts: number;
  loc: Location;
  med: {
    bloodType: string;
    conditions: string[];
  };
  status: DisasterStatus;
  note?: string;
  sig: string;
};
