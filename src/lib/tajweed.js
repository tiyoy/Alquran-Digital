export const TAJWEED_CACHE_KEY = 'aq:tajweed-cache';
export const TAJWEED_CACHE_LIMIT = 3;

// Colors and rule names follow the quran-tajweed edition exposed by AlQuran.cloud.
// Nurani renders explicit source annotations; it does not infer rules from Arabic text.
export const TAJWEED_RULES = Object.freeze([
  { code: "h", label: "Hamzatul wasal", arabicName: "همزة الوصل", colorName: "Abu-abu", recognition: "Hamzah waṣal (ٱ) pada awal kata.", reading: "Saat memulai dari kata itu, lafalkan sesuai harakatnya. Ketika disambung dari kata sebelumnya, hamzah waṣal tidak dibunyikan terpisah.", color: "#AAAAAA" },
  { code: "s", label: "Huruf/tanda silent", arabicName: "", colorName: "Abu-abu", recognition: "Huruf atau tanda yang ditandai “silent” oleh edisi tajwid.", reading: "Ikuti bentuk bacaan mushaf; jangan menambahkan bunyi pada bagian yang ditandai tidak dilafalkan.", color: "#AAAAAA" },
  { code: "l", label: "Lam syamsiyah", arabicName: "لام شمسية", colorName: "Abu-abu", recognition: "Lam pada ال di depan huruf syamsiyah.", reading: "Lam tidak terdengar terpisah; huruf syamsiyah sesudahnya dibaca bertasydid.", color: "#AAAAAA" },
  { code: "n", label: "Mad normal (mad asli)", arabicName: "مد عادي", colorName: "Biru", recognition: "Penanda mad normal pada edisi ini, umumnya berupa huruf mad tanpa sebab mad tambahan.", reading: "Dibaca panjang 2 harakat.", color: "#537FFF" },
  { code: "p", label: "Mad jaiz / mad permissible", arabicName: "مد جائز", colorName: "Biru", recognition: "Bagian yang diberi penanda “madda permissible” oleh edisi quran-tajweed.", reading: "Edisi sumber mencantumkan pilihan 2, 4, atau 6 harakat. Ikuti riwayat dan pedoman mushaf/guru yang digunakan.", color: "#4050FF" },
  { code: "m", label: "Mad lazim (madda necessary)", arabicName: "مد لازم", colorName: "Biru", recognition: "Bagian yang diberi penanda “madda necessary” oleh edisi quran-tajweed.", reading: "Dibaca panjang 6 harakat.", color: "#000EBC" },
  { code: "q", label: "Qalqalah", arabicName: "قلقلة", colorName: "Merah", recognition: "Salah satu huruf ق ط ب ج د ber-sukun.", reading: "Ada pantulan suara ringan pada huruf tersebut. Jangan menambahkan vokal penuh setelahnya.", color: "#DD0008" },
  { code: "o", label: "Mad wajib (madda obligatory)", arabicName: "مد واجب", colorName: "Biru", recognition: "Bagian yang diberi penanda “madda obligatory” oleh edisi quran-tajweed.", reading: "Panduan edisi sumber mencantumkan 4–5 harakat untuk penanda ini. Ikuti riwayat bacaan yang digunakan.", color: "#2144C1" },
  { code: "c", label: "Ikhfa syafawi", arabicName: "إخفاء شفوي", colorName: "Magenta", recognition: "Mim sukun (مْ) bertemu huruf ba (ب).", reading: "Samarkan bunyi mim dengan ghunnah (dengung) sekitar 2 harakat.", color: "#D500B7" },
  { code: "f", label: "Ikhfa haqiqi", arabicName: "إخفاء", colorName: "Ungu", recognition: "Nun sukun (نْ) atau tanwin bertemu salah satu huruf ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك.", reading: "Samarkan bunyi nun/tanwin di antara izhar dan idgham, disertai ghunnah sekitar 2 harakat.", color: "#9400A8" },
  { code: "w", label: "Idgham syafawi", arabicName: "إدغام شفوي", colorName: "Hijau", recognition: "Mim sukun (مْ) bertemu mim (م).", reading: "Gabungkan bunyi mim pertama ke mim berikutnya disertai ghunnah sekitar 2 harakat.", color: "#58B800" },
  { code: "i", label: "Iqlab", arabicName: "إقلاب", colorName: "Biru kehijauan", recognition: "Nun sukun (نْ) atau tanwin bertemu huruf ba (ب).", reading: "Ubah bunyi nun/tanwin menjadi mim samar disertai ghunnah sekitar 2 harakat.", color: "#168AB8" },
  { code: "a", label: "Idgham bighunnah", arabicName: "إدغام بغنة", colorName: "Toska", recognition: "Nun sukun atau tanwin bertemu ي ن م و pada posisi yang berlaku hukum ini.", reading: "Leburkan bunyi nun/tanwin ke huruf berikutnya dengan ghunnah sekitar 2 harakat.", color: "#169777" },
  { code: "u", label: "Idgham bilaghunnah", arabicName: "إدغام بلا غنة", colorName: "Hijau", recognition: "Nun sukun atau tanwin bertemu lam (ل) atau ra (ر).", reading: "Leburkan bunyi nun/tanwin ke huruf berikutnya tanpa ghunnah.", color: "#169200" },
  { code: "d", label: "Idgham mutajanisain", arabicName: "إدغام متجانسين", colorName: "Abu-abu", recognition: "Dua huruf dari makhraj yang sama tetapi berbeda sifat, pada pasangan yang berlaku hukum ini.", reading: "Huruf pertama dilebur ke huruf kedua sesuai kaidah pasangan huruf dan riwayat bacaan.", color: "#A1A1A1" },
  { code: "b", label: "Idgham mutaqaribain", arabicName: "إدغام متقاربين", colorName: "Abu-abu", recognition: "Dua huruf dengan makhraj atau sifat yang berdekatan, pada pasangan yang berlaku hukum ini.", reading: "Huruf pertama dilebur ke huruf kedua sesuai kaidah pasangan huruf dan riwayat bacaan.", color: "#A1A1A1" },
  { code: "g", label: "Ghunnah", arabicName: "غنة", colorName: "Jingga", recognition: "Penanda dengung; sering terlihat pada nun atau mim bertasydid.", reading: "Dengungkan suara melalui rongga hidung selama 2 harakat.", color: "#D76510" },
]);

