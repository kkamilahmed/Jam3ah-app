import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toISODate } from '../utils/prayerUtils';

export function useMasjids() {
  const [masjids, setMasjids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('masjids')
      .select('id, masjid_name, city, province')
      .eq('status', 'active')
      .order('masjid_name')
      .then(({ data, error }) => {
        console.log('[masjids]', { data, error });
        if (error) setError(error.message);
        else setMasjids(data ?? []);
        setLoading(false);
      });
  }, []);

  return { masjids, loading, error };
}

export function useMonthlyPrayerTimes(masjidId, year, month) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!masjidId) return;
    setLoading(true);
    setError(null);

    const mm = String(month).padStart(2, '0');
    const firstDay = `${year}-${mm}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

    supabase
      .from('prayer_times')
      .select('date, fajr_adhan, fajr_iqama, dhuhr_adhan, dhuhr_iqama, asr_adhan, asr_iqama, maghrib_adhan, maghrib_iqama, isha_adhan, isha_iqama')
      .eq('masjid_id', masjidId)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setData(data ?? []);
        setLoading(false);
      });
  }, [masjidId, year, month]);

  return { data, loading, error };
}

export function usePrayerTimes(masjidId, date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(() => {
    if (!masjidId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('prayer_times')
      .select('*')
      .eq('masjid_id', masjidId)
      .eq('date', toISODate(date))
      .maybeSingle()
      .then(({ data, error }) => {
        console.log('[prayer_times]', { data, error });
        if (error) setError(error.message);
        else setData(data);
        setLoading(false);
      });
  }, [masjidId, date]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useWeekJummah(masjidId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!masjidId) return;
    const today = new Date().toISOString().slice(0, 10);
    setLoading(true);
    supabase
      .from('prayer_times')
      .select('date, jummah_1, jummah_2, jummah_3')
      .eq('masjid_id', masjidId)
      .not('jummah_1', 'is', null)
      .gte('date', today)
      .order('date')
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) setData(data);
        setLoading(false);
      });
  }, [masjidId]);

  return { data, loading };
}

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('date')
      .then(({ data, error }) => {
        console.log('[events]', { data, error });
        if (error) setError(error.message);
        else setEvents(data ?? []);
        setLoading(false);
      });
  }, []);

  return { events, loading, error };
}
