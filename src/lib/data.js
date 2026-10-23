// Offline-friendly display metadata. Live Quran text is retrieved from EQuran.id.
const surahRows = [
['Al-Fatihah','Pembukaan',7,'الفاتحة'],['Al-Baqarah','Sapi Betina',286,'البقرة'],['Ali ‘Imran','Keluarga Imran',200,'آل عمران'],['An-Nisa','Wanita',176,'النساء'],['Al-Ma’idah','Hidangan',120,'المائدة'],['Al-An’am','Hewan Ternak',165,'الأنعام'],['Al-A’raf','Tempat Tertinggi',206,'الأعراف'],['Al-Anfal','Rampasan Perang',75,'الأنفال'],['At-Taubah','Pengampunan',129,'التوبة'],['Yunus','Nabi Yunus',109,'يونس'],['Hud','Nabi Hud',123,'هود'],['Yusuf','Nabi Yusuf',111,'يوسف'],['Ar-Ra’d','Guruh',43,'الرعد'],['Ibrahim','Nabi Ibrahim',52,'ابراهيم'],['Al-Hijr','Bukit Hijr',99,'الحجر'],['An-Nahl','Lebah',128,'النحل'],['Al-Isra','Perjalanan Malam',111,'الإسراء'],['Al-Kahf','Gua',110,'الكهف'],['Maryam','Maryam',98,'مريم'],['Taha','Taha',135,'طه'],['Al-Anbiya','Para Nabi',112,'الأنبياء'],['Al-Hajj','Haji',78,'الحج'],['Al-Mu’minun','Orang-Orang Mukmin',118,'المؤمنون'],['An-Nur','Cahaya',64,'النور'],['Al-Furqan','Pembeda',77,'الفرقان'],['Asy-Syu’ara','Para Penyair',227,'الشعراء'],['An-Naml','Semut',93,'النمل'],['Al-Qasas','Kisah-Kisah',88,'القصص'],['Al-‘Ankabut','Laba-Laba',69,'العنكبوت'],['Ar-Rum','Bangsa Romawi',60,'الروم'],['Luqman','Luqman',34,'لقمان'],['As-Sajdah','Sujud',30,'السجدة'],['Al-Ahzab','Golongan yang Bersekutu',73,'الأحزاب'],['Saba','Kaum Saba',54,'سبأ'],['Fatir','Maha Pencipta',45,'فاطر'],['Yasin','Yasin',83,'يس'],['As-Saffat','Barisan-Barisan',182,'الصافات'],['Sad','Sad',88,'ص'],['Az-Zumar','Rombongan',75,'الزمر'],['Ghafir','Maha Pengampun',85,'غافر'],['Fussilat','Yang Dijelaskan',54,'فصلت'],['Asy-Syura','Musyawarah',53,'الشورى'],['Az-Zukhruf','Perhiasan',89,'الزخرف'],['Ad-Dukhan','Kabut',59,'الدخان'],['Al-Jasiyah','Yang Berlutut',37,'الجاثية'],['Al-Ahqaf','Bukit Pasir',35,'الأحقاف'],['Muhammad','Nabi Muhammad',38,'محمد'],['Al-Fath','Kemenangan',29,'الفتح'],['Al-Hujurat','Kamar-Kamar',18,'الحجرات'],['Qaf','Qaf',45,'ق'],['Az-Zariyat','Angin yang Menerbangkan',60,'الذاريات'],['At-Tur','Bukit',49,'الطور'],['An-Najm','Bintang',62,'النجم'],['Al-Qamar','Bulan',55,'القمر'],['Ar-Rahman','Maha Pengasih',78,'الرحمن'],['Al-Waqi’ah','Hari Kiamat',96,'الواقعة'],['Al-Hadid','Besi',29,'الحديد'],['Al-Mujadilah','Gugatan',22,'المجادلة'],['Al-Hasyr','Pengusiran',24,'الحشر'],['Al-Mumtahanah','Perempuan yang Diuji',13,'الممتحنة'],['As-Saff','Barisan',14,'الصف'],['Al-Jumu’ah','Hari Jumat',11,'الجمعة'],['Al-Munafiqun','Orang-Orang Munafik',11,'المنافقون'],['At-Tagabun','Hari Dinampakkan Kesalahan',18,'التغابن'],['At-Talaq','Talak',12,'الطلاق'],['At-Tahrim','Mengharamkan',12,'التحريم'],['Al-Mulk','Kerajaan',30,'الملك'],['Al-Qalam','Pena',52,'القلم'],['Al-Haqqah','Hari Kiamat',52,'الحاقة'],['Al-Ma’arij','Tempat-Tempat Naik',44,'المعارج'],['Nuh','Nabi Nuh',28,'نوح'],['Al-Jinn','Jin',28,'الجن'],['Al-Muzzammil','Orang yang Berselimut',20,'المزمل'],['Al-Muddassir','Orang yang Berkemul',56,'المدثر'],['Al-Qiyamah','Hari Kiamat',40,'القيامة'],['Al-Insan','Manusia',31,'الإنسان'],['Al-Mursalat','Malaikat yang Diutus',50,'المرسلات'],['An-Naba','Berita Besar',40,'النبأ'],['An-Nazi’at','Malaikat yang Mencabut',46,'النازعات'],['‘Abasa','Ia Bermuka Masam',42,'عبس'],['At-Takwir','Menggulung',29,'التكوير'],['Al-Infitar','Terbelah',19,'الإنفطار'],['Al-Mutaffifin','Orang yang Curang',36,'المطففين'],['Al-Insyiqaq','Terbelah',25,'الإنشقاق'],['Al-Buruj','Gugusan Bintang',22,'البروج'],['At-Tariq','Yang Datang pada Malam Hari',17,'الطارق'],['Al-A’la','Yang Paling Tinggi',19,'الأعلى'],['Al-Gasyiyah','Hari Pembalasan',26,'الغاشية'],['Al-Fajr','Fajar',30,'الفجر'],['Al-Balad','Negeri',20,'البلد'],['Asy-Syams','Matahari',15,'الشمس'],['Al-Lail','Malam',21,'الليل'],['Ad-Duha','Waktu Duha',11,'الضحى'],['Asy-Syarh','Kelapangan',8,'الشرح'],['At-Tin','Buah Tin',8,'التين'],['Al-‘Alaq','Segumpal Darah',19,'العلق'],['Al-Qadr','Kemuliaan',5,'القدر'],['Al-Bayyinah','Bukti Nyata',8,'البينة'],['Az-Zalzalah','Kegoncangan',8,'الزلزلة'],['Al-‘Adiyat','Kuda Perang yang Berlari Kencang',11,'العاديات'],['Al-Qari’ah','Hari Kiamat',11,'القارعة'],['At-Takasur','Bermegah-Megahan',8,'التكاثر'],['Al-‘Asr','Masa',3,'العصر'],['Al-Humazah','Pengumpat',9,'الهمزة'],['Al-Fil','Gajah',5,'الفيل'],['Quraisy','Suku Quraisy',4,'قريش'],['Al-Ma’un','Barang yang Berguna',7,'الماعون'],['Al-Kausar','Nikmat yang Berlimpah',3,'الكوثر'],['Al-Kafirun','Orang-Orang Kafir',6,'الكافرون'],['An-Nasr','Pertolongan',3,'النصر'],['Al-Lahab','Gejolak Api',5,'المسد'],['Al-Ikhlas','Ikhlas',4,'الإخلاص'],['Al-Falaq','Waktu Subuh',5,'الفلق'],['An-Nas','Manusia',6,'الناس']
];

