import { fallbackSurahs } from '@/lib/data';
import { QURAN_SEARCH_MODES, mergeQuranSearchResponses, normalizeSearchText } from '@/lib/quran-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE = 'https://api.alquran.cloud/v1';
const SEARCH_EDITIONS = {
  arabic: 'quran-simple-clean',
  translation: 'id.indonesian',
  latin: 'en.transliteration'
};

async function searchEdition(query, surah, field) {
  const edition = SEARCH_EDITIONS[field];
  // The simple-clean Arabic edition omits harakat; normalize a user's marked Arabic query
  // for this source only, while leaving the original query for Indonesian/Latin editions.
  const sourceQuery = field === 'arabic' ? normalizeSearchText(query, 'arabic') : query;
  const url = `${API_BASE}/search/${encodeURIComponent(sourceQuery)}/${surah}/${edition}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`Sumber ${field} merespons ${response.status}`);
  const payload = await response.json();
  if (payload?.code && Number(payload.code) !== 200) throw new Error(`Sumber ${field} tidak berhasil memproses pencarian`);
  return { field, payload };
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const query = Array.from(String(params.get('q') || '').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').trim()).slice(0, 80).join('');
  const mode = QURAN_SEARCH_MODES[params.get('type')] ? params.get('type') : 'all';
  const rawSurah = params.get('surah') || 'all';
  const surah = rawSurah === 'all' ? 'all' : String(Number(rawSurah));

  if (query.length < 2) return Response.json({ ok: false, message: 'Masukkan minimal 2 karakter untuk mencari ayat.' }, { status: 400 });
  if (rawSurah !== 'all' && (!/^\d{1,3}$/.test(rawSurah) || Number(rawSurah) < 1 || Number(rawSurah) > 114)) {
    return Response.json({ ok: false, message: 'Filter surah tidak valid.' }, { status: 400 });
  }

  const fields = QURAN_SEARCH_MODES[mode].fields;
  const settled = await Promise.allSettled(fields.map((field) => searchEdition(query, surah, field)));
  const sourceResponses = settled.filter((item) => item.status === 'fulfilled').map((item) => ({ ...item.value, surahFilter: rawSurah }));
  const failedSources = settled.map((item, index) => item.status === 'rejected' ? fields[index] : null).filter(Boolean);

  if (!sourceResponses.length) {
    return Response.json({
      ok: false,
      message: 'Sumber pencarian sedang tidak dapat dijangkau. Periksa koneksi internet lalu coba lagi.',
      results: [],
      failedSources
    }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }

  const results = mergeQuranSearchResponses(sourceResponses, fallbackSurahs);
  return Response.json({
    ok: true,
    query,
    type: mode,
    results,
    partial: failedSources.length > 0,
    failedSources,
    sources: sourceResponses.map((source) => source.field)
  }, { headers: { 'Cache-Control': 'no-store' } });
}
