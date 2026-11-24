/**
 * Mesin Tipografi Arab HD (Anti-Box / Anti-Corrupted Glyph)
 * Membersihkan teks Arab Uthmani dari karakter rusak (\uFFFD),
 * zero-width control chars, PUA glyphs, dan orphan combining marks
 * tanpa menghapus huruf hijaiyah atau harakat yang sah.
 */
export function cleanArabicText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    .normalize('NFC')
    // Hapus replacement character (\uFFFD), non-characters, dan object replacement
    .replace(/[\uFFFC\uFFFD\uFFFE\uFFFF]/g, '')
    // Hapus Private Use Area (sering muncul sebagai kotak kosong pada webfont)
    .replace(/[\uE000-\uF8FF]/g, '')
    // Hapus dotted circle (◌) dan karakter kontrol C0/C1
    .replace(/[\u25CC\u0000-\u001F\u007F-\u009F]/g, '')
    // Hapus zero-width & bidirectional control chars yang dapat merusak sambungan huruf Arab
    .replace(/[\u00AD\u061C\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    // Hapus simbol end-of-ayah / rub el hizb bawaan jika ada agar tidak bentrok dengan badge UI
    .replace(/[\u06DD\u06DE]/g, '')
    // Hapus orphan combining marks yang berdiri sendiri di awal teks atau setelah spasi
    .replace(/(^|\s)[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]+/g, '$1')
    // Rapikan spasi berlebih
    .replace(/\s+/g, ' ')
    .trim();
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Mengonversi angka Latin ke angka Arab-Indic (contoh: 12 -> ١٢)
 */
export function toArabicDigits(num) {
  return String(num).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/**
 * Menghapus tag HTML dari deskripsi surah API EQuran.id secara aman
 */
export function stripHtmlToParagraphs(html) {
  if (!html || typeof html !== 'string') return [];
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Chain fallback font Arab HD sesuai PRD
 */
export const ARABIC_FONT_FAMILY =
  "'Amiri Quran', 'Scheherazade New', 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif";
