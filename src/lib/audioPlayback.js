/**
 * Helper pemutaran audio surah & penjaga sinkronisasi status play/pause
 * agar pemutaran langsung berjalan dalam 1 klik serta mendukung auto-scroll per ayat.
 */

export function resolveSurahPlaybackTarget(surahData, qariId, options = {}) {
  if (!surahData) return null;
  const {
    startVerse = 1,
    isOffline = false,
    hasOfflineFullAudio = false,
  } = options;

  const fullUrl = surahData.audioFull?.[qariId] || '';

  // Saat perangkat offline dan cache MP3 full-surah tersedia, prioritaskan cache offline
  if (isOffline && hasOfflineFullAudio && fullUrl) {
    return {
      mode: 'full',
      verseNumber: null,
      url: fullUrl,
    };
  }

  const verses = Array.isArray(surahData.ayat) ? surahData.ayat : [];
  const requestedVerseNum = Number(startVerse) || 1;
  const targetAyat =
    verses.find((a) => a.nomorAyat === requestedVerseNum) || verses[0] || null;

  const verseUrl = targetAyat?.audio?.[qariId] || '';
  if (targetAyat && verseUrl) {
    return {
      mode: 'verse',
      verseNumber: targetAyat.nomorAyat,
      url: verseUrl,
    };
  }

  if (fullUrl) {
    return {
      mode: 'full',
      verseNumber: null,
      url: fullUrl,
    };
  }

  return null;
}

/**
 * Menentukan aksi efek sinkronisasi play/pause di AudioPlayerBar.
 * Mengembalikan 'wait' selama sumber audio belum selesai dipasang (mencegah
 * pemanggilan audio.play() sebelum audio.src terisi yang memicu bug klik 2x).
 */
export function shouldSyncPlaybackEffect({
  isActive,
  hasUrl,
  isSourceReady,
  isPlaying,
  audioPaused,
}) {
  if (!isActive || !hasUrl) return 'noop';
  if (!isSourceReady) return 'wait';
  if (isPlaying && audioPaused) return 'play';
  if (!isPlaying && !audioPaused) return 'pause';
  return 'noop';
}
