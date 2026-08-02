import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PRAYER_FIELDS = [
  { name: 'Fajr',    adhan: 'fajr_adhan',    iqama: 'fajr_iqama'    },
  { name: 'Dhuhr',   adhan: 'dhuhr_adhan',   iqama: 'dhuhr_iqama'   },
  { name: 'Asr',     adhan: 'asr_adhan',     iqama: 'asr_iqama'     },
  { name: 'Maghrib', adhan: 'maghrib_adhan', iqama: 'maghrib_iqama' },
  { name: 'Isha',    adhan: 'isha_adhan',    iqama: 'isha_iqama'    },
];

function toMins(raw: string | null): number | null {
  if (!raw) return null;
  if (/AM|PM/i.test(raw)) {
    const isPM = /PM/i.test(raw);
    const [h, m] = raw.replace(/\s*(AM|PM)/i, '').split(':').map(Number);
    return ((h % 12) + (isPM ? 12 : 0)) * 60 + m;
  }
  const [h, m] = raw.split(':').map(Number);
  return h * 60 + m;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Current time in EST (UTC-5 / UTC-4 DST) — adjust if your masjids are in a different timezone
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();

  const { data: devices } = await supabase
    .from('device_tokens')
    .select('token, masjid_id, adhan_enabled, adhan_minutes_before, iqama_enabled, iqama_minutes_before')
    .not('masjid_id', 'is', null);

  if (!devices?.length) return new Response('no devices', { status: 200 });

  const masjidIds = [...new Set(devices.map((d: any) => d.masjid_id))];

  const { data: prayerTimes } = await supabase
    .from('prayer_times')
    .select('masjid_id, fajr_adhan, fajr_iqama, dhuhr_adhan, dhuhr_iqama, asr_adhan, asr_iqama, maghrib_adhan, maghrib_iqama, isha_adhan, isha_iqama')
    .eq('date', todayStr)
    .in('masjid_id', masjidIds);

  if (!prayerTimes?.length) return new Response('no prayer times', { status: 200 });

  const prayerMap: Record<string, any> = Object.fromEntries(
    prayerTimes.map((pt: any) => [pt.masjid_id, pt])
  );

  const messages: any[] = [];

  for (const device of devices as any[]) {
    const pt = prayerMap[device.masjid_id];
    if (!pt) continue;

    for (const p of PRAYER_FIELDS) {
      if (device.adhan_enabled) {
        const mins = toMins(pt[p.adhan]);
        if (mins !== null && (mins - (device.adhan_minutes_before ?? 0)) === nowMins) {
          messages.push({
            to: device.token,
            title: p.name,
            body: device.adhan_minutes_before === 0 ? 'Adhan is now' : `Adhan in ${device.adhan_minutes_before} minutes`,
            sound: 'default',
          });
        }
      }

      if (device.iqama_enabled) {
        const mins = toMins(pt[p.iqama]);
        if (mins !== null && (mins - (device.iqama_minutes_before ?? 0)) === nowMins) {
          messages.push({
            to: device.token,
            title: p.name,
            body: device.iqama_minutes_before === 0 ? 'Congregation starting now' : `Iqama in ${device.iqama_minutes_before} minutes`,
            sound: 'default',
          });
        }
      }
    }
  }

  if (!messages.length) return new Response('nothing to send', { status: 200 });

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await res.json();
  console.log('[send-prayer-notifications]', JSON.stringify(result));
  return new Response(JSON.stringify(result), { status: 200 });
});
