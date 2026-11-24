'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  X,
  RefreshCw,
  AlertCircle,
  Check,
  Compass,
} from 'lucide-react';
import QiblaCompass from '@/components/QiblaCompass';
import { fetchAllIndonesianCities, fetchPrayerSchedule } from '@/lib/api';
import {
  ISLAND_REGIONS,
  JABODETABEK_QUICK_PICKS,
  PRAYER_ITEMS,
  getNextPrayerInfo,
} from '@/lib/regions';

function formatIndonesianDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getPrayerIcon(key) {
  switch (key) {
    case 'imsak':
    case 'subuh':
      return Moon;
    case 'terbit':
    case 'dhuha':
      return Sunrise;
    case 'dzuhur':
    case 'ashar':
      return Sun;
    case 'maghrib':
      return Sunset;
    case 'isya':
    default:
      return Sparkles;
  }
}

export default function PrayerTimesView({ selectedCity, onSelectCity, onNotify }) {
  const [subTab, setSubTab] = useState('jadwal'); // 'jadwal' | 'kiblat'
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [activeRegion, setActiveRegion] = useState('semua');
  const [cityQuery, setCityQuery] = useState('');
  const [showAllFiltered, setShowAllFiltered] = useState(false);

  // Live clock tick every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load full Indonesian city catalog (518 cities/kabupaten)
  useEffect(() => {
    let active = true;
    setCitiesLoading(true);
    fetchAllIndonesianCities()
      .then((list) => {
        if (active) setCities(list);
      })
      .finally(() => {
        if (active) setCitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load prayer schedule for selected city & date
  const loadSchedule = async () => {
    if (!selectedCity?.id) return;
    setScheduleLoading(true);
    setScheduleError('');
    try {
      const data = await fetchPrayerSchedule(selectedCity.id, selectedDate);
      setScheduleData(data);
    } catch (err) {
      setScheduleError(err.message || 'Gagal memuat jadwal shalat');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedCity?.id, selectedDate]);

  // Reset expansion when filter/search changes
  useEffect(() => {
    setShowAllFiltered(false);
  }, [activeRegion, cityQuery]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    return cities.filter((city) => {
      if (activeRegion === 'jabodetabek' && !city.isJabodetabek) return false;
      if (
        activeRegion !== 'semua' &&
        activeRegion !== 'jabodetabek' &&
        city.regionId !== activeRegion
      ) {
        return false;
      }
      if (!q) return true;
      return (
        city.displayName.toLowerCase().includes(q) ||
        city.lokasi.toLowerCase().includes(q) ||
        city.subLabel.toLowerCase().includes(q)
      );
    });
  }, [cities, activeRegion, cityQuery]);

  const visibleCities = showAllFiltered ? filteredCities : filteredCities.slice(0, 24);

  const isToday = isSameDay(selectedDate, now);
  const nextInfo = useMemo(() => {
    if (!isToday || !scheduleData?.jadwal) return null;
    return getNextPrayerInfo(scheduleData.jadwal, now, selectedCity?.offsetHours ?? 7);
  }, [isToday, scheduleData, now, selectedCity?.offsetHours]);

  const shiftDay = (delta) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation: Jadwal Shalat vs Kompas Kiblat */}
      <div
        role="tablist"
        aria-label="Pilihan fitur Shalat dan Kiblat"
        className="inline-flex w-full sm:w-auto rounded-2xl border border-emerald-200/80 bg-white p-1 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'jadwal'}
          onClick={() => setSubTab('jadwal')}
          className={`flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors cursor-pointer ${
            subTab === 'jadwal'
              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
              : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300'
          }`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>Jadwal Shalat</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'kiblat'}
          onClick={() => setSubTab('kiblat')}
          className={`flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors cursor-pointer ${
            subTab === 'kiblat'
              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
              : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300'
          }`}
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span>Kompas Kiblat</span>
        </button>
      </div>

      {subTab === 'kiblat' ? (
        <QiblaCompass onNotify={onNotify} />
      ) : (
        <>
      {/* Hero Banner: Active City, Gregorian Date & Live Countdown */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-gold-400/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              <span>
                {selectedCity.subLabel} • {selectedCity.timezone || 'WIB'} (Kemenag RI)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Jadwal Shalat {selectedCity.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-50/90">
              <Calendar className="h-4 w-4 text-gold-300" aria-hidden="true" />
              <span>{formatIndonesianDate(selectedDate)}</span>
            </div>
          </div>

          {/* Live Next Prayer Countdown Box */}
          <div className="rounded-2xl border border-gold-300/35 bg-white/15 px-5 py-4 backdrop-blur-md md:min-w-[260px]">
            {nextInfo ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gold-200">
                  <span className="uppercase tracking-wider">Menuju {nextInfo.nextLabel}</span>
                  <span className="tabular-nums text-emerald-100">
                    {nextInfo.cityClock} {selectedCity.timezone || 'WIB'}
                  </span>
                </div>
                <p className="text-3xl font-extrabold tracking-tight tabular-nums text-white">
                  -{nextInfo.countdown}
                </p>
                <p className="text-xs text-emerald-100">
                  Waktu {nextInfo.nextLabel}: <strong className="text-white">{nextInfo.nextTime}</strong>{' '}
                  {selectedCity.timezone || 'WIB'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-200">
                  Penanda Tanggal Masehi
                </p>
                <p className="text-base font-bold text-white">
                  {formatIndonesianDate(selectedDate)}
                </p>
                <p className="text-xs text-emerald-100">
                  Zona waktu {selectedCity.timezone || 'WIB'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Switcher Bar */}
        <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              aria-label="Hari sebelumnya"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              disabled={isToday}
              className="min-h-[44px] rounded-xl bg-white/15 px-4 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/25 disabled:opacity-60 disabled:cursor-default cursor-pointer"
            >
              {isToday ? 'Hari Ini' : 'Kembali ke Hari Ini'}
            </button>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              aria-label="Hari berikutnya"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-100">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Sumber resmi jadwal shalat Kemenag RI
          </span>
        </div>
      </section>

      {/* Prayer Times Grid */}
      <section aria-label="Daftar waktu shalat harian">
        {scheduleLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900/50 dark:bg-surface-dark animate-pulse"
              >
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-emerald-900/50" />
                <div className="mt-4 h-7 w-20 rounded bg-emerald-100 dark:bg-emerald-950" />
              </div>
            ))}
          </div>
        ) : scheduleError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/20"
          >
            <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
            <p className="text-sm font-bold text-red-800 dark:text-red-300">{scheduleError}</p>
            <button
              type="button"
              onClick={loadSchedule}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Muat Ulang Jadwal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRAYER_ITEMS.map((item) => {
              const Icon = getPrayerIcon(item.key);
              const timeValue = scheduleData?.jadwal?.[item.key] || '--:--';
              const isNext = nextInfo?.nextKey === item.key && isToday;
              const isCurrent = nextInfo?.currentKey === item.key && isToday;

              return (
                <div
                  key={item.key}
                  className={`relative rounded-2xl border p-4 transition-all ${
                    isNext
                      ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/35 shadow-soft dark:border-amber-400/75 dark:bg-[#241A0B] dark:ring-amber-400/20 dark:shadow-soft-dark'
                      : isCurrent
                      ? 'border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500/25 dark:border-emerald-400/75 dark:bg-emerald-950/80 dark:ring-emerald-400/20'
                      : 'border-emerald-100/90 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isNext
                          ? 'text-amber-800 dark:text-amber-300'
                          : isCurrent
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${
                        isNext
                          ? 'text-amber-600 dark:text-amber-400'
                          : isCurrent
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-emerald-600/80 dark:text-emerald-400/80'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <p
                    className={`mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                      isNext
                        ? 'text-slate-900 dark:text-amber-50'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {timeValue}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold ${
                        isNext
                          ? 'text-amber-800/80 dark:text-amber-200/80'
                          : isCurrent
                          ? 'text-emerald-800/80 dark:text-emerald-200/80'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {selectedCity.timezone || 'WIB'}
                    </span>
                    {isNext && (
                      <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold text-white dark:bg-amber-400 dark:text-slate-950">
                        Berikutnya
                      </span>
                    )}
                    {isCurrent && !isNext && (
                      <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white dark:bg-emerald-400 dark:text-emerald-950">
                        Saat Ini
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bogor & Jabodetabek Quick Selector */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Pilihan Cepat Bogor &amp; Jabodetabek</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {JABODETABEK_QUICK_PICKS.map((city) => {
            const isSelected = selectedCity.id === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => onSelectCity(city)}
                aria-pressed={isSelected}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                    : 'border border-emerald-200/80 bg-emerald-50/40 text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-slate-200 dark:hover:border-emerald-600'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{city.displayName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Full Indonesian Regions Search & Directory */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Seluruh Wilayah Indonesia ({cities.length || '500+'} Kota / Kabupaten)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cari nama kota/kabupaten atau pilih filter pulau di bawah ini
          </p>
        </div>

        {/* City Search Input */}
        <div className="relative">
          <label htmlFor="city-search-input" className="sr-only">
            Cari kota atau kabupaten di Indonesia
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="city-search-input"
            type="search"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Cari kota/kabupaten (contoh: Bogor, Bandung, Medan, Makassar, Jayapura)..."
            className="w-full min-h-[48px] rounded-xl border border-emerald-200/80 bg-emerald-50/30 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-slate-100 dark:focus:border-emerald-400"
          />
          {cityQuery && (
            <button
              type="button"
              onClick={() => setCityQuery('')}
              aria-label="Hapus pencarian kota"
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-emerald-950 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Island Region Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Filter wilayah pulau Indonesia">
          {ISLAND_REGIONS.map((region) => {
            const active = activeRegion === region.id;
            return (
              <button
                key={region.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveRegion(region.id)}
                className={`min-h-[44px] shrink-0 rounded-xl px-3.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                    : 'border border-emerald-200/70 bg-white text-slate-700 hover:border-emerald-400 dark:border-emerald-900/70 dark:bg-canvas-dark dark:text-slate-200'
                }`}
              >
                {region.label}
              </button>
            );
          })}
        </div>

        {/* Cities Grid */}
        {citiesLoading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/50"
              />
            ))}
          </div>
        ) : visibleCities.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Kota &ldquo;{cityQuery}&rdquo; tidak ditemukan pada wilayah ini. Coba pilih &ldquo;Semua Wilayah&rdquo;.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCities.map((city) => {
                const isSelected = selectedCity.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onSelectCity(city)}
                    className={`flex min-h-[52px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-100'
                        : 'border-emerald-100 bg-emerald-50/20 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-canvas-dark/60 dark:text-slate-200 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{city.displayName}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {city.subLabel}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                      {city.timezone}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredCities.length > 24 && !showAllFiltered && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllFiltered(true)}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-emerald-300 bg-emerald-50 px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 cursor-pointer"
                >
                  Tampilkan Semua ({filteredCities.length} Wilayah)
                </button>
              </div>
            )}
          </>
        )}
      </section>
        </>
      )}
    </div>
  );
}
