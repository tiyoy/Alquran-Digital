import { NextResponse } from 'next/server';

export const revalidate = 86400;
const QURAN_TAJWEED_BASE = 'https://api.alquran.cloud/v1/surah';

export async function GET(_request, context) {
  const params = await context.params;
  const surahNumber = Number(params?.surah);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ ok: false, message: 'Nomor surah tidak valid.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${QURAN_TAJWEED_BASE}/${surahNumber}/quran-tajweed`, {
      next: { revalidate: 86400, tags: [`tajweed-surah-${surahNumber}`] },
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, message: 'Sumber warna tajwid belum dapat diakses.' }, { status: 502 });
    }

    const payload = await response.json();
    const data = payload?.data;
    const rawAyahs = Array.isArray(data?.ayahs) ? data.ayahs : Array.isArray(data?.verses) ? data.verses : [];
    if ((payload?.code !== 200 && payload?.status !== 'OK') || !rawAyahs.length) {
      return NextResponse.json({ ok: false, message: 'Data warna tajwid belum tersedia.' }, { status: 502 });
    }

    const ayahs = rawAyahs.map((ayah) => ({
      numberInSurah: Number(ayah?.numberInSurah ?? ayah?.number_in_surah),
      text: typeof ayah?.text === 'string' ? ayah.text.slice(0, 6000) : ''
    })).filter((ayah) => Number.isInteger(ayah.numberInSurah) && ayah.numberInSurah >= 1 && ayah.numberInSurah <= 286 && ayah.text.trim());

    if (!ayahs.length) {
      return NextResponse.json({ ok: false, message: 'Format data warna tajwid tidak dikenali.' }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      surahNumber,
      edition: 'quran-tajweed',
      source: 'AlQuran.cloud / Islamic Network',
      ayahs
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch {
    return NextResponse.json({ ok: false, message: 'Tidak dapat memuat data tajwid. Periksa koneksi internet lalu coba lagi.' }, { status: 502 });
  }
}
