'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Compass, Info, LocateFixed, MapPin, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react';
import { calculateQiblaBearing, getCompassDirection, normalizeDegrees } from '@/lib/qibla';

function getLocationError(error) {
  if (error?.code === 1) return 'Izin lokasi ditolak. Izinkan lokasi untuk situs Nurani di pengaturan browser, lalu coba lagi.';
  if (error?.code === 2) return 'Lokasi perangkat tidak dapat ditentukan. Pastikan layanan lokasi aktif dan coba lagi.';
  if (error?.code === 3) return 'Pencarian lokasi terlalu lama. Coba lagi di tempat dengan sinyal GPS yang lebih baik.';
  return 'Lokasi belum dapat diperoleh. Pastikan situs dibuka melalui HTTPS dan coba lagi.';
}

function getOrientationPermission() {
  if (typeof window === 'undefined') return Promise.resolve('unsupported');
  const OrientationEvent = window.DeviceOrientationEvent;
  if (!OrientationEvent) return Promise.resolve('unsupported');
  if (typeof OrientationEvent.requestPermission === 'function') {
    // Must be called directly in response to a user gesture (not after awaiting geolocation).
    try { return OrientationEvent.requestPermission(true).catch(() => 'denied'); }
    catch { return Promise.resolve('denied'); }
  }
  return Promise.resolve('available');
}

function getDevicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser ini tidak mendukung layanan lokasi.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    });
  });
}

