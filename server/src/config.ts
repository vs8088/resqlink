import fs from 'fs';
import path from 'path';

const loadKey = (inlineValue: string | undefined, filePath: string | undefined, label: string): string => {
  if (filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`${label} file not found at ${resolved}`);
    }
    return fs.readFileSync(resolved, 'utf8');
  }

  if (inlineValue) {
    return inlineValue.replace(/\\n/g, '\n');
  }

  throw new Error(`${label} is not configured`);
};

export const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
export const SERVER_PUBLIC_KEY = loadKey(process.env.SERVER_PUBLIC_KEY, process.env.SERVER_PUBLIC_KEY_PATH, 'SERVER_PUBLIC_KEY');
export const SERVER_PRIVATE_KEY = loadKey(
  process.env.SERVER_PRIVATE_KEY,
  process.env.SERVER_PRIVATE_KEY_PATH,
  'SERVER_PRIVATE_KEY'
);
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/resq_link';
export const PGSSL = process.env.PGSSL === 'true';
export const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';
export const API_SHARED_SECRET = process.env.API_SHARED_SECRET || process.env.API_TOKEN || 'change-me-dev-token';
export const API_AUTH_REQUIRED = process.env.API_AUTH_REQUIRED === 'true';