const madani = new Set([2,3,4,5,8,9,13,22,24,33,47,48,49,57,58,59,60,61,62,63,64,65,66,76,98,110]);
export const fallbackSurahs = surahRows.map((r, i) => ({
  nomor: i + 1, namaLatin: r[0], arti: r[1], jumlahAyat: r[2], nama: r[3],
  tempatTurun: madani.has(i + 1) ? 'Madinah' : 'Mekah'
}));

const asmaRows = [
['Ar-Rahman','الرَّحْمَٰنُ','Maha Pengasih'],['Ar-Rahim','الرَّحِيمُ','Maha Penyayang'],['Al-Malik','الْمَلِكُ','Maha Merajai'],['Al-Quddus','الْقُدُّوسُ','Maha Suci'],['As-Salam','السَّلَامُ','Maha Memberi Kesejahteraan'],['Al-Mu’min','الْمُؤْمِنُ','Maha Memberi Keamanan'],['Al-Muhaymin','الْمُهَيْمِنُ','Maha Memelihara'],['Al-Aziz','الْعَزِيزُ','Maha Perkasa'],['Al-Jabbar','الْجَبَّارُ','Maha Kuasa'],['Al-Mutakabbir','الْمُتَكَبِّرُ','Maha Megah'],['Al-Khaliq','الْخَالِقُ','Maha Pencipta'],['Al-Bari','الْبَارِئُ','Maha Mengadakan'],['Al-Musawwir','الْمُصَوِّرُ','Maha Membentuk Rupa'],['Al-Ghaffar','الْغَفَّارُ','Maha Pengampun'],['Al-Qahhar','الْقَهَّارُ','Maha Menundukkan'],['Al-Wahhab','الْوَهَّابُ','Maha Pemberi Karunia'],['Ar-Razzaq','الرَّزَّاقُ','Maha Pemberi Rezeki'],['Al-Fattah','الْفَتَّاحُ','Maha Pembuka Rahmat'],['Al-Alim','الْعَلِيمُ','Maha Mengetahui'],['Al-Qabid','الْقَابِضُ','Maha Menyempitkan'],['Al-Basit','الْبَاسِطُ','Maha Melapangkan'],['Al-Khafid','الْخَافِضُ','Maha Merendahkan'],['Ar-Rafi','الرَّافِعُ','Maha Meninggikan'],['Al-Mu’izz','الْمُعِزُّ','Maha Memuliakan'],['Al-Mudzill','الْمُذِلُّ','Maha Menghinakan'],['As-Sami','السَّمِيعُ','Maha Mendengar'],['Al-Basir','الْبَصِيرُ','Maha Melihat'],['Al-Hakam','الْحَكَمُ','Maha Menetapkan'],['Al-Adl','الْعَدْلُ','Maha Adil'],['Al-Latif','اللَّطِيفُ','Maha Lembut'],['Al-Khabir','الْخَبِيرُ','Maha Mengenal'],['Al-Halim','الْحَلِيمُ','Maha Penyantun'],['Al-Azhim','الْعَظِيمُ','Maha Agung'],['Al-Ghafur','الْغَفُورُ','Maha Pengampun'],['Asy-Syakur','الشَّكُورُ','Maha Pembalas Budi'],['Al-Aliyy','الْعَلِيُّ','Maha Tinggi'],['Al-Kabir','الْكَبِيرُ','Maha Besar'],['Al-Hafizh','الْحَفِيظُ','Maha Memelihara'],['Al-Muqit','الْمُقِيتُ','Maha Pemberi Kecukupan'],['Al-Hasib','الْحَسِيبُ','Maha Membuat Perhitungan'],['Al-Jalil','الْجَلِيلُ','Maha Luhur'],['Al-Karim','الْكَرِيمُ','Maha Pemurah'],['Ar-Raqib','الرَّقِيبُ','Maha Mengawasi'],['Al-Mujib','الْمُجِيبُ','Maha Mengabulkan'],['Al-Wasi','الْوَاسِعُ','Maha Luas'],['Al-Hakim','الْحَكِيمُ','Maha Bijaksana'],['Al-Wadud','الْوَدُودُ','Maha Mengasihi'],['Al-Majid','الْمَجِيدُ','Maha Mulia'],['Al-Ba’its','الْبَاعِثُ','Maha Membangkitkan'],['Asy-Syahid','الشَّهِيدُ','Maha Menyaksikan'],['Al-Haqq','الْحَقُّ','Maha Benar'],['Al-Wakil','الْوَكِيلُ','Maha Memelihara'],['Al-Qawiyy','الْقَوِيُّ','Maha Kuat'],['Al-Matin','الْمَتِينُ','Maha Kokoh'],['Al-Waliyy','الْوَلِيُّ','Maha Melindungi'],['Al-Hamid','الْحَمِيدُ','Maha Terpuji'],['Al-Muhshi','الْمُحْصِي','Maha Menghitung'],['Al-Mubdi','الْمُبْدِئُ','Maha Memulai'],['Al-Mu’id','الْمُعِيدُ','Maha Mengembalikan Kehidupan'],['Al-Muhyi','الْمُحْيِي','Maha Menghidupkan'],['Al-Mumit','الْمُمِيتُ','Maha Mematikan'],['Al-Hayy','الْحَيُّ','Maha Hidup'],['Al-Qayyum','الْقَيُّومُ','Maha Mandiri'],['Al-Wajid','الْوَاجِدُ','Maha Menemukan'],['Al-Maajid','الْمَاجِدُ','Maha Mulia'],['Al-Wahid','الْوَاحِدُ','Maha Tunggal'],['Al-Ahad','الْأَحَدُ','Maha Esa'],['As-Samad','الصَّمَدُ','Maha Dibutuhkan'],['Al-Qadir','الْقَادِرُ','Maha Menentukan'],['Al-Muqtadir','الْمُقْتَدِرُ','Maha Berkuasa'],['Al-Muqaddim','الْمُقَدِّمُ','Maha Mendahulukan'],['Al-Mu’akhkhir','الْمُؤَخِّرُ','Maha Mengakhirkan'],['Al-Awwal','الْأَوَّلُ','Maha Awal'],['Al-Akhir','الْآخِرُ','Maha Akhir'],['Az-Zahir','الظَّاهِرُ','Maha Nyata'],['Al-Batin','الْبَاطِنُ','Maha Ghaib'],['Al-Wali','الْوَالِي','Maha Memerintah'],['Al-Muta’ali','الْمُتَعَالِي','Maha Tinggi'],['Al-Barr','الْبَرُّ','Maha Penderma'],['At-Tawwab','التَّوَّابُ','Maha Penerima Tobat'],['Al-Muntaqim','الْمُنْتَقِمُ','Maha Pemberi Balasan'],['Al-Afuww','الْعَفُوُّ','Maha Pemaaf'],['Ar-Ra’uf','الرَّؤُوفُ','Maha Pengasih'],['Malikul-Mulk','مَالِكُ الْمُلْكِ','Maha Penguasa Kerajaan'],['Dzul-Jalali wal-Ikram','ذُو الْجَلَالِ وَالْإِكْرَامِ','Maha Pemilik Kebesaran dan Kemuliaan'],['Al-Muqsit','الْمُقْسِطُ','Maha Adil'],['Al-Jami','الْجَامِعُ','Maha Mengumpulkan'],['Al-Ghaniyy','الْغَنِيُّ','Maha Kaya'],['Al-Mughni','الْمُغْنِي','Maha Pemberi Kekayaan'],['Al-Mani','الْمَانِعُ','Maha Mencegah'],['Ad-Darr','الضَّارُّ','Maha Menimpakan Kemudaratan'],['An-Nafi','النَّافِعُ','Maha Memberi Manfaat'],['An-Nur','النُّورُ','Maha Bercahaya'],['Al-Hadi','الْهَادِي','Maha Pemberi Petunjuk'],['Al-Badi','الْبَدِيعُ','Maha Pencipta tanpa Contoh'],['Al-Baqi','الْبَاقِي','Maha Kekal'],['Al-Warith','الْوَارِثُ','Maha Pewaris'],['Ar-Rashid','الرَّشِيدُ','Maha Membimbing'],['As-Sabur','الصَّبُورُ','Maha Sabar']
];
export const asmaulHusna = asmaRows.map((r, i) => ({ number: i + 1, latin: r[0], arabic: r[1], meaning: r[2] }));

