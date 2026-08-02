import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerAndSavePushToken } from '../utils/pushToken';

const KEY = '@noor/settings';

export const DEFAULT_SETTINGS = {
  defaultMasjidId: null,
  adhan:  { enabled: false, minutesBefore: 0 },
  iqama:  { enabled: false, minutesBefore: 0 },
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          setSettings((prev) => ({
            ...prev,
            ...saved,
            adhan: { ...prev.adhan, ...(saved.adhan ?? {}) },
            iqama: { ...prev.iqama, ...(saved.iqama ?? {}) },
          }));
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (updated) => {
    setSettings(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    registerAndSavePushToken(updated);
  }, []);

  const setNotif = useCallback(
    (type, field, value) => save({ ...settings, [type]: { ...settings[type], [field]: value } }),
    [settings, save]
  );

  const setDefaultMasjid = useCallback(
    (id) => save({ ...settings, defaultMasjidId: id }),
    [settings, save]
  );

  return { settings, loading, setNotif, setDefaultMasjid };
}