const TAJWEED_RULE_BY_CODE = Object.freeze(Object.fromEntries(TAJWEED_RULES.map((rule) => [rule.code, rule])));

export function parseTajweedMarkup(value) {
  const text = String(value ?? '');
  if (!text) return [];

  // AlQuran.cloud has used both marker forms: [h:9421[ٱ] and [l[ل].
  // The numeric annotation ID is optional. Convert markers into text segments
  // and React spans; never inject HTML from a remote source.
  const marker = /\[([a-z])(?::\d+)?\[([^\]]*)\]/gi;
  const parts = [];
  let cursor = 0;
  let match;

  while ((match = marker.exec(text)) !== null) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), code: null, rule: null });
    const rule = TAJWEED_RULE_BY_CODE[match[1]] || null;
    // Even if a future edition adds a rule code we do not recognize, keep its
    // Arabic content readable without leaking the annotation syntax.
    if (rule) parts.push({ text: match[2], code: rule.code, rule });
    else parts.push({ text: match[2], code: null, rule: null });
    cursor = marker.lastIndex;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), code: null, rule: null });
  return parts.filter((part) => part.text.length > 0);
}

export function normalizeTajweedAyahs(value) {
  if (!Array.isArray(value)) return [];
  const rows = value.map((row) => ({
    numberInSurah: Number(row?.numberInSurah ?? row?.number_in_surah ?? row?.nomorAyat ?? row?.nomor_ayat),
    text: typeof row?.text === 'string' ? row.text.slice(0, 6000) : typeof row?.teksArab === 'string' ? row.teksArab.slice(0, 6000) : ''
  })).filter((row) => Number.isInteger(row.numberInSurah) && row.numberInSurah >= 1 && row.numberInSurah <= 286 && row.text.trim());
  const unique = new Map();
  rows.forEach((row) => { if (!unique.has(row.numberInSurah)) unique.set(row.numberInSurah, row); });
  return [...unique.values()].sort((a, b) => a.numberInSurah - b.numberInSurah);
}

export function normalizeTajweedCache(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const rows = Object.entries(value).flatMap(([key, item]) => {
    const surahNumber = Number(key);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !item || typeof item !== 'object') return [];
    const ayahs = normalizeTajweedAyahs(item.ayahs);
    if (!ayahs.length) return [];
    return [[String(surahNumber), { ayahs, updatedAt: Number.isFinite(Number(item.updatedAt)) ? Number(item.updatedAt) : 0 }]];
  });
  rows.sort((left, right) => right[1].updatedAt - left[1].updatedAt);
  return Object.fromEntries(rows.slice(0, TAJWEED_CACHE_LIMIT));
}

export function rememberTajweedSurah(cache, surahNumber, ayahs, updatedAt = Date.now()) {
  const number = Number(surahNumber);
  const normalizedAyahs = normalizeTajweedAyahs(ayahs);
  if (!Number.isInteger(number) || number < 1 || number > 114 || !normalizedAyahs.length) return normalizeTajweedCache(cache);
  return normalizeTajweedCache({
    ...normalizeTajweedCache(cache),
    [String(number)]: { ayahs: normalizedAyahs, updatedAt: Number(updatedAt) || Date.now() }
  });
}
