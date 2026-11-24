/**
 * Mesin Warna Tajwid Digital (Standar Mushaf Al-Qur'an Indonesia)
 * Mengelompokkan segmen teks Arab Uthmani untuk menyorot hukum tajwid utama
 * tanpa memecah ligatur/sambungan huruf Arab (hanya mengubah warna teks).
 */

export const TAJWID_RULES = [
  {
    id: 'ghunnah',
    label: 'Ghunnah',
    desc: 'Nun/Mim bertasydid — dengung 2 harakat',
    lightColor: '#EA580C',
    darkColor: '#FB923C',
  },
  {
    id: 'qalqalah',
    label: 'Qalqalah',
    desc: 'Huruf ق ط ب ج د sukun — pantulan suara',
    lightColor: '#0284C7',
    darkColor: '#38BDF8',
  },
  {
    id: 'ikhfa',
    label: 'Ikhfa',
    desc: 'Nun sukun/tanwin bertemu 15 huruf ikhfa — samar',
    lightColor: '#DC2626',
    darkColor: '#F87171',
  },
  {
    id: 'idgham-bighunnah',
    label: 'Idgham Bighunnah',
    desc: 'Nun sukun/tanwin bertemu ي ن م و — lebur berdengung',
    lightColor: '#9333EA',
    darkColor: '#C084FC',
  },
  {
    id: 'idgham-bilaghunnah',
    label: 'Idgham Bilaghunnah',
    desc: 'Nun sukun/tanwin bertemu ل ر — lebur tanpa dengung',
    lightColor: '#64748B',
    darkColor: '#94A3B8',
  },
  {
    id: 'iqlab',
    label: 'Iqlab',
    desc: 'Nun sukun/tanwin bertemu ب — berubah menjadi mim dengung',
    lightColor: '#0D9488',
    darkColor: '#2DD4BF',
  },
  {
    id: 'mad',
    label: 'Mad Panjang',
    desc: 'Tanda maddah (~) — bacaan panjang 4–6 harakat',
    lightColor: '#4F46E5',
    darkColor: '#818CF8',
  },
];

const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const IDGHAM_BIGHUNNAH = new Set(['ي', 'ن', 'م', 'و']);
const IDGHAM_BILAGHUNNAH = new Set(['ل', 'ر']);
const IKHFA_LETTERS = new Set([
  'ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك',
]);
const TANWIN_MARKS = new Set(['\u064B', '\u064C', '\u064D']); // fathatain, dammatain, kasratain
const SUKUN_MARKS = new Set(['\u0652', '\u06E1']); // standard sukun & Uthmani small high dotless head of khah
const SHADDA = '\u0651';
const MADDAH = '\u0653';
const HARAKAT_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/;
const ARABIC_BASE_LETTER_REGEX = /[\u0621-\u064A\u0671]/;

function isCombiningMark(ch) {
  return HARAKAT_REGEX.test(ch);
}

/**
 * Memecah teks Arab menjadi cluster [huruf dasar + harakatnya] atau spasi/tanda baca
 */
function tokenizeArabicClusters(text) {
  const clusters = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (isCombiningMark(ch) && clusters.length > 0) {
      clusters[clusters.length - 1].marks += ch;
      clusters[clusters.length - 1].raw += ch;
    } else {
      clusters.push({
        base: ch,
        marks: '',
        raw: ch,
        isLetter: ARABIC_BASE_LETTER_REGEX.test(ch),
      });
    }
  }
  return clusters;
}

function findNextLetterIndex(clusters, startIdx) {
  for (let i = startIdx + 1; i < clusters.length; i++) {
    // Lewati spasi atau alif waslah/alif khanjariyah penyerta tanwin (seperti ا setelah fathatain)
    if (clusters[i].base === ' ') continue;
    if (
      clusters[i].base === 'ا' &&
      clusters[i].marks === '' &&
      i + 1 < clusters.length &&
      clusters[i + 1].base === ' '
    ) {
      continue;
    }
    if (clusters[i].isLetter) return i;
  }
  return -1;
}

/**
 * Mengembalikan array segmen `{ text: string, rule: string | null }`
 * yang menggabungkan karakter berurutan dengan hukum tajwid sama agar
 * jumlah DOM node minimal dan ligatur huruf Arab tetap utuh.
 */
export function parseTajwidSegments(text) {
  if (!text) return [];
  const clusters = tokenizeArabicClusters(text);
  const rules = new Array(clusters.length).fill(null);

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (!c.isLetter) continue;

    const hasShadda = c.marks.includes(SHADDA);
    const hasMaddah = c.marks.includes(MADDAH);
    const hasSukun = [...c.marks].some((m) => SUKUN_MARKS.has(m));
    const hasTanwin = [...c.marks].some((m) => TANWIN_MARKS.has(m));
    // Nun Uthmani sukun terkadang ditulis tanpa harakat sama sekali sebelum huruf idgham/ikhfa
    const isBareNun = c.base === 'ن' && c.marks === '';
    const isNunSukunOrTanwin = (c.base === 'ن' && (hasSukun || isBareNun)) || hasTanwin;

    // 1. Mad Panjang (Maddah ~)
    if (hasMaddah) {
      rules[i] = 'mad';
      continue;
    }

    // 2. Ghunnah (Nun/Mim bertasydid)
    if ((c.base === 'ن' || c.base === 'م') && hasShadda) {
      rules[i] = 'ghunnah';
      continue;
    }

    // 3. Hukum Nun Sukun / Tanwin
    if (isNunSukunOrTanwin) {
      const nextIdx = findNextLetterIndex(clusters, i);
      if (nextIdx !== -1) {
        const nextLetter = clusters[nextIdx].base;
        if (nextLetter === 'ب') {
          rules[i] = 'iqlab';
          continue;
        }
        if (IDGHAM_BIGHUNNAH.has(nextLetter)) {
          rules[i] = 'idgham-bighunnah';
          continue;
        }
        if (IDGHAM_BILAGHUNNAH.has(nextLetter)) {
          rules[i] = 'idgham-bilaghunnah';
          continue;
        }
        if (IKHFA_LETTERS.has(nextLetter)) {
          rules[i] = 'ikhfa';
          continue;
        }
      }
    }

    // 4. Qalqalah (huruf ق ط ب ج د bersukun)
    if (QALQALAH_LETTERS.has(c.base) && hasSukun) {
      rules[i] = 'qalqalah';
    }
  }

  // Gabungkan segmen berurutan yang memiliki rule sama
  const segments = [];
  for (let i = 0; i < clusters.length; i++) {
    const rule = rules[i];
    const prev = segments[segments.length - 1];
    if (prev && prev.rule === rule) {
      prev.text += clusters[i].raw;
    } else {
      segments.push({ text: clusters[i].raw, rule });
    }
  }
  return segments;
}
