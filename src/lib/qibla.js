/** Geographic reference point for the Kaaba in Makkah. */
export const KAABA_COORDINATES = Object.freeze({ latitude: 21.422487, longitude: 39.826206 });

export function normalizeDegrees(value) {
  const degrees = Number(value);
  if (!Number.isFinite(degrees)) return null;
  return ((degrees % 360) + 360) % 360;
}

/** Returns the initial great-circle bearing from a location to the Kaaba, measured clockwise from true north. */
export function calculateQiblaBearing(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new RangeError('Koordinat lokasi tidak valid.');
  }

  const longitudeDelta = Math.abs((((lon - KAABA_COORDINATES.longitude) % 360) + 540) % 360 - 180);
  if (Math.abs(lat - KAABA_COORDINATES.latitude) < 1e-8 && longitudeDelta < 1e-8) {
    throw new RangeError('Arah tidak terdefinisi tepat dari titik Ka’bah.');
  }

  const toRadians = (degrees) => degrees * Math.PI / 180;
  const phi1 = toRadians(lat);
  const phi2 = toRadians(KAABA_COORDINATES.latitude);
  const deltaLambda = toRadians(KAABA_COORDINATES.longitude - lon);
  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
  return normalizeDegrees(Math.atan2(y, x) * 180 / Math.PI);
}

export function getCompassDirection(degrees) {
  const normalized = normalizeDegrees(degrees);
  if (normalized === null) return '—';
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  return directions[Math.round(normalized / 45) % directions.length];
}
