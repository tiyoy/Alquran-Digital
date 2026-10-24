import { cleanArabicText } from '@/lib/api';

function readDuaText(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(readDuaText).filter(Boolean).join(' ');
  if (!value || typeof value !== 'object') return '';
  for (const key of ['text', 'teks', 'value', 'content', 'id_ID', 'indonesia', 'arab', 'arabic', 'latin', 'arti', 'translation', 'meaning']) {
    const text = readDuaText(value[key]);
    if (text) return text;
  }
  return '';
}

function firstDuaText(...values) {
  for (const value of values) {
    const text = readDuaText(value);
    if (text && !/^(?:konten|data|bacaan|terjemahan)\s+(?:tidak|belum)\s+tersedia\b/i.test(text) && !/^[-–—]+$/.test(text)) return text;
  }
  return '';
}

function firstArabicDuaText(...values) {
  for (const value of values) {
    const text = firstDuaText(value);
    if (text && /[\u0600-\u06FF]/.test(text)) return cleanArabicText(text);
  }
  return '';
}

export function normalizeDua(item, index) {
  const d = item || {};
  const text = d.text && typeof d.text === 'object' ? d.text : {};
  const content = d.content && typeof d.content === 'object' ? d.content : {};
  const konten = d.konten && typeof d.konten === 'object' ? d.konten : {};
  const bacaan = d.bacaan && typeof d.bacaan === 'object' ? d.bacaan : {};
  const arab = firstArabicDuaText(
    d.arab, d.arabic, d.arabicText, d.arabic_text, d.arab_text, d.text_ar, d.teksArab, d.teks_arab,
    d.teksArabic, d.textArabic, d.text_arab, d.lafaz, d.lafadz, d.lafadz_arab, d.bacaanArab,
    d.bacaan_arab, d.doaArab, d.doa_arab, text.arab, text.arabic, content.arab,
    content.arabic, konten.arab, konten.arabic, bacaan.arab, bacaan.arabic, d.teks, d.isi, d.konten, d.bacaan, d.doa
  );
  return {
    id: d.id ?? d.nomor ?? d.no ?? d.nomorDoa ?? d.nomor_doa ?? index + 1,
    judul: firstDuaText(d.judul, d.title, d.nama, d.name, d.title_id, d.judulDoa, d.judul_doa, d.namaDoa, d.nama_doa, d.doa_name, d.label) || `Doa ${index + 1}`,
    arab,
    latin: firstDuaText(
      d.latin, d.teksLatin, d.teks_latin, d.transliterasi, d.transliteration,
      d.latinText, d.latin_text, d.text_latin, d.transliterasi_latin, d.bacaanLatin, d.bacaan_latin, text.latin,
      content.latin, konten.latin, bacaan.latin, d.reading
    ),
    terjemah: firstDuaText(
      d.terjemah, d.arti, d.terjemahan, d.teksIndonesia, d.teks_indonesia,
      d.teks_indo, d.text_indonesia, d.translation, d.translation_id, d.translation_text, d.text_translation, d.indonesia, d.indonesian,
      d.makna, d.meaning, d.meaning_id, d.arti_id, d.artinya, d.text_id, d.terjemahan_id,
      text.indonesia, text.id, text.translation, content.indonesia,
      content.translation, konten.indonesia, konten.translation, bacaan.terjemah, d.isiTerjemahan, d.isi_terjemahan
    ),
    sumber: firstDuaText(d.sumber, d.referensi, d.source, d.reference, d.sumberHadis, d.sumber_hadits, d.hadits, d.hadis),
    grup: firstDuaText(d.grup, d.kategori, d.category, d.kategoriNama, d.category_name) || 'Doa harian',
    tags: Array.isArray(d.tags) ? d.tags : Array.isArray(d.tag) ? d.tag : []
  };
}

export function isUsableDua(dua) {
  const validText = (value) => Boolean(value && !/^(?:konten|data|bacaan|terjemahan)\s+(?:tidak|belum)\s+tersedia\b/i.test(value.trim()) && !/^[-–—]+$/.test(value.trim()));
  return Boolean(
    (validText(dua?.arab) && /[\u0600-\u06FF]/.test(dua.arab)) ||
    validText(dua?.latin) || validText(dua?.terjemah)
  );
}

export function extractDuaRows(payload) {
  const keys = ['doa', 'doas', 'duas', 'items', 'list', 'results', 'result', 'data', 'daftar', 'dzikir', 'prayers', 'records'];
  const visited = new Set();
  function walk(value, depth = 0) {
    if (!value || depth > 6 || typeof value !== 'object' || visited.has(value)) return [];
    visited.add(value);
    if (Array.isArray(value)) {
      return value.some((item) => item && typeof item === 'object' && !Array.isArray(item)) ? value : [];
    }
    for (const key of keys) {
      if (value[key] && typeof value[key] === 'object') {
        const rows = walk(value[key], depth + 1);
        if (rows.length) return rows;
      }
    }
    for (const nested of Object.values(value)) {
      if (nested && typeof nested === 'object') {
        const rows = walk(nested, depth + 1);
        if (rows.length) return rows;
      }
    }
    return [];
  }
  return Array.isArray(payload) ? payload : walk(payload);
}
