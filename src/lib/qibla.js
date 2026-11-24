/**
 * Kalkulasi Arah Kiblat (Spherical Great-Circle Bearing) & Jarak ke Ka'bah (Haversine)
 * Koordinat Ka'bah, Masjidil Haram, Makkah Al-Mukarramah:
 * Latitude: 21.422487° N, Longitude: 39.826206° E
 */

export const KAABA_COORDS = {
  lat: 21.422487,
  lng: 39.826206,
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Menghitung sudut azimuth arah Kiblat (0° = Utara, 90° = Timur, 180° = Selatan, 270° = Barat)
 */
export function calculateQiblaBearing(lat, lng) {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_COORDS.lat);
  const deltaLambda = toRad(KAABA_COORDS.lng - lng);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  return bearing;
}

/**
 * Menghitung jarak dari lokasi pengguna ke Ka'bah dalam kilometer (Haversine)
 */
export function calculateDistanceToKaabaKm(lat, lng) {
  const R = 6371; // Radius bumi (km)
  const dLat = toRad(KAABA_COORDS.lat - lat);
  const dLng = toRad(KAABA_COORDS.lng - lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat)) *
      Math.cos(toRad(KAABA_COORDS.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Label arah mata angin dalam Bahasa Indonesia
 */
export function getCardinalDirectionLabel(deg) {
  const directions = [
    'Utara',
    'Timur Laut',
    'Timur',
    'Tenggara',
    'Selatan',
    'Barat Daya',
    'Barat',
    'Barat Laut',
  ];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return directions[idx];
}

/**
 * Selisih sudut terpendek (-180° s/d +180°) antara heading kompas dan arah kiblat
 */
export function getAngularDifference(heading, targetBearing) {
  return ((targetBearing - heading + 540) % 360) - 180;
}

export const INDONESIAN_QIBLA_CITIES = [
  { id: 'bogor', name: 'Kota Bogor', region: 'Jawa Barat', lat: -6.5971, lng: 106.806 },
  { id: 'kab-bogor', name: 'Kab. Bogor (Cibinong/Dramaga)', region: 'Jawa Barat', lat: -6.4816, lng: 106.854 },
  { id: 'jakarta', name: 'DKI Jakarta', region: 'DKI Jakarta', lat: -6.2088, lng: 106.8456 },
  { id: 'depok', name: 'Kota Depok', region: 'Jawa Barat', lat: -6.4025, lng: 106.7942 },
  { id: 'bekasi', name: 'Kota Bekasi', region: 'Jawa Barat', lat: -6.2383, lng: 106.9756 },
  { id: 'tangerang', name: 'Kota Tangerang', region: 'Banten', lat: -6.1783, lng: 106.6319 },
  { id: 'bandung', name: 'Kota Bandung', region: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { id: 'semarang', name: 'Kota Semarang', region: 'Jawa Tengah', lat: -6.9667, lng: 110.4167 },
  { id: 'yogyakarta', name: 'DI Yogyakarta', region: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { id: 'surabaya', name: 'Kota Surabaya', region: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
  { id: 'denpasar', name: 'Kota Denpasar', region: 'Bali', lat: -8.6705, lng: 115.2126 },
  { id: 'banda-aceh', name: 'Banda Aceh', region: 'Aceh', lat: 5.5483, lng: 95.3238 },
  { id: 'medan', name: 'Kota Medan', region: 'Sumatra Utara', lat: 3.5952, lng: 98.6722 },
  { id: 'palembang', name: 'Kota Palembang', region: 'Sumatra Selatan', lat: -2.9761, lng: 104.7754 },
  { id: 'balikpapan', name: 'Kota Balikpapan', region: 'Kalimantan Timur', lat: -1.2379, lng: 116.8529 },
  { id: 'makassar', name: 'Kota Makassar', region: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327 },
  { id: 'ambon', name: 'Kota Ambon', region: 'Maluku', lat: -3.6954, lng: 128.1814 },
  { id: 'jayapura', name: 'Kota Jayapura', region: 'Papua', lat: -2.5916, lng: 140.669 },
];
