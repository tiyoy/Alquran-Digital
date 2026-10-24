import { siteDescription, siteName } from '@/lib/site-config';

export const SECTION_ROUTES = [
  {
    tab: 'home',
    path: '/',
    title: siteName,
    description: siteDescription,
    keywords: ['Al-Qur’an digital', 'baca Al-Qur’an online', 'ibadah harian']
  },
  {
    tab: 'quran',
    path: '/quran',
    title: 'Baca Al-Qur’an Online dengan Terjemahan Indonesia',
    description: 'Baca Al-Qur’an digital dengan teks Arab, transliterasi Latin, terjemahan Indonesia, audio murottal, bookmark, dan mode hafalan.',
    keywords: ['baca Al-Qur’an online', 'Al-Qur’an terjemahan Indonesia', 'murottal']
  },
  {
    tab: 'search',
    path: '/pencarian',
    title: 'Pencarian Al-Qur’an Arab, Latin, dan Terjemahan Indonesia',
    description: 'Cari ayat Al-Qur’an berdasarkan teks Arab, transliterasi Latin, atau kata dalam terjemahan Indonesia. Buka dan bagikan ayat langsung dari hasil pencarian.',
    keywords: ['pencarian Al-Qur’an', 'cari ayat Al-Qur’an', 'pencarian terjemahan Al-Qur’an', 'cari ayat Arab Latin']
  },
  {
    tab: 'prayer',
    path: '/jadwal-shalat',
    title: 'Jadwal Shalat Kabupaten Bogor dan Indonesia',
    description: 'Lihat jadwal shalat harian untuk Kabupaten Bogor dan berbagai wilayah Indonesia, dengan pilihan kota dan informasi waktu shalat.',
    keywords: ['jadwal shalat Kabupaten Bogor', 'jadwal shalat Indonesia', 'waktu shalat']
  },
  {
    tab: 'duas',
    path: '/doa',
    title: 'Doa Harian Islam Arab Latin dan Artinya',
    description: 'Kumpulan doa harian dalam bahasa Arab, bacaan Latin, terjemahan Indonesia, dan pencarian doa untuk aktivitas sehari-hari.',
    keywords: ['doa harian', 'doa sehari-hari', 'doa Islam dan artinya']
  },
  {
    tab: 'asma',
    path: '/asmaul-husna',
    title: '99 Asmaul Husna dan Artinya',
    description: 'Pelajari 99 Asmaul Husna dengan tulisan Arab, transliterasi Latin, makna, dan fitur favorit untuk belajar bertahap.',
    keywords: ['99 Asmaul Husna', 'Asmaul Husna dan artinya', 'nama-nama Allah']
  },
  {
    tab: 'qibla',
    path: '/arah-kiblat',
    title: 'Arah Kiblat Online dengan Kompas',
    description: 'Hitung azimuth kiblat dari lokasi perangkat dan gunakan sensor kompas jika didukung browser. Lokasi diproses di perangkat.',
    keywords: ['arah kiblat online', 'kompas kiblat', 'arah Kaabah', 'qibla finder Indonesia']
  }
];

export const SECTION_SEO_BY_TAB = Object.fromEntries(SECTION_ROUTES.map((route) => [route.tab, route]));
export const TAB_PATHS = Object.fromEntries(SECTION_ROUTES.map(({ tab, path }) => [tab, path]));
export const PATH_TABS = Object.fromEntries(SECTION_ROUTES.map(({ tab, path }) => [path, tab]));
export const VALID_TABS = SECTION_ROUTES.map(({ tab }) => tab);
