/**
 * Mesin Warna Tajwid Digital (Standar Mushaf Al-Qur'an Indonesia)
 * Mengelompokkan segmen teks Arab Uthmani untuk menyorot hukum tajwid utama
 * beserta detail jenis, hukum, dan cara baca tanpa memecah ligatur/sambungan huruf Arab.
 */

export const TAJWID_RULES = [
  {
    id: 'ghunnah',
    label: 'Ghunnah',
    jenis: 'Hukum Nun & Mim Bertasydid',
    hukum: 'Ghunnah Musyaddadah',
    desc: 'Nun/Mim bertasydid — dengung 2 harakat',
    caraBaca:
      'Dibaca berdengung jelas melalui rongga hidung (khaisyum) dengan menahan suara selama 2 harakat.',
    tempo: '2 harakat (dengung)',
    lightColor: '#EA580C',
    darkColor: '#FB923C',
  },
  {
    id: 'qalqalah',
    label: 'Qalqalah',
    jenis: 'Hukum Qalqalah',
    hukum: 'Qalqalah (Sugra / Kubra)',
    desc: 'Huruf ق ط ب ج د sukun — pantulan suara',
    caraBaca:
      'Huruf dipantulkan dengan getaran suara yang jelas tanpa menambah harakat baru (ringan di tengah kata, lebih kuat di akhir ayat/waqaf).',
    tempo: 'Pantulan suara',
    lightColor: '#0284C7',
    darkColor: '#38BDF8',
  },
  {
    id: 'ikhfa',
    label: 'Ikhfa',
    jenis: 'Hukum Nun Sukun & Tanwin',
    hukum: 'Ikhfa Haqiqi',
    desc: 'Nun sukun/tanwin bertemu 15 huruf ikhfa — samar',
    caraBaca:
      'Suara nun sukun/tanwin dibaca samar-samar antara jelas (idzhar) dan lebur (idgham) disertai dengung 2 harakat sambil bersiap menuju makhraj huruf berikutnya.',
    tempo: '2 harakat (samar berdengung)',
    lightColor: '#DC2626',
    darkColor: '#F87171',
  },
  {
    id: 'idgham-bighunnah',
    label: 'Idgham Bighunnah',
    jenis: 'Hukum Nun Sukun & Tanwin',
    hukum: 'Idgham Bighunnah',
    desc: 'Nun sukun/tanwin bertemu ي ن م و — lebur berdengung',
    caraBaca:
      'Suara nun sukun/tanwin dileburkan (dimasukkan) ke huruf berikutnya disertai dengung yang jelas melalui hidung selama 2 harakat.',
    tempo: '2 harakat (lebur berdengung)',
    lightColor: '#9333EA',
    darkColor: '#C084FC',
  },
  {
    id: 'idgham-bilaghunnah',
    label: 'Idgham Bilaghunnah',
    jenis: 'Hukum Nun Sukun & Tanwin',
    hukum: 'Idgham Bilaghunnah',
    desc: 'Nun sukun/tanwin bertemu ل ر — lebur tanpa dengung',
    caraBaca:
      'Suara nun sukun/tanwin dileburkan sepenuhnya ke huruf Lam (ل) atau Ra (ر) di depannya secara langsung tanpa dengung.',
    tempo: 'Tanpa dengung',
    lightColor: '#64748B',
    darkColor: '#94A3B8',
  },
  {
    id: 'iqlab',
    label: 'Iqlab',
    jenis: 'Hukum Nun Sukun & Tanwin',
    hukum: 'Iqlab',
    desc: 'Nun sukun/tanwin bertemu ب — berubah menjadi mim dengung',
    caraBaca:
      'Suara nun sukun/tanwin diubah menjadi bunyi huruf Mim (م) yang samar (kedua bibir merapat ringan tanpa ditekan kuat) disertai dengung 2 harakat.',
    tempo: '2 harakat (berubah jadi mim)',
    lightColor: '#0D9488',
    darkColor: '#2DD4BF',
  },
  {
    id: 'mad',
    label: 'Mad Panjang',
    jenis: 'Hukum Mad',
    hukum: "Mad Far'i (Mad Panjang)",
    desc: 'Tanda maddah (~) — bacaan panjang 4–6 harakat',
    caraBaca:
      'Dipanjangkan bacaannya selama 4 hingga 5 harakat (Mad Wajib Muttashil / Jaiz Munfashil) atau 6 harakat (Mad Lazim) dengan suara stabil.',
    tempo: '4–6 harakat',
    lightColor: '#4F46E5',
    darkColor: '#818CF8',
  },
];

