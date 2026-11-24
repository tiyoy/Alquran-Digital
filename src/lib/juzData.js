/**
 * Pemetaan Lengkap 30 Juz Al-Qur'an Standar Mushaf Indonesia (ODOJ / Khatam Tracker)
 * Memungkinkan lompat langsung ke Surah & Ayat awal setiap Juz.
 */

export const JUZ_LIST = [
  { juz: 1, startSurah: 1, startName: 'Al-Fatihah', startAyat: 1, endSurah: 2, endName: 'Al-Baqarah', endAyat: 141 },
  { juz: 2, startSurah: 2, startName: 'Al-Baqarah', startAyat: 142, endSurah: 2, endName: 'Al-Baqarah', endAyat: 252 },
  { juz: 3, startSurah: 2, startName: 'Al-Baqarah', startAyat: 253, endSurah: 3, endName: 'Ali Imran', endAyat: 92 },
  { juz: 4, startSurah: 3, startName: 'Ali Imran', startAyat: 93, endSurah: 4, endName: 'An-Nisa', endAyat: 23 },
  { juz: 5, startSurah: 4, startName: 'An-Nisa', startAyat: 24, endSurah: 4, endName: 'An-Nisa', endAyat: 147 },
  { juz: 6, startSurah: 4, startName: 'An-Nisa', startAyat: 148, endSurah: 5, endName: "Al-Ma'idah", endAyat: 81 },
  { juz: 7, startSurah: 5, startName: "Al-Ma'idah", startAyat: 82, endSurah: 6, endName: "Al-An'am", endAyat: 110 },
  { juz: 8, startSurah: 6, startName: "Al-An'am", startAyat: 111, endSurah: 7, endName: "Al-A'raf", endAyat: 87 },
  { juz: 9, startSurah: 7, startName: "Al-A'raf", startAyat: 88, endSurah: 8, endName: 'Al-Anfal', endAyat: 40 },
  { juz: 10, startSurah: 8, startName: 'Al-Anfal', startAyat: 41, endSurah: 9, endName: 'At-Taubah', endAyat: 92 },
  { juz: 11, startSurah: 9, startName: 'At-Taubah', startAyat: 93, endSurah: 11, endName: 'Hud', endAyat: 5 },
  { juz: 12, startSurah: 11, startName: 'Hud', startAyat: 6, endSurah: 12, endName: 'Yusuf', endAyat: 52 },
  { juz: 13, startSurah: 12, startName: 'Yusuf', startAyat: 53, endSurah: 14, endName: 'Ibrahim', endAyat: 52 },
  { juz: 14, startSurah: 15, startName: 'Al-Hijr', startAyat: 1, endSurah: 16, endName: 'An-Nahl', endAyat: 128 },
  { juz: 15, startSurah: 17, startName: "Al-Isra'", startAyat: 1, endSurah: 18, endName: 'Al-Kahf', endAyat: 74 },
  { juz: 16, startSurah: 18, startName: 'Al-Kahf', startAyat: 75, endSurah: 20, endName: 'Taha', endAyat: 135 },
  { juz: 17, startSurah: 21, startName: 'Al-Anbiya', startAyat: 1, endSurah: 22, endName: 'Al-Hajj', endAyat: 78 },
  { juz: 18, startSurah: 23, startName: "Al-Mu'minun", startAyat: 1, endSurah: 25, endName: 'Al-Furqan', endAyat: 20 },
  { juz: 19, startSurah: 25, startName: 'Al-Furqan', startAyat: 21, endSurah: 27, endName: 'An-Naml', endAyat: 55 },
  { juz: 20, startSurah: 27, startName: 'An-Naml', startAyat: 56, endSurah: 29, endName: 'Al-Ankabut', endAyat: 45 },
  { juz: 21, startSurah: 29, startName: 'Al-Ankabut', startAyat: 46, endSurah: 33, endName: 'Al-Ahzab', endAyat: 30 },
  { juz: 22, startSurah: 33, startName: 'Al-Ahzab', startAyat: 31, endSurah: 36, endName: 'Yasin', endAyat: 27 },
  { juz: 23, startSurah: 36, startName: 'Yasin', startAyat: 28, endSurah: 39, endName: 'Az-Zumar', endAyat: 31 },
  { juz: 24, startSurah: 39, startName: 'Az-Zumar', startAyat: 32, endSurah: 41, endName: 'Fussilat', endAyat: 46 },
  { juz: 25, startSurah: 41, startName: 'Fussilat', startAyat: 47, endSurah: 45, endName: 'Al-Jasiyah', endAyat: 37 },
  { juz: 26, startSurah: 46, startName: 'Al-Ahqaf', startAyat: 1, endSurah: 51, endName: 'Az-Zariyat', endAyat: 30 },
  { juz: 27, startSurah: 51, startName: 'Az-Zariyat', startAyat: 31, endSurah: 57, endName: 'Al-Hadid', endAyat: 29 },
  { juz: 28, startSurah: 58, startName: 'Al-Mujadalah', startAyat: 1, endSurah: 66, endName: 'At-Tahrim', endAyat: 12 },
  { juz: 29, startSurah: 67, startName: 'Al-Mulk', startAyat: 1, endSurah: 77, endName: 'Al-Mursalat', endAyat: 50 },
  { juz: 30, startSurah: 78, startName: "An-Naba'", startAyat: 1, endSurah: 114, endName: 'An-Nas', endAyat: 6 },
];