export default function QiblaFinder({ onBack }) {
  const [position, setPosition] = useState(null);
  const [bearing, setBearing] = useState(null);
  const [heading, setHeading] = useState(null);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [compassStatus, setCompassStatus] = useState('idle');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const listenerAvailableRef = useRef(false);

  const onOrientation = useCallback((event) => {
    let measuredHeading = null;
    // iOS Safari exposes a compass-calibrated heading as a non-standard property.
    if (Number.isFinite(Number(event?.webkitCompassHeading))) {
      measuredHeading = normalizeDegrees(Number(event.webkitCompassHeading));
    } else if (event?.absolute === true && Number.isFinite(Number(event.alpha))) {
      const screenAngle = Number(window.screen?.orientation?.angle ?? window.orientation ?? 0);
      measuredHeading = normalizeDegrees(360 - Number(event.alpha) + screenAngle);
    }
    if (measuredHeading === null) return;
    listenerAvailableRef.current = true;
    setHeading(measuredHeading);
    setCompassStatus('active');
  }, []);

  useEffect(() => {
    if (!compassEnabled) return undefined;
    listenerAvailableRef.current = false;
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
    const timer = window.setTimeout(() => {
      if (!listenerAvailableRef.current) setCompassStatus('unavailable');
    }, 4500);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [compassEnabled, onOrientation]);

  const startQibla = async () => {
    setErrorMessage('');
    setLocating(true);
    // Start both permissions from the same click so browser sensor permission is not
    // requested after transient user activation has expired.
    const compassPermissionPromise = getOrientationPermission();
    try {
      const [compassPermission, geoPosition] = await Promise.all([
        compassPermissionPromise,
        getDevicePosition()
      ]);
      const coords = {
        latitude: geoPosition.coords.latitude,
        longitude: geoPosition.coords.longitude,
        accuracy: Number.isFinite(geoPosition.coords.accuracy) ? geoPosition.coords.accuracy : null
      };
      const qiblaBearing = calculateQiblaBearing(coords.latitude, coords.longitude);
      setPosition(coords);
      setBearing(qiblaBearing);
      setLastUpdatedAt(new Date());
      setHeading(null);
      if (compassPermission === 'available' || compassPermission === 'granted') {
        setCompassStatus('waiting');
        setCompassEnabled(true);
      } else if (compassPermission === 'denied') {
        setCompassStatus('denied');
        setCompassEnabled(false);
      } else {
        setCompassStatus('unsupported');
        setCompassEnabled(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof RangeError ? error.message : getLocationError(error));
      setCompassEnabled(false);
      setCompassStatus('idle');
    } finally {
      setLocating(false);
    }
  };

  const relativeBearing = bearing === null || heading === null ? bearing : normalizeDegrees(bearing - heading);
  const hasResult = bearing !== null && position;
  const compassRoseRotation = heading === null ? 0 : -heading;

  return (
    <div className="page-stack qibla-page">
      <section className="qibla-page-heading">
        <button type="button" className="text-link qibla-back" onClick={onBack}><ArrowLeft size={16} /> Kembali</button>
        <div className="qibla-heading-copy">
          <p className="eyebrow">ALAT IBADAH</p>
          <h1>Arah Kiblat</h1>
          <p className="muted">Temukan arah Ka’bah dari lokasi perangkat Anda.</p>
        </div>
        <div className="qibla-heading-icon"><Compass size={24} /></div>
      </section>

      <section className="qibla-main-card card-surface">
        <div className="qibla-main-top">
          <div><p className="eyebrow">ARAH MENUJU KA’BAH</p><h2>{hasResult ? `${bearing.toFixed(1).replace('.', ',')}°` : 'Siap menentukan arah'}</h2><p>{hasResult ? `Arah ${getCompassDirection(bearing)} dari utara geografis` : 'Izinkan akses lokasi agar Nurani bisa menghitung arah kiblat.'}</p></div>
          <span className={`qibla-status-pill ${compassStatus === 'active' ? 'is-active' : ''}`}><span />{compassStatus === 'active' ? 'Kompas aktif' : hasResult ? 'Bearing dihitung' : 'Belum terhubung'}</span>
        </div>

        <div className={`qibla-compass-stage ${heading !== null ? 'has-live-heading' : ''}`}>
          <div className="qibla-compass-outer"><Compass size={22} /></div>
          <div className="qibla-compass-rose" role="img" style={{ transform: `rotate(${compassRoseRotation}deg)` }} aria-label={heading !== null ? 'Kompas yang mengikuti arah perangkat' : 'Kompas dengan arah kiblat dari utara'}>
            <span className="qibla-cardinal qibla-north">U</span><span className="qibla-cardinal qibla-east">T</span><span className="qibla-cardinal qibla-south">S</span><span className="qibla-cardinal qibla-west">B</span>
            <span className="qibla-tick qibla-tick-one" /><span className="qibla-tick qibla-tick-two" /><span className="qibla-tick qibla-tick-three" /><span className="qibla-tick qibla-tick-four" />
            {bearing !== null && <div className="qibla-needle" style={{ transform: `rotate(${bearing}deg)` }}><span className="qibla-needle-point" /><span className="qibla-needle-stem" /></div>}
            <span className="qibla-compass-center"><span /></span>
          </div>
          <div className="qibla-kaaba-marker"><span>⌂</span><small>Ka’bah</small></div>
        </div>

        {hasResult && <div className="qibla-result-grid"><div><span>Azimuth kiblat</span><strong>{bearing.toFixed(1).replace('.', ',')}°</strong></div><div><span>Arah relatif perangkat</span><strong>{heading === null ? 'Belum tersedia' : `${relativeBearing.toFixed(1).replace('.', ',')}°`}</strong></div><div><span>Akurasi lokasi</span><strong>{position.accuracy === null ? 'Tidak diketahui' : `±${Math.round(position.accuracy)} m`}</strong></div></div>}

        {errorMessage && <div className="qibla-error" role="alert"><Info size={17} /><span>{errorMessage}</span></div>}
        {hasResult && heading === null && <div className="qibla-sensor-note"><Smartphone size={17} /><p>{compassStatus === 'denied' ? 'Izin sensor kompas ditolak. Angka azimuth tetap bisa dipakai sebagai panduan; izinkan sensor arah di browser untuk kompas bergerak.' : compassStatus === 'unsupported' || compassStatus === 'unavailable' ? 'Sensor kompas tidak tersedia atau tidak mengirim data pada browser/perangkat ini. Gunakan azimuth dari utara sebagai panduan manual.' : 'Putar perangkat perlahan untuk mengaktifkan pembacaan kompas. Jika panah tidak bergerak, sensor arah mungkin tidak didukung.'}</p></div>}

        <div className="qibla-actions">
          <button type="button" className="button button-gold qibla-primary-action" onClick={startQibla} disabled={locating}><LocateFixed size={17} />{locating ? 'Mencari lokasi…' : hasResult ? 'Perbarui lokasi & kompas' : 'Gunakan lokasi saya'}</button>
          {hasResult && heading === null && <button type="button" className="button button-secondary" onClick={startQibla} disabled={locating}><RotateCcw size={16} /> Coba kompas lagi</button>}
        </div>
        {lastUpdatedAt && <p className="qibla-updated">Lokasi dihitung {lastUpdatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Koordinat hanya dipakai di sesi ini dan tidak disimpan oleh Nurani.</p>}
      </section>

      <section className="qibla-guidance card-surface">
        <div className="qibla-guidance-icon"><MapPin size={19} /></div>
        <div><strong>Cara menggunakan kompas</strong><ol><li>Buka izin lokasi dan sensor arah saat diminta browser.</li><li>Letakkan ponsel mendatar dan jauhkan dari magnet, speaker, atau benda logam.</li><li>Putar badan/perangkat sampai arah panah menunjuk ke arah kiblat.</li></ol></div>
      </section>
      <p className="qibla-privacy-note"><ShieldCheck size={14} /> Lokasi tidak dikirim ke server atau disimpan di riwayat aplikasi. Kompas dapat dipengaruhi kalibrasi dan gangguan magnet di sekitar perangkat.</p>
    </div>
  );
}
