# Product Requirement Document (PRD)
## Al-Qur'an Digital Indonesia (Mobile-First Next.js Web App)

---

### 1. Ringkasan Eksekutif (Executive Summary)
**Al-Qur'an Digital Indonesia** adalah aplikasi web berkinerja tinggi berbasis Next.js 14 (App Router) yang dirancang khusus untuk kenyamanan membaca, menghafal, dan memahami Al-Qur'an bagi masyarakat Indonesia. Aplikasi ini menggabungkan teks Uthmani bebas glitch, terjemahan standar Kemenag RI, audio dari 5 Qari ternama dunia, jadwal shalat seluruh wilayah Indonesia (termasuk Bogor dan Jabodetabek), Doa Harian, serta 99 Asmaul Husna dalam antarmuka modern yang ramah seluler (*mobile-first*).

---

### 2. Tujuan & Sasaran Produk (Product Goals & Objectives)
- **Aksesibilitas & Kenyamanan Baca**: Menghadirkan tampilan teks Arab Uthmani yang bersih, tanpa karakter rusak/kotak ($\text{replacement character / }\backslash\text{uFFFD}$), dengan ukuran font yang dapat disesuaikan.
- **Dukungan Hafalan (Hifz Mode)**: Fitur fleksibel untuk menyembunyikan/menampilkan teks Arab, Latin, atau Terjemahan secara terpisah guna mendukung latihan hafalan mandiri.
- **Kemudahan Navigasi Mobile-First**: *Sticky audio player* dan *bottom navigation bar* yang dirancang khusus agar mudah dioperasikan dengan satu jempol pada perangkat seluler.
- **Fitur Keagamaan Lengkap**: Mengintegrasikan jadwal shalat lokal Indonesia, kumpulan doa harian, dan Asmaul Husna dalam satu aplikasi tanpa perlu memasang banyak aplikasi terpisah.

---

### 3. Arsitektur Teknis & Tech Stack

| Komponen | Teknologi / Library | Deskripsi / Catatan |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js 14 (App Router) | React Server Components & Client Interactive Components |
| **UI Library & Styling** | Tailwind CSS v3 | Desain responsif dengan tema Emerald-Gold & Dark/Light Mode |
| **Ikonografi** | Lucide React | Ikon UI intuitif dan konsisten |
| **Tipografi Arab** | Google Fonts API | Amiri Quran, Scheherazade New, Noto Naskh Arabic, Amiri |
| **Sumber Data API** | EQuran.id v2 API | API publik terpercaya untuk Surah, Ayat, Audio, & Tafsir Kemenag |
| **Penyimpanan Lokal** | Browser `localStorage` | Menyimpan preferensi font, bookmark, kota jadwal shalat, & riwayat |

---

### 4. Spesifikasi & Detail Fitur Utama

#### 4.1. Modul Al-Qur'an & Reader View
1. **Daftar 114 Surah**:
   - Pencarian *real-time* berdasarkan nama surah, nama latin, nomor surah, atau arti.
   - Filter kategorisasi: Semua Surah, Makkiyah, Madaniyah, dan Bookmark.
   - Tampilan *Grid Card* (Desktop/Tablet) dan *Compact List* (Mobile).
2. **Mesin Tipografi Arab HD (Anti-Box/Corrupted Glyph)**:
   - Sanitasi otomatis teks Arab (`cleanArabicText`) untuk menghapus karakter tak dikenal, zero-width control chars, dan orphan glyphs.
   - *Fallback Font Chain*: `'Amiri Quran', 'Scheherazade New', 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif`.
   - *RTL Styling* dengan `lineHeight: 2.5` dan `-webkit-font-smoothing` untuk kejelasan harakat & tajwid.
3. **Mode Hafalan (Hifz Visibility Toggles)**:
   - Sakelar independen untuk: Tampilkan/Sembunyikan Teks Arab, Transliterasi Latin, dan Terjemahan Indonesia.
   - Pengatur ukuran teks Arab ($20\text{px} - 52\text{px}$) dan Teks Terjemahan ($12\text{px} - 24\text{px}$).
4. **Fitur Lompat Ayat & Interaksi Ayat**:
   - Form *Jump to Verse* langsung melompat ke nomor ayat tertentu.
   - Salin teks ayat lengkap ke *clipboard*.
   - Bookmark per-surah dan per-ayat.

#### 4.2. Modul Audio Murottal Multi-Imam
- **Pilihan 5 Qari/Imam Besar**:
  1. Sheikh Misyari Rasyid Al-Afasi
  2. Sheikh Abdurrahman As-Sudais
  3. Sheikh Abdullah Al-Juhany
  4. Sheikh Abdul Muhsin Al-Qasim
  5. Sheikh Ibrahim Al-Dossari
- **Mekanisme Pemutaran**:
  - Pemutaran Audio Full Surah atau Per-Ayat.
  - *Auto-Next Verse*: Otomatis beralih ke ayat berikutnya saat audio ayat selesai diputar.
  - *Sticky Player Bar*: Melayang di atas *Bottom Nav Bar* di seluler tanpa menutupi konten utama.
  - *Verse Highlighting & Auto-Scroll*: Ayat yang sedang diputar akan mendapatkan sorotan warna khusus dan gulir otomatis ke tengah layar.

#### 4.3. Modul Tafsir Kemenag RI
- Integrasi Tafsir ringkas/lengkap Kemenag RI per-surah dan per-ayat.
- Ditampilkan dalam *Modal Overlay* yang responsif.

