import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

export async function registerAndSavePushToken(settings) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer', {
        name: 'Prayer Times',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    if (!tokenData) return;

    await supabase.from('device_tokens').upsert({
      token: tokenData,
      masjid_id: settings.defaultMasjidId ?? null,
      adhan_enabled: settings.adhan?.enabled ?? false,
      adhan_minutes_before: settings.adhan?.minutesBefore ?? 0,
      iqama_enabled: settings.iqama?.enabled ?? false,
      iqama_minutes_before: settings.iqama?.minutesBefore ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' });

    await supabase.functions.invoke('populate-queue', {
      body: { token: tokenData },
    });
  } catch (e) {
    console.warn('[registerAndSavePushToken]', e);
  }
}
