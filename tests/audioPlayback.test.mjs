import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSurahPlaybackTarget,
  shouldSyncPlaybackEffect,
} from '../src/lib/audioPlayback.js';

const MOCK_SURAH = {
  nomor: 1,
  namaLatin: 'Al-Fatihah',
  jumlahAyat: 3,
  audioFull: {
    '05': 'https://cdn.example.com/full/001.mp3',
  },
  ayat: [
    { nomorAyat: 1, audio: { '05': 'https://cdn.example.com/verse/001001.mp3' } },
    { nomorAyat: 2, audio: { '05': 'https://cdn.example.com/verse/001002.mp3' } },
    { nomorAyat: 3, audio: { '05': 'https://cdn.example.com/verse/001003.mp3' } },
  ],
};

test('resolveSurahPlaybackTarget starts verse-by-verse from verse 1 by default so auto-scroll follows audio', () => {
  const target = resolveSurahPlaybackTarget(MOCK_SURAH, '05');
  assert.deepEqual(target, {
    mode: 'verse',
    verseNumber: 1,
    url: 'https://cdn.example.com/verse/001001.mp3',
  });
});

test('resolveSurahPlaybackTarget respects target startVerse when opening a specific verse', () => {
  const target = resolveSurahPlaybackTarget(MOCK_SURAH, '05', { startVerse: 2 });
  assert.deepEqual(target, {
    mode: 'verse',
    verseNumber: 2,
    url: 'https://cdn.example.com/verse/001002.mp3',
  });
});

test('resolveSurahPlaybackTarget falls back to cached full-surah audio when offline with cached full audio', () => {
  const target = resolveSurahPlaybackTarget(MOCK_SURAH, '05', {
    isOffline: true,
    hasOfflineFullAudio: true,
  });
  assert.deepEqual(target, {
    mode: 'full',
    verseNumber: null,
    url: 'https://cdn.example.com/full/001.mp3',
  });
});

test('resolveSurahPlaybackTarget falls back to full audio if per-verse audio is missing for selected qari', () => {
  const surahNoVerseAudio = {
    ...MOCK_SURAH,
    ayat: [{ nomorAyat: 1, audio: {} }],
  };
  const target = resolveSurahPlaybackTarget(surahNoVerseAudio, '05');
  assert.deepEqual(target, {
    mode: 'full',
    verseNumber: null,
    url: 'https://cdn.example.com/full/001.mp3',
  });
});

test('shouldSyncPlaybackEffect waits while source is not ready instead of calling play() prematurely', () => {
  assert.equal(
    shouldSyncPlaybackEffect({
      isActive: true,
      hasUrl: true,
      isSourceReady: false,
      isPlaying: true,
      audioPaused: true,
    }),
    'wait'
  );

  assert.equal(
    shouldSyncPlaybackEffect({
      isActive: true,
      hasUrl: true,
      isSourceReady: true,
      isPlaying: true,
      audioPaused: true,
    }),
    'play'
  );

  assert.equal(
    shouldSyncPlaybackEffect({
      isActive: true,
      hasUrl: true,
      isSourceReady: true,
      isPlaying: false,
      audioPaused: false,
    }),
    'pause'
  );

  assert.equal(
    shouldSyncPlaybackEffect({
      isActive: true,
      hasUrl: true,
      isSourceReady: true,
      isPlaying: true,
      audioPaused: false,
    }),
    'noop'
  );
});