#### 4.4. Modul Jadwal Shalat Wilayah Indonesia
- **Cakupan Wilayah**:
  - **Bogor & Jabodetabek**: Kota Bogor, Kab. Bogor (Cibinong/Dramaga), DKI Jakarta, Depok, Bekasi, Tangerang.
  - **Seluruh Pulau Indonesia**: Jawa & Bali, Sumatra, Kalimantan, Sulawesi & Nusa Tenggara, Maluku & Papua.
- **Fitur Tambahan**: Pencarian nama kota/kabupaten cepat, filter wilayah pulau, serta penanda tanggal Masehi.

#### 4.5. Modul Doa Harian & Asmaul Husna
- Kumpulan Doa Sehari-hari dilengkapi teks Arab, Latin, dan Terjemahan.
- 99 Asmaul Husna dalam format *grid card* interaktif.

---

### 5. Persyaratan Non-Fungsional (Non-Functional Requirements)

1. **Responsivitas & Aksesibilitas**:
   - Pendekatan *Mobile-First*: *Touch target* minimal $44\text{px} \times 44\text{px}$ untuk semua tombol interaktif.
   - Navigasi bawah (*Bottom Navigation Bar*) khusus layar $<768\text{px}$.
2. **Kinerja & Optimasi**:
   - *Lazy loading* & *skeleton loading state* saat mengambil data dari API EQuran.id.
   - Penggunaan `localStorage` untuk caching preferensi tanpa perlu login/autentikasi pengguna.
3. **Desain Visual & Tema**:
   - Skema warna Emerald ($\text{Hex } \#059669$) dan Amber/Gold ($\text{Hex } \#D97706$).
   - Pengalihan Tema Gelap/Terang (*Dark/Light Mode*) yang konsisten di semua elemen visual.

---

### 6. Struktur Direktori Proyek Next.js

```text
alquran-digital-nextjs/
├── src/
│   └── app/
│       ├── globals.css          # Import Google Fonts & Tailwind Directives
│       ├── layout.jsx           # Root Layout Next.js App Router
│       └── page.jsx             # Main Application Component (114 Surah, Reader, Player, Settings)
├── public/                      # Asset statis & favicon
├── package.json                 # Dependency Next.js 14, React 18, Lucide React, Tailwind
├── tailwind.config.js           # Konfigurasi Tailwind & Custom Fonts
├── postcss.config.js            # Plugin PostCSS
├── next.config.js               # Konfigurasi Next.js
└── jsconfig.json                # Alias path @/*
```

---

### 7. Roadmap Pengembangan Masa Depan (Future Enhancements)

- [x] **PWA (Progressive Web App)**: Dukungan *Service Worker* untuk cache sebagian ayat dan jadwal shalat agar konten yang telah dimuat dapat diakses secara *offline*.
- [ ] **Warna Tajwid Digital**: Highlight warna otomatis untuk hukum tajwid (Ikhfa, Idgham, Qalqalah, dll.).
- [ ] **Penanda Kompas Kiblat (Qibla Finder)**: Menggunakan API Geolocation & Device Orientation pada ponsel.
- [x] **Fitur Catatan Pribadi (Verse Notes)**: Pengguna dapat menambahkan, mengedit, menghapus, dan meninjau catatan tadabbur pada ayat tertentu; penyimpanan lokal per perangkat.
- [ ] **Unduh Audio Murottal**: Opsi untuk mengunduh audio per surah untuk didengarkan secara *offline*.

### Pembaruan implementasi v1.8.0
- **Catatan pribadi per ayat (Tadabbur Notes):** pengguna dapat membuat, mengedit, menghapus, dan meninjau catatan yang disimpan lokal per ayat. Catatan tidak tersinkron ke server/perangkat lain.


### Pembaruan implementasi v1.9.0

- Menambahkan ekspor/impor data lokal melalui file JSON tervalidasi.
- Backup mencakup bookmark, catatan tadabbur, posisi bacaan terakhir, progres membaca, target khatam, pengulangan audio, favorit Asmaul Husna, tema, dan preferensi pembaca.
- Impor dibatasi 5 MB, hanya dapat menulis key cadangan yang dikenal, menampilkan konfirmasi, dan mempertahankan kategori yang tidak ada dalam file.
- Detail format dan perilaku ada di `docs/LOCAL-DATA-BACKUP.md`.


### Pembaruan implementasi v1.10.0 — Pengelolaan konten offline

- Menambahkan panel **Kelola konten offline** pada Pengaturan.
- Menampilkan jumlah surah yang ditandai offline, jumlah surah dengan data ayat lokal, estimasi ukuran cache ayat, serta estimasi penggunaan/kuota penyimpanan origin bila didukung browser.
- Pengguna dapat membuka kembali surah yang tersimpan, menghapus data offline untuk satu surah, atau menghapus seluruh cache ayat Al-Qur'an.
- Penghapusan cache ayat tidak menghapus bookmark, catatan tadabbur, posisi bacaan, progres khatam, atau pengaturan.
- Service worker mencoba melakukan precache HTML untuk URL surah dan ayat saat pengguna menekan **Simpan offline**. Ini bersifat best-effort; data ayat lokal adalah jalur fallback utama di aplikasi.
- Cache service worker diperbarui menjadi `nurani-pwa-v18`.