/**
 * Koleksi Ayat Pilihan Harian (Daily Verse of the Day)
 */
export const DAILY_VERSES = [
  {
    surahNumber: 94,
    surahName: 'Al-Insyirah',
    verseNumber: 6,
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Sesungguhnya beserta kesulitan itu ada kemudahan.',
  },
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    verseNumber: 286,
    arabic: 'لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.',
  },
  {
    surahNumber: 13,
    surahName: "Ar-Ra'd",
    verseNumber: 28,
    arabic: 'أَلَا بِذِكْرِ اللّٰهِ تَطْمَئِنُّ الْقُلُوْبُ',
    translation: 'Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.',
  },
  {
    surahNumber: 65,
    surahName: 'At-Talaq',
    verseNumber: 3,
    arabic: 'وَمَنْ يَّتَوَكَّلْ عَلَى اللّٰهِ فَهُوَ حَسْبُهٗ',
    translation: 'Dan barang siapa bertawakal kepada Allah, niscaya Allah akan mencukupkan (keperluan)-nya.',
  },
  {
    surahNumber: 14,
    surahName: 'Ibrahim',
    verseNumber: 7,
    arabic: 'لَىِٕنْ شَكَرْتُمْ لَاَزِيْدَنَّكُمْ',
    translation: 'Sesungguhnya jika kamu bersyukur, niscaya Aku akan menambah (nikmat) kepadamu.',
  },
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    verseNumber: 152,
    arabic: 'فَاذْكُرُوْنِيْٓ اَذْكُرْكُمْ وَاشْكُرُوْا لِيْ وَلَا تَكْفُرُوْنِ',
    translation: 'Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu. Bersyukurlah kepada-Ku dan janganlah kamu ingkar kepada-Ku.',
  },
  {
    surahNumber: 3,
    surahName: 'Ali Imran',
    verseNumber: 139,
    arabic: 'وَلَا تَهِنُوْا وَلَا تَحْزَنُوْا وَاَنْتُمُ الْاَعْلَوْنَ اِنْ كُنْتُمْ مُّؤْمِنِيْنَ',
    translation: 'Janganlah kamu (merasa) lemah, dan jangan (pula) bersedih hati, sebab kamu paling tinggi (derajatnya), jika kamu orang beriman.',
  },
];

export function getDailyVerse(date = new Date()) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return DAILY_VERSES[Math.abs(dayOfYear) % DAILY_VERSES.length];
}
