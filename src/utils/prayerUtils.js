// Handles "05:42", "05:42:00" (24-hr) and "5:42 AM" / "5:42 PM" (12-hr already)
export function formatTime(raw) {
  if (!raw) return '--:--';
  if (/AM|PM/i.test(raw)) return raw.trim();
  const [h, m] = raw.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Returns minutes since midnight — handles both 24-hr and "H:MM AM/PM"
function toMinutes(raw) {
  if (!raw) return Infinity;
  if (/AM|PM/i.test(raw)) {
    const isPM = /PM/i.test(raw);
    const [h, m] = raw.replace(/\s*(AM|PM)/i, '').split(':').map(Number);
    const hours = (h % 12) + (isPM ? 12 : 0);
    return hours * 60 + m;
  }
  const [h, m] = raw.split(':').map(Number);
  return h * 60 + m;
}

const PRAYER_KEYS = [
  { name: 'Fajr',    adhan: 'fajr_adhan',    iqama: 'fajr_iqama',    iqama2: 'fajr_iqama_2',    iqama3: 'fajr_iqama_3'    },
  { name: 'Dhuhr',   adhan: 'dhuhr_adhan',   iqama: 'dhuhr_iqama',   iqama2: null,               iqama3: null               },
  { name: 'Asr',     adhan: 'asr_adhan',     iqama: 'asr_iqama',     iqama2: null,               iqama3: null               },
  { name: 'Maghrib', adhan: 'maghrib_adhan', iqama: 'maghrib_iqama', iqama2: 'maghrib_iqama_2', iqama3: 'maghrib_iqama_3' },
  { name: 'Isha',    adhan: 'isha_adhan',    iqama: 'isha_iqama',    iqama2: null,               iqama3: null               },
];

export function buildPrayerRows(row, nowMins) {
  if (!row) return { rows: [], activeIndex: -1, nextIndex: -1, countdownMins: null };

  if (nowMins === undefined) {
    const n = new Date();
    nowMins = n.getHours() * 60 + n.getMinutes();
  }

  const rows = PRAYER_KEYS.map((p) => ({
    name: p.name,
    adhan: formatTime(row[p.adhan]),
    iqama: formatTime(row[p.iqama]),
    iqama2: p.iqama2 && row[p.iqama2] ? formatTime(row[p.iqama2]) : null,
    iqama3: p.iqama3 && row[p.iqama3] ? formatTime(row[p.iqama3]) : null,
    adhanMins: toMinutes(row[p.adhan]),
  }));

  // Active = last prayer whose adhan has passed
  let activeIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].adhanMins <= nowMins) activeIndex = i;
  }

  // Next = first prayer whose adhan hasn't passed yet
  const nextIndex = rows.findIndex((r) => r.adhanMins > nowMins);

  let countdownMins = null;
  if (nextIndex !== -1) {
    countdownMins = rows[nextIndex].adhanMins - nowMins;
  }

  return { rows, activeIndex, nextIndex, countdownMins };
}

export function formatCountdown(mins) {
  if (mins === null) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// "Thursday, Apr 27, 2026"
export function formatGregorian(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Offset a Date by N days
export function offsetDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// "YYYY-MM-DD" for Supabase queries
export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}