const TAJWID_RULE_MAP = new Map(TAJWID_RULES.map((rule) => [rule.id, rule]));

export function getTajwidRuleById(ruleId) {
  if (!ruleId) return null;
  return TAJWID_RULE_MAP.get(ruleId) || null;
}

const ARABIC_LETTER_NAMES = {
  ا: 'Alif',
  ب: 'Ba',
  ت: 'Ta',
  ث: 'Tsa',
  ج: 'Jim',
  ح: 'Ha',
  خ: 'Kha',
  د: 'Dal',
  ذ: 'Dzal',
  ر: 'Ra',
  ز: 'Zai',
  س: 'Sin',
  ش: 'Syin',
  ص: 'Shad',
  ض: 'Dhad',
  ط: 'Tha',
  ظ: 'Zha',
  ع: 'Ain',
  غ: 'Ghain',
  ف: 'Fa',
  ق: 'Qaf',
  ك: 'Kaf',
  ل: 'Lam',
  م: 'Mim',
  ن: 'Nun',
  ه: 'Ha',
  و: 'Waw',
  ي: 'Ya',
  ء: 'Hamzah',
};

function formatArabicLetter(letter) {
  const name = ARABIC_LETTER_NAMES[letter];
  return name ? `${letter} (${name})` : letter;
}

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

function buildRuleDetail(ruleId, context = {}) {
  const baseRule = getTajwidRuleById(ruleId);
  if (!baseRule) return null;

  if (ruleId === 'ghunnah') {
    const letterLabel =
      context.letter === 'م' ? 'Mim bertasydid (مّ)' : 'Nun bertasydid (نّ)';
    return {
      jenis: baseRule.jenis,
      hukum: baseRule.hukum,
      triggerText: `Huruf ${letterLabel}`,
      caraBaca: baseRule.caraBaca,
      tempo: baseRule.tempo,
    };
  }

  if (ruleId === 'qalqalah') {
    const isKubra = Boolean(context.isEndOfAyah);
    const letterLabel = formatArabicLetter(context.letter || '');
    return {
      jenis: baseRule.jenis,
      hukum: isKubra ? 'Qalqalah Kubra' : 'Qalqalah Sugra',
      triggerText: isKubra
        ? `Huruf ${letterLabel} sukun di akhir ayat/waqaf`
        : `Huruf ${letterLabel} sukun di tengah bacaan`,
      caraBaca: isKubra
        ? 'Dibaca dengan pantulan suara yang kuat dan jelas karena berada di akhir bacaan/waqaf.'
        : 'Dibaca dengan pantulan suara ringan dan mengalir tanpa terhenti saat melanjutkan ke huruf berikutnya.',
      tempo: isKubra ? 'Pantulan kuat' : 'Pantulan ringan',
    };
  }

  if (
    ruleId === 'ikhfa' ||
    ruleId === 'idgham-bighunnah' ||
    ruleId === 'idgham-bilaghunnah' ||
    ruleId === 'iqlab'
  ) {
    const sourceLabel = context.hasTanwin ? 'Tanwin' : 'Nun sukun (نْ)';
    const nextLabel = formatArabicLetter(context.nextLetter || '');
    return {
      jenis: baseRule.jenis,
      hukum: baseRule.hukum,
      triggerText: `${sourceLabel} bertemu huruf ${nextLabel}`,
      caraBaca: baseRule.caraBaca,
      tempo: baseRule.tempo,
    };
  }

  if (ruleId === 'mad') {
    return {
      jenis: baseRule.jenis,
      hukum: baseRule.hukum,
      triggerText: 'Huruf bertanda maddah (~)',
      caraBaca: baseRule.caraBaca,
      tempo: baseRule.tempo,
    };
  }

  return {
    jenis: baseRule.jenis,
    hukum: baseRule.hukum,
    triggerText: baseRule.desc,
    caraBaca: baseRule.caraBaca,
    tempo: baseRule.tempo,
  };
}