export const fallbackDuas = [
  {
    id: 1,
    judul: 'Doa sebelum makan',
    arab: 'اَللّٰهُمَّ بَارِكْ لَنَا فِيْمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
    latin: 'Allâhumma bârik lanâ fîmâ razaqtanâ waqinâ ‘adzâban nâr(i).',
    terjemah: 'Ya Allah, berkahilah apa yang telah Engkau anugerahkan kepada kami dan jagalah kami dari siksa neraka.',
    sumber: 'Al-Adzkâr (Imam an-Nawawi); penilaian sanad riwayat doa ini diperselisihkan.'
  },
  { id: 2, judul: 'Doa sesudah makan', arab: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ', latin: 'Alhamdulillaahil-ladzi ath’amanaa wa saqaanaa wa ja’alanaa minal muslimiin.', terjemah: 'Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami termasuk orang-orang muslim.', sumber: 'HR. Abu Dawud' },
  { id: 3, judul: 'Doa sebelum tidur', arab: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', latin: 'Bismika Allahumma amuutu wa ahyaa.', terjemah: 'Dengan nama-Mu, ya Allah, aku mati dan aku hidup.', sumber: 'HR. Bukhari' },
  { id: 4, judul: 'Doa bangun tidur', arab: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', latin: 'Alhamdulillaahil-ladzi ahyaanaa ba’da maa amaatanaa wa ilaihin-nusyuur.', terjemah: 'Segala puji bagi Allah yang menghidupkan kami setelah mematikan kami, dan kepada-Nya kami dibangkitkan.', sumber: 'HR. Bukhari' },
  { id: 5, judul: 'Doa memohon kebaikan', arab: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', latin: 'Rabbanaa aatinaa fid-dunyaa hasanah wa fil-aakhirati hasanah wa qinaa ‘adzaaban-naar.', terjemah: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, serta lindungilah kami dari azab neraka.', sumber: 'QS. Al-Baqarah: 201' },
];

// A short API/cache response must never be treated as the complete dua catalogue.
// EQuran's doa endpoint normally returns a list; the local fallback keeps the UI
// useful while the full catalogue is unavailable.
export const MIN_DUA_CATALOG_SIZE = Math.min(5, fallbackDuas.length);

// Keep the canonical before-meal prayer accurate while removing only the dedicated
// basmalah-before-meal card. Match its normalized title exactly so other prayers that
// happen to contain the words "makan" or "basmalah" are preserved.
export function enforceBeforeMealDua(duas) {
  if (!Array.isArray(duas) || !duas.length) return [];

  const excludedBasmalahTitles = new Set([
    'membaca basmalah sebelum makan',
    'membaca bismillah sebelum makan',
    'bacaan basmalah sebelum makan',
    'bacaan bismillah sebelum makan',
    'basmalah sebelum makan',
    'bismillah sebelum makan'
  ]);
  const normalizeTitle = (value) => String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const list = duas.filter((item) => {
    const title = normalizeTitle(item?.judul ?? item?.title ?? item?.nama ?? item?.name);
    return !excludedBasmalahTitles.has(title);
  });

  // Do not synthesize a single fallback card from an empty catalogue.
  if (!list.length) return [];

  const pattern = /\b(sebelum|mau)\s+makan\b|\bdoa\s+makan\b|\bbefore\s+(eating|meal)\b/i;
  const index = list.findIndex((item) => {
    const title = `${item?.judul || ''} ${item?.title || ''}`;
    return pattern.test(title) && !/\b(?:bismillah|basmalah)\b/i.test(title);
  });
  const canonical = fallbackDuas.find((item) => item.judul === 'Doa sebelum makan') || fallbackDuas[0];
  if (index >= 0) {
    list[index] = { ...list[index], ...canonical, id: list[index]?.id ?? canonical.id };
  } else {
    list.push(canonical);
  }

  // The UI numbers cards by array position. Sort numeric API/cache IDs to normalize ordering.
  const allHaveNumericIds = list.every((item) => item?.id !== null && item?.id !== undefined && String(item.id).trim() !== '' && Number.isFinite(Number(item.id)));
  if (allHaveNumericIds) list.sort((a, b) => Number(a.id) - Number(b.id));

  // Keep the before-meal entry ahead of the after-meal entry even if upstream order is reversed.
  const beforeIndex = list.findIndex((item) => {
    const title = `${item?.judul || ''} ${item?.title || ''}`;
    return /\b(sebelum|mau)\s+makan\b|\bbefore\s+(eating|meal)\b/i.test(title) && !/\b(?:bismillah|basmalah)\b/i.test(title);
  });
  const afterIndex = list.findIndex((item) => /\b(sesudah|setelah)\s+makan\b|\bafter\s+(eating|meal)\b/i.test(`${item?.judul || ''} ${item?.title || ''}`));
  if (beforeIndex >= 0 && afterIndex >= 0 && afterIndex < beforeIndex) {
    [list[beforeIndex], list[afterIndex]] = [list[afterIndex], list[beforeIndex]];
  }
  return list;
}
