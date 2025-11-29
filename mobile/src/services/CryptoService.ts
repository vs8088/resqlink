import CryptoJS from 'crypto-js';
import { RSA } from 'react-native-rsa-native';
import { SERVER_PUBLIC_KEY } from '../config';
import { Coordinates, DisasterStatus, EncryptedPayload, UserProfile } from '../types';

type BuildPayloadParams = {
  userProfile: UserProfile;
  location: Coordinates;
  status: DisasterStatus;
  note?: string;
};

export class CryptoService {
  static async buildEncryptedPayload(params: BuildPayloadParams): Promise<EncryptedPayload> {
    if (!SERVER_PUBLIC_KEY || SERVER_PUBLIC_KEY.includes('REPLACE_ME')) {
      throw new Error('Server public key is not configured');
    }

    const payload = {
      ver: '1.0',
      uid: params.userProfile.id,
      ts: Date.now(),
      loc: {
        lat: params.location.latitude,
        lng: params.location.longitude,
        acc: params.location.accuracy ?? null
      },
      med: params.userProfile.medicalInfo,
      status: params.status,
      note: params.note
    };

    const serialized = JSON.stringify(payload);

    // Generate AES-256 key and IV
    const aesKey = CryptoJS.lib.WordArray.random(32);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt payload with AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(serialized, aesKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const cipherBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const aesKeyBase64 = CryptoJS.enc.Base64.stringify(aesKey);

    // Wrap AES key with RSA
    const normalizedPublicKey = SERVER_PUBLIC_KEY.replace(/\\n/g, '\n');
    const encryptedAESKey = await RSA.encrypt(aesKeyBase64, normalizedPublicKey);

    const finalPackage = {
      k: encryptedAESKey,
      iv: ivBase64,
      d: cipherBase64
    };

    return JSON.stringify(finalPackage);
  }
}