/**
 * Mengembalikan array segmen `{ text: string, rule: string | null, detail: object | null }`
 * yang menggabungkan karakter berurutan dengan hukum & konteks tajwid sama agar
 * jumlah DOM node minimal dan ligatur huruf Arab tetap utuh.
 */
export function parseTajwidSegments(text) {
  if (!text) return [];
  const clusters = tokenizeArabicClusters(text);
  const entries = new Array(clusters.length).fill(null);

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
      entries[i] = {
        rule: 'mad',
        key: 'mad',
        detail: buildRuleDetail('mad'),
      };
      continue;
    }

    // 2. Ghunnah (Nun/Mim bertasydid)
    if ((c.base === 'ن' || c.base === 'م') && hasShadda) {
      entries[i] = {
        rule: 'ghunnah',
        key: `ghunnah:${c.base}`,
        detail: buildRuleDetail('ghunnah', { letter: c.base }),
      };
      continue;
    }

    // 3. Hukum Nun Sukun / Tanwin
    if (isNunSukunOrTanwin) {
      const nextIdx = findNextLetterIndex(clusters, i);
      if (nextIdx !== -1) {
        const nextLetter = clusters[nextIdx].base;
        let matchedRule = null;
        if (nextLetter === 'ب') {
          matchedRule = 'iqlab';
        } else if (IDGHAM_BIGHUNNAH.has(nextLetter)) {
          matchedRule = 'idgham-bighunnah';
        } else if (IDGHAM_BILAGHUNNAH.has(nextLetter)) {
          matchedRule = 'idgham-bilaghunnah';
        } else if (IKHFA_LETTERS.has(nextLetter)) {
          matchedRule = 'ikhfa';
        }
        if (matchedRule) {
          entries[i] = {
            rule: matchedRule,
            key: `${matchedRule}:${hasTanwin ? 'tanwin' : 'nun'}:${nextLetter}`,
            detail: buildRuleDetail(matchedRule, { hasTanwin, nextLetter }),
          };
          continue;
        }
      }
    }

    // 4. Qalqalah (huruf ق ط ب ج د bersukun)
    if (QALQALAH_LETTERS.has(c.base) && hasSukun) {
      const isEndOfAyah = findNextLetterIndex(clusters, i) === -1;
      entries[i] = {
        rule: 'qalqalah',
        key: `qalqalah:${c.base}:${isEndOfAyah ? 'kubra' : 'sugra'}`,
        detail: buildRuleDetail('qalqalah', { letter: c.base, isEndOfAyah }),
      };
    }
  }

  // Gabungkan segmen berurutan yang memiliki rule & detail sama
  const segments = [];
  for (let i = 0; i < clusters.length; i++) {
    const entry = entries[i];
    const rule = entry ? entry.rule : null;
    const key = entry ? entry.key : null;
    const prev = segments[segments.length - 1];
    if (prev && prev._key === key) {
      prev.text += clusters[i].raw;
    } else {
      segments.push({
        text: clusters[i].raw,
        rule,
        detail: entry ? entry.detail : null,
        _key: key,
      });
    }
  }

  return segments.map(({ text: segText, rule, detail }) => ({
    text: segText,
    rule,
    detail,
  }));
}
