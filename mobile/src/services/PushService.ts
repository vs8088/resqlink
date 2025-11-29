import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { APIService } from './APIService';
import { log } from '../utils/logger';

export class PushService {
  private static refreshUnsubscribe?: () => void;

  static async register(uid: string) {
    const hasPermission = await PushService.ensurePermission();
    if (!hasPermission) {
      return null;
    }

    const token = await messaging().getToken();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await APIService.registerPushToken(uid, token, platform);
    PushService.bindTokenRefresh(uid, platform);
    return token;
  }

  private static bindTokenRefresh(uid: string, platform: 'ios' | 'android') {
    PushService.refreshUnsubscribe?.();
    PushService.refreshUnsubscribe = messaging().onTokenRefresh(async refreshedToken => {
      try {
        await APIService.registerPushToken(uid, refreshedToken, platform);
      } catch (error) {
        log('push_token_refresh_error', error);
      }
    });
  }

  private static async ensurePermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  }
}
