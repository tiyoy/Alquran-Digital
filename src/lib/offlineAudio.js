/**
 * Pengelola Unduh & Penyimpanan Offline Audio Murottal (Cache Storage API)
 * Mendukung pemutaran offline di dalam aplikasi sekaligus unduh file MP3 ke perangkat.
 */

import { STORAGE_KEYS } from './constants.js';

export const OFFLINE_AUDIO_CACHE_NAME = 'aqdi-offline-audio-v1';

export function makeAudioKey(surahNumber, qariId) {
  return `${surahNumber}_${qariId}`;
}

export function getDownloadedAudioIndex() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OFFLINE_AUDIO_INDEX);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDownloadedAudioIndex(index) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.OFFLINE_AUDIO_INDEX,
      JSON.stringify(index)
    );
  } catch {}
}

export function isSurahAudioDownloaded(surahNumber, qariId) {
  const idx = getDownloadedAudioIndex();
  return Boolean(idx[makeAudioKey(surahNumber, qariId)]);
}

/**
 * Cek sinkron apakah sebuah URL audio tercatat di indeks cache offline
 * sehingga pemutaran online tidak perlu menunggu async Cache Storage lookup.
 */
export function hasCachedAudioUrl(url) {
  if (!url) return false;
  const idx = getDownloadedAudioIndex();
  return Object.values(idx).some((entry) => entry?.url === url);
}

/**
 * Mengunduh MP3 surah ke browser Cache Storage untuk pemutaran offline
 * dengan pelaporan progres persentase (0–100).
 */
export async function downloadSurahAudioOffline({
  url,
  surahNumber,
  surahName,
  qariId,
  qariName,
  onProgress,
}) {
  if (typeof window === 'undefined' || !('caches' in window)) {
    throw new Error('Browser tidak mendukung penyimpanan Cache Storage offline');
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Gagal mengunduh berkas audio murottal');
  }

  const contentLength = Number(res.headers.get('content-length') || 0);
  let blob;

  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength > 0) {
        onProgress?.(Math.min(99, Math.round((received / contentLength) * 100)));
      }
    }
    blob = new Blob(chunks, { type: 'audio/mpeg' });
  } else {
    blob = await res.blob();
  }

  const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
  const cacheResponse = new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(blob.size),
    },
  });
  await cache.put(url, cacheResponse);

  const index = getDownloadedAudioIndex();
  const key = makeAudioKey(surahNumber, qariId);
  index[key] = {
    surahNumber,
    surahName,
    qariId,
    qariName,
    url,
    sizeBytes: blob.size,
    savedAt: Date.now(),
  };
  saveDownloadedAudioIndex(index);
  onProgress?.(100);

  return index[key];
}

/**
 * Mengambil Object URL dari Cache Storage bila tersedia agar bisa diputar 100% offline
 */
export async function getCachedAudioObjectUrl(url) {
  if (typeof window === 'undefined' || !('caches' in window) || !url) {
    return null;
  }
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const match = await cache.match(url);
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Menghapus audio offline dari Cache Storage
 */
export async function removeDownloadedSurahAudio(surahNumber, qariId, url) {
  if (typeof window !== 'undefined' && 'caches' in window && url) {
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      await cache.delete(url);
    } catch {}
  }
  const index = getDownloadedAudioIndex();
  delete index[makeAudioKey(surahNumber, qariId)];
  saveDownloadedAudioIndex(index);
  return index;
}

/**
 * Memicu unduhan berkas MP3 langsung ke folder Unduhan perangkat
 */
export async function triggerMp3DeviceDownload(url, filename) {
  // Cek dari cache offline dulu agar cepat & hemat kuota
  let blob = null;
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      const match = await cache.match(url);
      if (match) blob = await match.blob();
    } catch {}
  }

  if (!blob) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengunduh file MP3');
    blob = await res.blob();
  }

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
