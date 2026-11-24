export const ISLAND_REGIONS = [
  { id: 'semua', label: 'Semua Wilayah' },
  { id: 'jabodetabek', label: 'Bogor & Jabodetabek' },
  { id: 'jawa-bali', label: 'Jawa & Bali' },
  { id: 'sumatra', label: 'Sumatra' },
  { id: 'kalimantan', label: 'Kalimantan' },
  { id: 'sulawesi-nt', label: 'Sulawesi & Nusa Tenggara' },
  { id: 'maluku-papua', label: 'Maluku & Papua' },
];

export const JABODETABEK_IDS = new Set([
  '1222', // Kota Bogor
  '1204', // Kab. Bogor (Cibinong/Dramaga)
  '1301', // DKI Jakarta
  '1302', // Kab. Kepulauan Seribu
  '1225', // Kota Depok
  '1221', // Kota Bekasi
  '1203', // Kab. Bekasi
  '1107', // Kota Tangerang
  '1108', // Kota Tangerang Selatan
  '1104', // Kab. Tangerang
]);

export const JABODETABEK_QUICK_PICKS = [
  { id: '1222', lokasi: 'KOTA BOGOR', displayName: 'Kota Bogor', subLabel: 'Jawa Barat', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1204', lokasi: 'KAB. BOGOR', displayName: 'Kab. Bogor (Cibinong / Dramaga)', subLabel: 'Jawa Barat', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1301', lokasi: 'KOTA JAKARTA', displayName: 'DKI Jakarta', subLabel: 'DKI Jakarta', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1225', lokasi: 'KOTA DEPOK', displayName: 'Kota Depok', subLabel: 'Jawa Barat', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1221', lokasi: 'KOTA BEKASI', displayName: 'Kota Bekasi', subLabel: 'Jawa Barat', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1107', lokasi: 'KOTA TANGERANG', displayName: 'Kota Tangerang', subLabel: 'Banten', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
  { id: '1108', lokasi: 'KOTA TANGERANG SELATAN', displayName: 'Tangerang Selatan', subLabel: 'Banten', regionId: 'jabodetabek', timezone: 'WIB', offsetHours: 7 },
];

export const DEFAULT_PRAYER_CITY = JABODETABEK_QUICK_PICKS[0]; // Kota Bogor

const PROVINCE_MAP = {
  '01': { province: 'Aceh', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '02': { province: 'Sumatra Utara', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '03': { province: 'Sumatra Barat', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '04': { province: 'Riau', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '05': { province: 'Kepulauan Riau', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '06': { province: 'Jambi', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '07': { province: 'Bengkulu', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '08': { province: 'Sumatra Selatan', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '09': { province: 'Bangka Belitung', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '10': { province: 'Lampung', regionId: 'sumatra', timezone: 'WIB', offsetHours: 7 },
  '11': { province: 'Banten', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '12': { province: 'Jawa Barat', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '13': { province: 'DKI Jakarta', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '14': { province: 'Jawa Tengah', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '15': { province: 'DI Yogyakarta', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '16': { province: 'Jawa Timur', regionId: 'jawa-bali', timezone: 'WIB', offsetHours: 7 },
  '17': { province: 'Bali', regionId: 'jawa-bali', timezone: 'WITA', offsetHours: 8 },
  '18': { province: 'Nusa Tenggara Barat', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '19': { province: 'Nusa Tenggara Timur', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '20': { province: 'Kalimantan Barat', regionId: 'kalimantan', timezone: 'WIB', offsetHours: 7 },
  '21': { province: 'Kalimantan Selatan', regionId: 'kalimantan', timezone: 'WITA', offsetHours: 8 },
  '22': { province: 'Kalimantan Tengah', regionId: 'kalimantan', timezone: 'WIB', offsetHours: 7 },
  '23': { province: 'Kalimantan Timur', regionId: 'kalimantan', timezone: 'WITA', offsetHours: 8 },
  '24': { province: 'Kalimantan Utara', regionId: 'kalimantan', timezone: 'WITA', offsetHours: 8 },
  '25': { province: 'Gorontalo', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '26': { province: 'Sulawesi Selatan', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '27': { province: 'Sulawesi Tenggara', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '28': { province: 'Sulawesi Tengah', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '29': { province: 'Sulawesi Utara', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '30': { province: 'Sulawesi Barat', regionId: 'sulawesi-nt', timezone: 'WITA', offsetHours: 8 },
  '31': { province: 'Maluku', regionId: 'maluku-papua', timezone: 'WIT', offsetHours: 9 },
  '32': { province: 'Maluku Utara', regionId: 'maluku-papua', timezone: 'WIT', offsetHours: 9 },
  '33': { province: 'Papua', regionId: 'maluku-papua', timezone: 'WIT', offsetHours: 9 },
  '34': { province: 'Papua Barat', regionId: 'maluku-papua', timezone: 'WIT', offsetHours: 9 },
};

function toTitleCaseCity(raw) {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKab\./g, 'Kab.')
    .replace(/\bDki\b/g, 'DKI')
    .replace(/\bDi\b/g, 'DI');
}

export function enrichCity(city) {
  const id = String(city.id).padStart(4, '0');
  const prefix = id.slice(0, 2);
  const meta = PROVINCE_MAP[prefix] || {
    province: 'Indonesia',
    regionId: 'jawa-bali',
    timezone: 'WIB',
    offsetHours: 7,
  };
  const isJabodetabek = JABODETABEK_IDS.has(id);

  let displayName = toTitleCaseCity(city.lokasi);
  if (id === '1204') displayName = 'Kab. Bogor (Cibinong / Dramaga)';
  if (id === '1301') displayName = 'DKI Jakarta';

  return {
    id,
    lokasi: city.lokasi,
    displayName,
    subLabel: meta.province,
    regionId: meta.regionId,
    isJabodetabek,
    timezone: meta.timezone,
    offsetHours: meta.offsetHours,
  };
}

export const FALLBACK_CITIES = [
  { id: '1222', lokasi: 'KOTA BOGOR' },
  { id: '1204', lokasi: 'KAB. BOGOR' },
  { id: '1301', lokasi: 'KOTA JAKARTA' },
  { id: '1225', lokasi: 'KOTA DEPOK' },
  { id: '1221', lokasi: 'KOTA BEKASI' },
  { id: '1203', lokasi: 'KAB. BEKASI' },
  { id: '1107', lokasi: 'KOTA TANGERANG' },
  { id: '1108', lokasi: 'KOTA TANGERANG SELATAN' },
  { id: '1104', lokasi: 'KAB. TANGERANG' },
  { id: '1219', lokasi: 'KOTA BANDUNG' },
  { id: '1433', lokasi: 'KOTA SEMARANG' },
  { id: '1505', lokasi: 'KOTA YOGYAKARTA' },
  { id: '1638', lokasi: 'KOTA SURABAYA' },
  { id: '1709', lokasi: 'KOTA DENPASAR' },
  { id: '0119', lokasi: 'KOTA BANDA ACEH' },
  { id: '0228', lokasi: 'KOTA MEDAN' },
  { id: '0314', lokasi: 'KOTA PADANG' },
  { id: '0411', lokasi: 'KOTA PEKANBARU' },
  { id: '0816', lokasi: 'KOTA PALEMBANG' },
  { id: '1015', lokasi: 'KOTA BANDAR LAMPUNG' },
  { id: '2013', lokasi: 'KOTA PONTIANAK' },
  { id: '2113', lokasi: 'KOTA BANJARMASIN' },
  { id: '2308', lokasi: 'KOTA BALIKPAPAN' },
  { id: '2310', lokasi: 'KOTA SAMARINDA' },
  { id: '1810', lokasi: 'KOTA MATARAM' },
  { id: '1922', lokasi: 'KOTA KUPANG' },
  { id: '2622', lokasi: 'KOTA MAKASSAR' },
  { id: '2914', lokasi: 'KOTA MANADO' },
  { id: '3110', lokasi: 'KOTA AMBON' },
  { id: '3329', lokasi: 'KOTA JAYAPURA' },
].map(enrichCity);

export const PRAYER_ITEMS = [
  { key: 'imsak', label: 'Imsak', isMain: false },
  { key: 'subuh', label: 'Subuh', isMain: true },
  { key: 'terbit', label: 'Terbit', isMain: false },
  { key: 'dhuha', label: 'Dhuha', isMain: false },
  { key: 'dzuhur', label: 'Dzuhur', isMain: true },
  { key: 'ashar', label: 'Ashar', isMain: true },
  { key: 'maghrib', label: 'Maghrib', isMain: true },
  { key: 'isya', label: 'Isya', isMain: true },
];

/**
 * Menghitung waktu shalat berikutnya dan sisa waktu berdasarkan zona waktu kota terpilih (WIB/WITA/WIT)
 */
export function getNextPrayerInfo(jadwal, nowDate, offsetHours = 7) {
  if (!jadwal) return null;

  // Konversi jam saat ini ke waktu lokal kota (UTC + offsetHours)
  const utcMs = nowDate.getTime() + nowDate.getTimezoneOffset() * 60000;
  const cityNow = new Date(utcMs + offsetHours * 3600000);
  const currentSeconds =
    cityNow.getHours() * 3600 + cityNow.getMinutes() * 60 + cityNow.getSeconds();

  const mainPrayers = PRAYER_ITEMS.filter((p) => p.isMain);
  let nextPrayer = null;
  let currentPrayerKey = 'isya';

  for (let i = 0; i < mainPrayers.length; i++) {
    const p = mainPrayers[i];
    const timeStr = jadwal[p.key];
    if (!timeStr) continue;
    const [hh, mm] = timeStr.split(':').map(Number);
    const prayerSeconds = hh * 3600 + mm * 60;

    if (prayerSeconds > currentSeconds) {
      nextPrayer = {
        ...p,
        time: timeStr,
        remainingSeconds: prayerSeconds - currentSeconds,
      };
      currentPrayerKey = i === 0 ? 'isya' : mainPrayers[i - 1].key;
      break;
    }
  }

  // Jika semua shalat hari ini sudah lewat, shalat berikutnya adalah Subuh besok
  if (!nextPrayer && jadwal.subuh) {
    const [hh, mm] = jadwal.subuh.split(':').map(Number);
    const subuhSeconds = hh * 3600 + mm * 60;
    nextPrayer = {
      key: 'subuh',
      label: 'Subuh (Besok)',
      time: jadwal.subuh,
      remainingSeconds: 24 * 3600 - currentSeconds + subuhSeconds,
    };
    currentPrayerKey = 'isya';
  }

  if (!nextPrayer) return null;

  const hrs = Math.floor(nextPrayer.remainingSeconds / 3600);
  const mins = Math.floor((nextPrayer.remainingSeconds % 3600) / 60);
  const secs = nextPrayer.remainingSeconds % 60;

  return {
    nextKey: nextPrayer.key,
    nextLabel: nextPrayer.label,
    nextTime: nextPrayer.time,
    currentKey: currentPrayerKey,
    countdown: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    cityClock: `${String(cityNow.getHours()).padStart(2, '0')}:${String(cityNow.getMinutes()).padStart(2, '0')}:${String(cityNow.getSeconds()).padStart(2, '0')}`,
  };
}
