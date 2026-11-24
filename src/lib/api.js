import { STORAGE_KEYS } from './constants.js';
import { FALLBACK_CITIES, enrichCity } from './regions.js';
import { FALLBACK_DUAS } from './fallbackDuas.js';

const EQURAN_BASE = 'https://equran.id/api/v2';
const EQURAN_DOA_URL = 'https://equran.id/api/doa';
const MYQURAN_BASE = 'https://api.myquran.com/v2/sholat';

const memoryCache = {
  surahList: null,
  surahDetail: new Map(),
  surahTafsir: new Map(),
  cities: null,
  prayerSchedule: new Map(),
  duas: null,
};

function readStorageCache(key, maxAgeMs = 1000 * 60 * 60 * 24 * 7) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;
    if (maxAgeMs && Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStorageCache(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Abaikan jika kuota localStorage penuh
  }
}

export async function fetchSurahList() {
  if (memoryCache.surahList) return memoryCache.surahList;
  const cached = readStorageCache(STORAGE_KEYS.CACHE_SURAH_LIST);
  if (cached && Array.isArray(cached) && cached.length === 114) {
    memoryCache.surahList = cached;
    return cached;
  }

  const res = await fetch(`${EQURAN_BASE}/surat`);
  if (!res.ok) throw new Error('Gagal memuat daftar 114 surah dari EQuran.id');
  const json = await res.json();
  if (!json?.data || !Array.isArray(json.data)) {
    throw new Error('Format data daftar surah tidak valid');
  }
  memoryCache.surahList = json.data;
  writeStorageCache(STORAGE_KEYS.CACHE_SURAH_LIST, json.data);
  return json.data;
}

export async function fetchSurahDetail(nomor) {
  const key = Number(nomor);
  if (memoryCache.surahDetail.has(key)) {
    return memoryCache.surahDetail.get(key);
  }

  const storageKey = `${STORAGE_KEYS.CACHE_SURAH_DETAIL_PREFIX}${key}`;
  try {
    const res = await fetch(`${EQURAN_BASE}/surat/${key}`);
    if (!res.ok) throw new Error(`Gagal memuat Surah ke-${key}`);
    const json = await res.json();
    if (!json?.data) throw new Error('Data surah tidak ditemukan');
    memoryCache.surahDetail.set(key, json.data);
    writeStorageCache(storageKey, json.data);
    return json.data;
  } catch (err) {
    const cached = readStorageCache(storageKey, 0);
    if (cached) {
      memoryCache.surahDetail.set(key, cached);
      return cached;
    }
    throw err;
  }
}

export async function fetchSurahTafsir(nomor) {
  const key = Number(nomor);
  if (memoryCache.surahTafsir.has(key)) {
    return memoryCache.surahTafsir.get(key);
  }

  const res = await fetch(`${EQURAN_BASE}/tafsir/${key}`);
  if (!res.ok) throw new Error(`Gagal memuat Tafsir Kemenag Surah ke-${key}`);
  const json = await res.json();
  if (!json?.data) throw new Error('Data tafsir tidak ditemukan');
  memoryCache.surahTafsir.set(key, json.data);
  return json.data;
}

export async function fetchAllIndonesianCities() {
  if (memoryCache.cities) return memoryCache.cities;
  const cached = readStorageCache(STORAGE_KEYS.CACHE_CITIES);
  if (cached && Array.isArray(cached) && cached.length > 50) {
    memoryCache.cities = cached;
    return cached;
  }

  try {
    const res = await fetch(`${MYQURAN_BASE}/kota/semua`);
    if (!res.ok) throw new Error('Gagal mengambil daftar kota');
    const json = await res.json();
    if (json?.status && Array.isArray(json.data) && json.data.length > 0) {
      const enriched = json.data.map(enrichCity);
      memoryCache.cities = enriched;
      writeStorageCache(STORAGE_KEYS.CACHE_CITIES, enriched);
      return enriched;
    }
  } catch {
    // Gunakan daftar kota fallback jika jaringan bermasalah
  }

  memoryCache.cities = FALLBACK_CITIES;
  return FALLBACK_CITIES;
}

export async function fetchPrayerSchedule(cityId, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const cacheKey = `${cityId}_${yyyy}-${mm}-${dd}`;

  if (memoryCache.prayerSchedule.has(cacheKey)) {
    return memoryCache.prayerSchedule.get(cacheKey);
  }

  const storageKey = `${STORAGE_KEYS.CACHE_PRAYER_PREFIX}${cacheKey}`;
  try {
    const res = await fetch(`${MYQURAN_BASE}/jadwal/${cityId}/${yyyy}/${mm}/${dd}`);
    if (!res.ok) throw new Error('Gagal memuat jadwal shalat dari Kemenag');
    const json = await res.json();
    if (!json?.status || !json?.data?.jadwal) {
      throw new Error('Jadwal shalat tidak tersedia untuk wilayah ini');
    }
    memoryCache.prayerSchedule.set(cacheKey, json.data);
    writeStorageCache(storageKey, json.data);
    return json.data;
  } catch (err) {
    const cached = readStorageCache(storageKey, 0);
    if (cached) {
      memoryCache.prayerSchedule.set(cacheKey, cached);
      return cached;
    }
    throw err;
  }
}

export async function fetchDailyDuas() {
  if (memoryCache.duas) return memoryCache.duas;
  const cached = readStorageCache(STORAGE_KEYS.CACHE_DUAS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    memoryCache.duas = cached;
    return cached;
  }

  try {
    const res = await fetch(EQURAN_DOA_URL);
    if (!res.ok) throw new Error('Gagal memuat doa harian');
    const json = await res.json();
    if (Array.isArray(json?.data) && json.data.length > 0) {
      memoryCache.duas = json.data;
      writeStorageCache(STORAGE_KEYS.CACHE_DUAS, json.data);
      return json.data;
    }
  } catch {
    // Fallback doa harian otentik
  }

  memoryCache.duas = FALLBACK_DUAS;
  return FALLBACK_DUAS;
}
