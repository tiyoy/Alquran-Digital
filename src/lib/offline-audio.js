export const OFFLINE_AUDIO_CACHE_NAME = 'nurani-audio-offline-v1';
export const OFFLINE_AUDIO_STORAGE_KEY = 'aq:offline-audios';
export const MAX_AUDIO_TRACK_BYTES = 80 * 1024 * 1024;
export const MAX_TOTAL_AUDIO_BYTES = 200 * 1024 * 1024;

const RECITER_DIRECTORY_IDS = [
  { id: '01', slug: 'Abdullah-Al-Juhany', match: /abdullah.?al.?juhany|juhany/i },
  { id: '02', slug: 'Abdul-Muhsin-Al-Qasim', match: /abdul.?muhsin|al.?qasim|qasim/i },
  { id: '03', slug: 'Abdurrahman-As-Sudais', match: /abdurrahman|as.?sudais|sudais/i },
  { id: '04', slug: 'Ibrahim-Al-Dossari', match: /ibrahim.?al.?dossari|dossari/i },
  { id: '05', slug: 'Misyari-Rasyid-Al-Afasi', match: /misyari|mishary|afasi|afasy/i },
  { id: '06', slug: 'Yasser-Al-Dosari', match: /yasser|al.?dosari|dosari/i }
];

export function inferOfflineAudioReciterId(src, reciterName = '') {
  const candidate = `${String(src || '')} ${String(reciterName || '')}`;
  return RECITER_DIRECTORY_IDS.find((reciter) => reciter.match.test(candidate))?.id || '';
}

export function normalizeOfflineAudioTracks(value) {
  if (!Array.isArray(value)) return [];
  // Full-surah tracks and verse-level tracks have distinct stable keys so a small
  // verse download never replaces an entire surah (or another verse) for the same Qari.
  const byTrackKey = new Map();
  for (const item of value) {
    const surahId = Number(item?.surahId);
    const src = String(item?.src || '').trim();
    let parsedUrl;
    try { parsedUrl = new URL(src); } catch { continue; }
    const bytes = Number(item?.bytes);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || parsedUrl.protocol !== 'https:' || !parsedUrl.hostname) continue;
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > MAX_AUDIO_TRACK_BYTES) continue;
    const reciter = String(item?.reciter || 'Qari pilihan').slice(0, 100);
    const requestedId = String(item?.reciterId || '');
    const reciterId = /^0[1-6]$/.test(requestedId) ? requestedId : inferOfflineAudioReciterId(parsedUrl.href, reciter);
    const verseNumber = Number(item?.verseNumber);
    const type = item?.type === 'verse' && Number.isInteger(verseNumber) && verseNumber > 0 && verseNumber <= 286 ? 'verse' : 'full';
    const normalizedVerseNumber = type === 'verse' ? verseNumber : 0;
    const trackKey = `${surahId}:${reciterId || parsedUrl.href}:${type}:${normalizedVerseNumber}`;
    byTrackKey.set(trackKey, {
      surahId,
      type,
      verseNumber: normalizedVerseNumber,
      src: parsedUrl.href,
      reciterId,
      title: String(item?.title || `Surah ${surahId}${type === 'verse' ? ` · Ayat ${normalizedVerseNumber}` : ''}`).slice(0, 100),
      reciter,
      bytes: Math.floor(bytes),
      savedAt: Number.isFinite(Number(item?.savedAt)) ? Number(item.savedAt) : 0
    });
  }
  return [...byTrackKey.values()].sort((a, b) => a.surahId - b.surahId
    || String(a.reciterId || a.reciter).localeCompare(String(b.reciterId || b.reciter))
    || a.type.localeCompare(b.type)
    || a.verseNumber - b.verseNumber);
}

export function upsertOfflineAudioTrack(tracks, track) {
  const normalizedTrack = normalizeOfflineAudioTracks([track])[0];
  if (!normalizedTrack) return normalizeOfflineAudioTracks(tracks);
  return normalizeOfflineAudioTracks([
    ...normalizeOfflineAudioTracks(tracks).filter((item) => {
      const sameSlot = item.surahId === normalizedTrack.surahId
        && item.reciterId === normalizedTrack.reciterId
        && item.type === normalizedTrack.type
        && (normalizedTrack.type === 'full' || item.verseNumber === normalizedTrack.verseNumber);
      return !sameSlot && item.src !== normalizedTrack.src;
    }),
    normalizedTrack
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
