'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  LocateFixed,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import {
  INDONESIAN_QIBLA_CITIES,
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getAngularDifference,
  getCardinalDirectionLabel,
} from '@/lib/qibla';

export default function QiblaCompass({ onNotify }) {
  const [coords, setCoords] = useState({
    lat: INDONESIAN_QIBLA_CITIES[0].lat,
    lng: INDONESIAN_QIBLA_CITIES[0].lng,
    label: INDONESIAN_QIBLA_CITIES[0].name,
    source: 'preset',
  });
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Heading kompas dari sensor perangkat (atau simulasi manual desktop)
  const [heading, setHeading] = useState(0);
  const [sensorActive, setSensorActive] = useState(false);
  const [needsIosPermission, setNeedsIosPermission] = useState(false);
  const alignedHapticFiredRef = useRef(false);

  const qiblaBearing = useMemo(
    () => calculateQiblaBearing(coords.lat, coords.lng),
    [coords.lat, coords.lng]
  );

  const distanceKm = useMemo(
    () => calculateDistanceToKaabaKm(coords.lat, coords.lng),
    [coords.lat, coords.lng]
  );

  const angularDiff = useMemo(
    () => getAngularDifference(heading, qiblaBearing),
    [heading, qiblaBearing]
  );

  const isAligned = Math.abs(angularDiff) <= 5;

  // Trigger subtle haptic buzz once when aligned with Qibla
  useEffect(() => {
    if (isAligned && sensorActive && !alignedHapticFiredRef.current) {
      alignedHapticFiredRef.current = true;
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([30, 40, 30]);
        } catch {}
      }
    } else if (!isAligned) {
      alignedHapticFiredRef.current = false;
    }
  }, [isAligned, sensorActive]);

  const handleOrientation = useCallback((event) => {
    let compassHeading = null;

    // iOS Safari webkitCompassHeading (0 = True North)
    if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
      compassHeading = event.webkitCompassHeading;
    } else if (typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
      // Android Chrome deviceorientationabsolute / deviceorientation
      compassHeading = (360 - event.alpha) % 360;
    }

    if (compassHeading !== null) {
      setHeading(compassHeading);
      setSensorActive(true);
    }
  }, []);

  // Attach DeviceOrientation listeners if supported without explicit iOS gesture
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      setNeedsIosPermission(true);
      return;
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  const requestIosCompassPermission = async () => {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        setNeedsIosPermission(false);
        window.addEventListener('deviceorientation', handleOrientation, true);
        onNotify?.('Sensor kompas berhasil diaktifkan');
      } else {
        onNotify?.('Izin sensor kompas ditolak oleh perangkat');
      }
    } catch {
      onNotify?.('Sensor kompas tidak tersedia pada browser ini');
    }
  };

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Perangkat/browser Anda tidak mendukung Geolocation GPS.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `Lokasi GPS (${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°)`,
          source: 'gps',
        });
        setLocating(false);
        onNotify?.('Lokasi GPS berhasil dideteksi untuk arah Kiblat akurat');
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setGeoError('Izin lokasi ditolak. Anda tetap bisa memilih kota secara manual di bawah.');
        } else {
          setGeoError('Gagal mendapatkan sinyal GPS. Silakan pilih kota manual di bawah.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Dial rotation: rotates opposite to device heading so N points to real North
  const dialRotation = -heading;
  // Relative angle of Ka'bah needle from top of phone
  const relativeQiblaRotation = qiblaBearing - heading;

  const turnHint = isAligned
    ? 'Arah Kiblat Tepat! Menghadap Ka\'bah'
    : angularDiff > 0
    ? `Putar ke kanan ${Math.abs(Math.round(angularDiff))}°`
    : `Putar ke kiri ${Math.abs(Math.round(angularDiff))}°`;

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50">
              <Compass className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              <span>Penanda Kompas Kiblat • Geolocation &amp; Sensor Kompas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kompas Arah Kiblat
            </h1>
            <p className="text-sm text-emerald-50/90">
              Lokasi aktif: <strong className="text-white">{coords.label}</strong> • Jarak ke Ka&apos;bah{' '}
              <strong className="text-gold-200">{distanceKm.toLocaleString('id-ID')} km</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={locating}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gold-500 px-4 text-sm font-bold text-white shadow-md hover:bg-gold-600 disabled:opacity-70 cursor-pointer"
            >
              <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{locating ? 'Mendeteksi GPS...' : 'Gunakan Lokasi GPS'}</span>
            </button>

            {needsIosPermission && (
              <button
                type="button"
                onClick={requestIosCompassPermission}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/30 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                <span>Aktifkan Sensor iOS</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {geoError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-900 dark:border-amber-700/60 dark:bg-[#241A0B] dark:text-amber-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Main Compass & Info Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Interactive Compass Dial */}
        <section className="lg:col-span-7 flex flex-col items-center rounded-3xl border border-emerald-100 bg-white p-6 shadow-soft dark:border-emerald-900/60 dark:bg-surface-dark dark:shadow-soft-dark">
          {/* Alignment Status Pill */}
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
              isAligned
                ? 'bg-emerald-600 text-white shadow-md dark:bg-emerald-400 dark:text-emerald-950'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
            }`}
          >
            {isAligned ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Navigation className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{turnHint}</span>
          </div>

          {/* Phone Top Pointer Indicator */}
          <div
            className={`mb-2 h-3 w-3 rotate-45 rounded-sm transition-colors ${
              isAligned ? 'bg-gold-500' : 'bg-emerald-600 dark:bg-emerald-400'
            }`}
            aria-hidden="true"
          />

          {/* SVG Compass Rose */}
          <div
            className={`relative flex h-[280px] w-[280px] sm:h-[320px] sm:w-[320px] items-center justify-center rounded-full border-4 transition-all duration-300 ${
              isAligned
                ? 'border-gold-400 bg-emerald-50/40 ring-4 ring-gold-400/25 dark:border-gold-400 dark:bg-emerald-950/50'
                : 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-800/80 dark:bg-canvas-dark/60'
            }`}
          >
            {/* Rotating Cardinal Compass Dial (N / E / S / W) */}
            <svg
              viewBox="0 0 300 300"
              className="absolute inset-0 h-full w-full transition-transform duration-150 ease-out"
              style={{ transform: `rotate(${dialRotation}deg)` }}
              aria-hidden="true"
            >
              {/* Tick marks every 15 degrees */}
              {Array.from({ length: 24 }).map((_, i) => {
                const deg = i * 15;
                const isMajor = deg % 90 === 0;
                return (
                  <line
                    key={deg}
                    x1="150"
                    y1={isMajor ? '12' : '16'}
                    x2="150"
                    y2={isMajor ? '28' : '24'}
                    stroke="currentColor"
                    strokeWidth={isMajor ? '3' : '1.5'}
                    className={
                      deg === 0
                        ? 'text-red-500'
                        : isMajor
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-300 dark:text-emerald-900'
                    }
                    transform={`rotate(${deg} 150 150)`}
                  />
                );
              })}

              {/* Cardinal Letters */}
              <text x="150" y="48" textAnchor="middle" className="fill-red-500 text-[18px] font-extrabold">
                U
              </text>
              <text x="258" y="156" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[15px] font-bold">
                T
              </text>
              <text x="150" y="264" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[15px] font-bold">
                S
              </text>
              <text x="42" y="156" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[15px] font-bold">
                B
              </text>
            </svg>

            {/* Rotating Qibla Ka'bah Needle */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out"
              style={{ transform: `rotate(${relativeQiblaRotation}deg)` }}
              aria-hidden="true"
            >
              <div className="relative flex h-full w-full flex-col items-center">
                {/* Ka'bah Marker at Tip */}
                <div className="mt-7 flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gold-400 bg-slate-900 shadow-lg">
                    <span className="block h-1.5 w-full bg-gold-400" />
                  </div>
                  <div className="h-24 w-1.5 rounded-b-full bg-gradient-to-b from-gold-500 to-emerald-600" />
                </div>
              </div>
            </div>

            {/* Center Pivot Hub */}
            <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-emerald-200 bg-white shadow-md dark:border-emerald-800 dark:bg-surface-modal">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kiblat
              </span>
              <span className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                {qiblaBearing.toFixed(1)}°
              </span>
              <span className="text-[10px] font-semibold text-gold-700 dark:text-gold-400">
                {getCardinalDirectionLabel(qiblaBearing)}
              </span>
            </div>
          </div>

          {/* Sensor Status & Manual Calibration Slider (helpful on Desktop without magnetometer) */}
          <div className="mt-6 w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>
                {sensorActive
                  ? 'Sensor Kompas Aktif (Otomatis)'
                  : 'Simulasi Arah Ponsel (Mode Desktop)'}
              </span>
              <span className="tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                Hadap {Math.round(heading)}° ({getCardinalDirectionLabel(heading)})
              </span>
            </div>
            {!sensorActive && (
              <>
                <label htmlFor="qibla-manual-heading" className="sr-only">
                  Simulasi putaran arah kompas
                </label>
                <input
                  id="qibla-manual-heading"
                  type="range"
                  min={0}
                  max={359}
                  value={Math.round(heading)}
                  onChange={(e) => setHeading(Number(e.target.value))}
                  className="quran-slider w-full bg-emerald-100 dark:bg-emerald-950"
                />
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Buka di ponsel untuk rotasi kompas otomatis, atau geser slider di atas untuk menyelaraskan arah Utara/Kiblat.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Right Info & Manual City Coordinates Picker */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Metrics Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Azimuth Kiblat
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                {qiblaBearing.toFixed(1)}°
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dari Utara ({getCardinalDirectionLabel(qiblaBearing)})
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Jarak ke Ka&apos;bah
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-gold-700 dark:text-gold-400">
                {distanceKm.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kilometer (Makkah)
              </p>
            </div>
          </div>

          {/* Manual Indonesian City Selector */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Pilih Kota Manual (Tanpa GPS)</span>
            </h2>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
              {INDONESIAN_QIBLA_CITIES.map((city) => {
                const isSelected = coords.source === 'preset' && coords.label === city.name;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setGeoError('');
                      setCoords({
                        lat: city.lat,
                        lng: city.lng,
                        label: city.name,
                        source: 'preset',
                      });
                    }}
                    className={`flex min-h-[44px] flex-col justify-center rounded-xl border px-3 py-1.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-100'
                        : 'border-emerald-100 bg-emerald-50/20 text-slate-700 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-canvas-dark/50 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate text-xs font-bold">{city.name}</span>
                    <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {city.region}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
