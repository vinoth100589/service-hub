import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { api } from './api';

// Registers this device for push notifications and saves the resulting
// Expo push token to the backend, so it's available whenever the app adds
// server-triggered push sending (via Expo's push API) on top of this.
//
// Web has no push token support in Expo, and the simulator/emulator can't
// receive real pushes either — both are expected no-ops here, not errors.
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return; // user declined — nothing more to do

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await api.savePushToken(tokenResponse.data);
  } catch (error) {
    // Non-critical — e.g. no physical device, no EAS project configured yet,
    // or offline. The rest of the app works fine without a push token.
    console.warn('[push] registration skipped:', error);
  }
}
