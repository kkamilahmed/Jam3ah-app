import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const PRAYER_KEYS = [
  { name: 'Fajr',    adhan: 'fajr_adhan',    iqama: 'fajr_iqama'    },
  { name: 'Dhuhr',   adhan: 'dhuhr_adhan',   iqama: 'dhuhr_iqama'   },
  { name: 'Asr',     adhan: 'asr_adhan',     iqama: 'asr_iqama'     },
  { name: 'Maghrib', adhan: 'maghrib_adhan', iqama: 'maghrib_iqama' },
  { name: 'Isha',    adhan: 'isha_adhan',    iqama: 'isha_iqama'    },
];

function toMins(raw) {
  if (!raw) return null;
  if (/AM|PM/i.test(raw)) {
    const isPM = /PM/i.test(raw);
    const [h, m] = raw.replace(/\s*(AM|PM)/i, '').split(':').map(Number);
    return ((h % 12) + (isPM ? 12 : 0)) * 60 + m;
  }
  const [h, m] = raw.split(':').map(Number);
  return h * 60 + m;
}

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export function useScheduleNotifications(prayerRow, settings, isToday) {
  useEffect(() => {
    if (!prayerRow || !isToday) return;

    const { adhan: adhanPref, iqama: iqamaPref } = settings;
    const neitherEnabled = !adhanPref?.enabled && !iqamaPref?.enabled;

    if (neitherEnabled) {
      Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const run = async () => {
      await ensureAndroidChannel();
      await Notifications.cancelAllScheduledNotificationsAsync();

      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const now = Date.now();

      for (const p of PRAYER_KEYS) {
        if (adhanPref?.enabled) {
          const mins = toMins(prayerRow[p.adhan]);
          if (mins !== null) {
            const triggerDate = new Date(midnight.getTime() + (mins - (adhanPref.minutesBefore ?? 0)) * 60_000);
            if (triggerDate.getTime() > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: p.name,
                  body: adhanPref.minutesBefore === 0 ? 'Adhan is now' : `Adhan in ${adhanPref.minutesBefore} minutes`,
                  sound: 'default',
                  ...(Platform.OS === 'android' && { channelId: 'prayer' }),
                },
                trigger: { date: triggerDate },
              });
            }
          }
        }

        if (iqamaPref?.enabled) {
          const mins = toMins(prayerRow[p.iqama]);
          if (mins !== null) {
            const triggerDate = new Date(midnight.getTime() + (mins - (iqamaPref.minutesBefore ?? 0)) * 60_000);
            if (triggerDate.getTime() > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: p.name,
                  body: iqamaPref.minutesBefore === 0 ? 'Congregation starting now' : `Iqama in ${iqamaPref.minutesBefore} minutes`,
                  sound: 'default',
                  ...(Platform.OS === 'android' && { channelId: 'prayer' }),
                },
                trigger: { date: triggerDate },
              });
            }
          }
        }
      }
    };

    run();
  }, [prayerRow, settings, isToday]);
}
