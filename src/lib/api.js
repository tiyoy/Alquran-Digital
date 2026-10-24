const QURAN_BASE = process.env.NEXT_PUBLIC_QURAN_API || 'https://equran.id/api/v2';
const DOA_BASE = process.env.NEXT_PUBLIC_DOA_API || 'https://equran.id/api/doa';
const SHOLAT_BASE = process.env.NEXT_PUBLIC_SHOLAT_API || 'https://api.myquran.com/v3/sholat';

export function unwrapPayload(json) {
  if (json == null) return json;
  if (Array.isArray(json)) return json;
  if (json.data != null) return json.data;
  if (json.result != null) return json.result;
  return json;
}

export async function fetchQuran(path, options = {}) {
  const response = await fetch(`${QURAN_BASE}${path}`, { signal: options.signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Sumber Al-Qur'an merespons ${response.status}`);
  return unwrapPayload(await response.json());
}

export async function fetchDuas() {
  const response = await fetch(DOA_BASE, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Sumber doa merespons ${response.status}`);
  return unwrapPayload(await response.json());
}

export async function fetchPrayerCity(keyword) {
  const response = await fetch(`${SHOLAT_BASE}/kabkota/cari/${encodeURIComponent(keyword)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Pencarian kota merespons ${response.status}`);
  return unwrapPayload(await response.json());
}


export async function fetchAllPrayerCities() {
  const response = await fetch(`${SHOLAT_BASE}/kabkota/all`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Daftar kota merespons ${response.status}`);
  return unwrapPayload(await response.json());
}

export async function fetchPrayerSchedule(cityId, date = 'today', timezone = 'Asia/Jakarta') {
  const response = await fetch(`${SHOLAT_BASE}/jadwal/${encodeURIComponent(cityId)}/${date}?tz=${encodeURIComponent(timezone)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Jadwal shalat merespons ${response.status}`);
  return unwrapPayload(await response.json());
}

export function cleanArabicText(value) {
  return String(value || '')
    .replace(/\uFFFD/g, '')
    .replace(/[\u200B-\u200F\uFEFF\u2060]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

export function normalizeSurah(raw, index = 0) {
  const s = raw || {};
  return {
    nomor: Number(s.nomor ?? s.nomorSurat ?? s.id ?? index + 1),
    nama: cleanArabicText(s.nama ?? s.namaArab ?? s.nameArabic ?? ''),
    namaLatin: s.namaLatin ?? s.nama_latin ?? s.name ?? `Surah ${index + 1}`,
    arti: s.arti ?? s.artiNama ?? s.translation ?? '',
    jumlahAyat: Number(s.jumlahAyat ?? s.jumlah_ayat ?? s.ayat ?? 0),
    tempatTurun: s.tempatTurun ?? s.tempat_turun ?? s.revelation ?? '',
    deskripsi: s.deskripsi ?? s.deskripsiSurat ?? '',
    audioFull: s.audioFull ?? s.audio_full ?? s.audio ?? null
  };
}

export function normalizeVerse(raw, index = 0) {
  const v = raw || {};
  return {
    nomorAyat: Number(v.nomorAyat ?? v.nomor_ayat ?? v.ayat ?? v.number ?? index + 1),
    teksArab: cleanArabicText(v.teksArab ?? v.teks_arab ?? v.arab ?? v.arabic ?? v.text_uthmani ?? v.uthmani ?? ''),
    teksLatin: v.teksLatin ?? v.teks_latin ?? v.latin ?? v.transliterasi ?? v.transliteration ?? '',
    teksIndonesia: v.teksIndonesia ?? v.teks_indonesia ?? v.indonesia ?? v.terjemahan ?? v.translation ?? '',
    audio: v.audio ?? v.audioUrl ?? v.audio_url ?? null,
    tafsir: v.tafsir ?? v.tafsirKemenag ?? v.tafsir_kemenag ?? ''
  };
}

export function firstArray(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

// The visible selector keeps Misyari as its first/default choice, while EQuran's
// audio IDs are 01=Juhany, 02=Qasim, 03=Sudais, 04=Dossari, 05=Misyari, 06=Yasser.
// Keep this mapping aligned with the QARIS options in NuraniApp.jsx.
const RECITER_IDS_BY_UI_INDEX = ['05', '03', '01', '02', '04', '06'];

function extractAudioUrl(value) {
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object'
      ? (value.url || value.audio || value.src || '')
      : '';
  return /^https?:\/\//i.test(String(candidate)) ? String(candidate) : '';
}

export function chooseAudio(audio, reciterIndex = 0) {
  if (!audio) return '';
  if (typeof audio === 'string') return extractAudioUrl(audio);

  const safeIndex = Number.isInteger(Number(reciterIndex)) && Number(reciterIndex) >= 0
    ? Number(reciterIndex)
    : 0;
  const reciterId = RECITER_IDS_BY_UI_INDEX[safeIndex] || String(safeIndex + 1).padStart(2, '0');

  if (Array.isArray(audio)) {
    // Most API responses follow the documented ID order (01 through 06).
    // Only fall back to the UI position when the ID-indexed item is absent.
    const row = audio[Number(reciterId) - 1] ?? audio[safeIndex];
    const selectedUrl = extractAudioUrl(row);
    if (selectedUrl) return selectedUrl;
    const availableUrls = [...new Set(audio.map(extractAudioUrl).filter(Boolean))];
    return availableUrls.length === 1 ? availableUrls[0] : '';
  }

  if (typeof audio !== 'object') return '';
  const numericId = String(Number(reciterId));
  const preferredKeys = [
    reciterId, numericId, `qari${reciterId}`, `qari${numericId}`,
    `audio${reciterId}`, `audio${numericId}`
  ];
  for (const key of preferredKeys) {
    const selectedUrl = extractAudioUrl(audio[key]);
    if (selectedUrl) return selectedUrl;
  }

  // Do not silently play a different reciter when a multi-qari payload uses an
  // unexpected shape. A single-source legacy response is safe to use for all choices.
  const availableUrls = [...new Set(Object.values(audio).map(extractAudioUrl).filter(Boolean))];
  return availableUrls.length === 1 ? availableUrls[0] : '';
}
