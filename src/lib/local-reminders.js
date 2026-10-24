export const REMINDER_MAX_COUNT = 10;
export const REMINDER_KINDS = Object.freeze(['tilawah', 'doa', 'both']);
export const REMINDER_DAY_OPTIONS = Object.freeze([
  { value: 0, label: 'Minggu', short: 'Min' },
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' }
]);

export const DEFAULT_REMINDER_DRAFT = Object.freeze({
  title: 'Waktu tilawah',
  time: '07:00',
  kind: 'tilawah',
  days: [0, 1, 2, 3, 4, 5, 6],
  enabled: true
});

function normalizeReminder(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const id = typeof item.id === 'string' ? item.id.trim().slice(0, 80) : '';
  const title = typeof item.title === 'string' ? item.title.trim().slice(0, 60) : '';
  const time = typeof item.time === 'string' ? item.time : '';
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!id || !title || !timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) return null;
  if (!REMINDER_KINDS.includes(item.kind)) return null;
  if (item.enabled !== undefined && typeof item.enabled !== 'boolean') return null;
  if (!Array.isArray(item.days) || item.days.length < 1 || item.days.length > 7) return null;
  if (item.days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) return null;
  const days = [...new Set(item.days)].sort((a, b) => a - b);
  if (!days.length) return null;
  return {
    id,
    title,
    time,
    kind: item.kind,
    days,
    enabled: item.enabled !== false,
    createdAt: Number.isFinite(Number(item.createdAt)) ? Math.max(0, Number(item.createdAt)) : 0,
    updatedAt: Number.isFinite(Number(item.updatedAt)) ? Math.max(0, Number(item.updatedAt)) : 0
  };
}

// Tolerant normalization for existing local storage: discard malformed rows rather
// than making all reminder controls inaccessible if one old record is corrupted.
export function normalizeReminderList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.slice(0, REMINDER_MAX_COUNT).flatMap((item) => {
    const normalized = normalizeReminder(item);
    if (!normalized || seen.has(normalized.id)) return [];
    seen.add(normalized.id);
    return [normalized];
  });
}

// Strict normalization for backup imports; malformed entries must not be silently
// accepted as if the entire backup category were valid.
export function validateReminderList(value) {
  if (!Array.isArray(value) || value.length > REMINDER_MAX_COUNT) return null;
  const rows = value.map(normalizeReminder);
  if (rows.some((row) => !row)) return null;
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return null;
  return rows;
}
