export const OFFLINE_AUDIO_CACHE_NAME = 'nurani-audio-offline-v1';
export const OFFLINE_AUDIO_STORAGE_KEY = 'aq:offline-audios';
export const MAX_AUDIO_TRACK_BYTES = 80 * 1024 * 1024;
export const MAX_TOTAL_AUDIO_BYTES = 200 * 1024 * 1024;

export function normalizeOfflineAudioTracks(value) {
  if (!Array.isArray(value)) return [];
  const bySurah = new Map();
  for (const item of value) {
    const surahId = Number(item?.surahId);
    const src = String(item?.src || '').trim();
    let parsedUrl;
    try { parsedUrl = new URL(src); } catch { continue; }
    const bytes = Number(item?.bytes);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || parsedUrl.protocol !== 'https:' || !parsedUrl.hostname) continue;
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > MAX_AUDIO_TRACK_BYTES) continue;
    bySurah.set(surahId, {
      surahId,
      src: parsedUrl.href,
      title: String(item?.title || `Surah ${surahId}`).slice(0, 100),
      reciter: String(item?.reciter || 'Qari pilihan').slice(0, 100),
      bytes: Math.floor(bytes),
      savedAt: Number.isFinite(Number(item?.savedAt)) ? Number(item.savedAt) : 0
    });
  }
  return [...bySurah.values()].sort((a, b) => a.surahId - b.surahId);
}

export function upsertOfflineAudioTrack(tracks, track) {
  return normalizeOfflineAudioTracks([
    ...normalizeOfflineAudioTracks(tracks).filter((item) => item.surahId !== Number(track?.surahId)),
    track
  ]);
}

export function totalOfflineAudioBytes(tracks) {
  return normalizeOfflineAudioTracks(tracks).reduce((sum, track) => sum + track.bytes, 0);
}

export async function inspectOfflineAudioCache(tracks) {
  const normalizedTracks = normalizeOfflineAudioTracks(tracks);
  const cachedSrcs = [];
  const missingSrcs = [];
  let cachedBytes = 0;
  if (typeof caches === 'undefined') {
    return { cachedSrcs, missingSrcs: normalizedTracks.map((track) => track.src), cachedBytes };
  }
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    for (const track of normalizedTracks) {
      const response = await cache.match(track.src);
      if (!response) {
        missingSrcs.push(track.src);
        continue;
      }
      cachedSrcs.push(track.src);
      const responseBytes = Number(response.headers.get('content-length'));
      cachedBytes += Number.isFinite(responseBytes) && responseBytes > 0 ? responseBytes : track.bytes;
    }
  } catch {
    normalizedTracks.forEach((track) => missingSrcs.push(track.src));
  }
  return { cachedSrcs, missingSrcs, cachedBytes };
}
