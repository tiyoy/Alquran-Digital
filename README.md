<p align="center">
  <img src="./public/icons/icon-192.png" alt="Ikon Nurani" width="104" height="104" />
</p>

<h1 align="center">Nurani — Al-Qur'an Digital Indonesia</h1>

<p align="center">
  <strong>Teman tilawah harian untuk membaca, menghafal, dan memahami Al-Qur'an.</strong><br />
  Aplikasi web mobile-first dengan tampilan Emerald–Gold, jadwal shalat Indonesia, doa harian, dan dukungan Progressive Web App (PWA).
</p>

<p align="center">
  <img alt="Next.js App Router" src="https://img.shields.io/badge/Next.js-App_Router-111111?logo=nextdotjs" />
  <img alt="React 18" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" />
  <img alt="Bahasa Indonesia" src="https://img.shields.io/badge/Bahasa-Indonesia-059669" />
</p>

<p align="center">
  <a href="#fitur-utama">Lihat fitur</a> ·
  <a href="#mulai-di-lokal">Mulai di lokal</a> ·
  <a href="#deploy-ke-vercel">Deploy ke Vercel</a> ·
  <a href="#pwa-dan-mode-offline">PWA & offline</a>
</p>

---

## Tentang Nurani

**Nurani** dirancang untuk membantu aktivitas tilawah harian melalui satu antarmuka yang nyaman digunakan di ponsel maupun desktop. Navigasi bawah ramah satu tangan, pengaturan bacaan, mode terang/gelap, serta penyimpanan lokal membuat pengalaman membaca terasa praktis tanpa mengharuskan pengguna membuat akun.

> Fokus produk: **Tilawah · Tadabbur · Doa**

## Fitur utama

| Modul | Fitur |
|---|---|
| 📖 **Al-Qur'an** | Katalog 114 surah, pencarian dan filter Makkiyah/Madaniyah, tampilan ayat Arab, latin, dan terjemahan, serta kontrol ukuran teks. |
| 🧠 **Mode hafalan** | Sembunyikan atau tampilkan teks Arab, transliterasi, dan terjemahan secara terpisah. |
| 🔖 **Bookmark & lanjut baca** | Simpan penanda ayat dan preferensi membaca pada perangkat. |
| 🎧 **Audio murottal** | Pilihan lima qari sesuai PRD, pemutaran surah/ayat, penyorotan ayat yang aktif, dan pemutar yang tetap mudah dijangkau. Ketersediaan audio mengikuti respons sumber data. |
| 📚 **Tafsir** | Tampilan tafsir surah/ayat berdasarkan data yang disediakan API. |
| 🕌 **Jadwal shalat** | Pencarian kota/kabupaten di Indonesia, filter wilayah pulau, dan wilayah awal **Kab. Bogor**. |
| 🤲 **Doa harian** | Pencarian doa, teks Arab, latin, terjemahan, salin bacaan, serta data cadangan lokal. |
| ✨ **Asmaul Husna** | 99 nama Allah, pencarian, dan favorit lokal. |
| 🌗 **Tema & responsivitas** | Mode terang/gelap, antarmuka mobile-first, navigasi bawah di layar kecil, dan target sentuh yang ramah pengguna. |
| 📲 **PWA** | Manifest, ikon aplikasi, prompt instalasi, service worker, halaman offline, dan cache progresif untuk sebagian data. |

## Teknologi

- **Framework:** Next.js App Router dan React.
- **Styling:** Tailwind CSS v3 dan CSS responsif khusus aplikasi.
- **Ikon:** Lucide React.
- **Penyimpanan di perangkat:** `localStorage` untuk preferensi, bookmark, riwayat, dan data yang pernah dimuat.
- **PWA:** Web App Manifest dan service worker khusus di folder `public/`.
- **Data Al-Qur'an, doa, dan jadwal shalat:** API publik eksternal; aplikasi tidak memerlukan API key untuk endpoint bawaan.

## Mulai di lokal

### Prasyarat

- Node.js **18.17 atau lebih baru** untuk versi proyek saat ini (disarankan Node.js LTS yang masih didukung).
- npm.
- Koneksi internet untuk instalasi dependency dan mengambil data terbaru dari API.

### Instalasi

1. Unduh atau clone repository, lalu buka terminal pada folder yang berisi `package.json`.
2. Pasang dependency:

   ```bash
   npm install
   ```

3. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000).

Setelah `npm install`, simpan `package-lock.json` ke Git agar instalasi di komputer lain dan layanan CI/deployment lebih konsisten.

### Periksa sebelum deploy

```bash
npm run lint
npm run build
npm run start
```

`npm run start` menjalankan hasil build produksi. PWA sebaiknya diuji pada build produksi melalui HTTPS; service worker sengaja tidak digunakan pada mode development untuk mengurangi masalah cache lama.

## Environment variables

Aplikasi memiliki endpoint default sehingga `.env.local` tidak wajib untuk menjalankan versi dasar. Untuk mengganti endpoint, buat `.env.local` berdasarkan `.env.example`:

```env
NEXT_PUBLIC_QURAN_API=https://equran.id/api/v2
NEXT_PUBLIC_DOA_API=https://equran.id/api/doa
NEXT_PUBLIC_SHOLAT_API=https://api.myquran.com/v3/sholat
```

Semua variabel di atas adalah **endpoint publik**, bukan tempat menyimpan secret. Variabel dengan awalan `NEXT_PUBLIC_` dapat dimasukkan ke bundle browser. Jangan menyimpan token rahasia, password, atau private API key di dalamnya. Jika nilainya diubah di Vercel, jalankan deployment ulang agar build menggunakan konfigurasi terbaru.

## Publikasikan ke GitHub

Agar konfigurasi Vercel sederhana, buat repository dengan file proyek ini berada langsung di root repository—folder yang sama dengan `package.json`. Jika ZIP berisi folder `alquran-digital-nextjs`, masuk ke folder tersebut sebelum menjalankan perintah berikut.

```bash
git init -b main
git add .
git commit -m "chore: publish Nurani Al-Qur'an PWA"
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME` dan `NAMA-REPO` dengan akun serta nama repository milikmu. Buat repository kosong di GitHub terlebih dahulu, lalu ikuti instruksi GitHub jika repository tersebut sudah memiliki commit awal.

**Sebelum push:** pastikan `.env.local` tidak ikut ter-commit. File `.gitignore` proyek mengabaikan file `.env*` dan tetap mengizinkan `.env.example`.

## Deploy ke Vercel

Cara termudah adalah menghubungkan repository GitHub ke Vercel. Integrasi Git dapat membuat preview deployment untuk perubahan branch dan production deployment dari branch produksi yang dipilih.

1. Push source code ke GitHub.
2. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard), pilih **Add New → Project**, lalu import repository GitHub.
3. Pastikan **Root Directory** menunjuk ke folder yang berisi `package.json`. Jika isi proyek berada di root repository, gunakan `./`.
4. Periksa pengaturan build. Vercel biasanya mendeteksi Next.js secara otomatis:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** biarkan default/dideteksi otomatis
5. Bila tidak menggunakan endpoint override, environment variables tidak perlu ditambahkan. Bila ingin menggantinya, tambahkan `NEXT_PUBLIC_QURAN_API`, `NEXT_PUBLIC_DOA_API`, dan/atau `NEXT_PUBLIC_SHOLAT_API` di **Project Settings → Environment Variables** untuk lingkungan yang sesuai.
6. Klik **Deploy** dan periksa URL deployment. Setiap push berikutnya dapat memicu deployment otomatis sesuai konfigurasi branch.

Panduan resmi: [Deploy Git Repository di Vercel](https://vercel.com/docs/git) · [Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) · [Environment Variables Vercel](https://vercel.com/docs/environment-variables).

### Penting: pembaruan keamanan sebelum publikasi

> [!WARNING]
> `package.json` pada source saat ini masih mengunci Next.js dan `eslint-config-next` ke **14.2.35** untuk mengikuti versi mayor pada PRD awal. Pada **20 Oktober 2026**, advisori keamanan menyatakan versi Next.js 10.x–15.x sebelum **15.5.28** termasuk rentang versi terdampak oleh pembaruan keamanan kritis terkait. **Jangan menjadikan versi dependency saat ini sebagai rilis produksi publik tanpa meninjau dan menerapkan patch keamanan yang sesuai.**

Sebelum deploy publik, naikkan Next.js dan `eslint-config-next` ke versi yang sudah ditambal dan kompatibel, lalu jalankan kembali `npm install`, `npm run lint`, dan `npm run build`. Jika tetap memakai jalur Next.js 15.x, `15.5.28` adalah batas minimum yang disebut pada advisori tanggal di atas; periksa sumber resmi untuk patch terbaru sebelum melakukan upgrade.

- [Advisori keamanan — Cyber Security Agency of Singapore, 20 Oktober 2026](https://www.csa.gov.sg/alerts-and-advisories/alerts/al-2026-148/)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)

## PWA dan mode offline

- `public/manifest.webmanifest` mengatur nama aplikasi, ikon, warna tema, mode standalone, dan shortcut.
- `public/sw.js` mengatur cache app shell, aset same-origin, serta respons GET yang berhasil dari beberapa endpoint API.
- Preferensi membaca, bookmark, posisi baca, sebagian metadata/ayat yang telah dimuat, doa, dan jadwal shalat terakhir juga dapat disimpan di browser.
- **Offline bersifat progresif, bukan salinan penuh semua data.** Konten umumnya perlu berhasil dimuat setidaknya sekali saat online sebelum tersedia dari cache. Audio murottal masih dapat membutuhkan koneksi internet.
- Instalasi PWA pada deployment publik membutuhkan HTTPS. `localhost` didukung untuk pengembangan.

## Sumber data

- **Al-Qur'an, terjemahan, audio, dan tafsir:** [Dokumentasi EQuran.id API v2](https://equran.id/apidev/v2)
- **Doa harian:** [Dokumentasi EQuran.id Doa API](https://equran.id/apidev/doa)
- **Jadwal shalat Indonesia:** [Dokumentasi myQuran API](https://api.myquran.com/doc)

Data ditampilkan berdasarkan respons sumber API. Ketersediaan, struktur field, CORS, tautan audio, dan kelengkapan konten mengikuti kebijakan serta kondisi layanan tersebut. Daftar surah bawaan digunakan sebagai metadata tampilan; teks ayat penuh diambil dari API dan sebagian hasil yang berhasil dimuat dapat disimpan lokal.

## Struktur proyek

```text
alquran-digital-nextjs/
├── design-system/
│   ├── MASTER.md
│   └── UI_UX_AUDIT.md
├── docs/
│   └── PRD.md
├── public/
│   ├── icons/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   ├── offline.html
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.jsx
│   │   └── page.jsx
│   └── lib/
│       ├── api.js
│       └── data.js
├── .env.example
├── package.json
└── README.md
```

## Troubleshooting

<details>
  <summary><strong>Hydration error: “KAB. BOGOR” berbeda dengan “KOTA BOGOR”</strong></summary>

  Ini dapat terjadi bila browser masih menyimpan bundle atau service worker dari build sebelumnya. Buka Chrome DevTools → **Application → Service Workers** lalu unregister worker untuk `localhost:3000`. Pada **Application → Storage**, pilih **Clear site data** (ini juga menghapus bookmark dan preferensi lokal situs). Hentikan server, hapus `.next`, lalu jalankan lagi `npm run dev`.
</details>

<details>
  <summary><strong>Doa, ayat, atau jadwal tidak dimuat</strong></summary>

  Pastikan koneksi internet aktif. API eksternal dapat mengalami gangguan, perubahan struktur respons, atau pembatasan akses browser. Periksa Console/Network di DevTools dan coba kembali setelah layanan tersedia. Data cadangan lokal hanya mencakup konten yang dibundel atau pernah berhasil disimpan.
</details>

<details>
  <summary><strong>Perubahan environment variable tidak terlihat di Vercel</strong></summary>

  Pastikan variabel disetel pada environment yang benar (Preview/Production), lalu buat deployment baru. Variabel `NEXT_PUBLIC_` dibaca saat proses build dan dikirim ke sisi browser.
</details>

## Design system & roadmap

Pendekatan design-system-first dan catatan audit UI/UX ada di [`design-system/MASTER.md`](./design-system/MASTER.md) dan [`design-system/UI_UX_AUDIT.md`](./design-system/UI_UX_AUDIT.md). PRD asli tersedia di [`docs/PRD.md`](./docs/PRD.md).

Beberapa ide yang tercantum sebagai pengembangan lanjutan dalam PRD dan belum termasuk pada implementasi ini: warna tajwid otomatis, kompas kiblat, catatan pribadi per ayat, dan unduhan audio offline.

## Kontribusi

Perbaikan bug, peningkatan aksesibilitas, dan penyempurnaan dokumentasi sangat diapresiasi. Untuk perubahan yang cukup besar, buka issue terlebih dahulu agar tujuan perubahan dapat didiskusikan. Sebelum mengirim pull request, jalankan lint dan build, dan pastikan tidak ada file `.env.local` atau secret yang ikut ditambahkan.

## Lisensi

Saat ini repository belum menyertakan file `LICENSE`. Tentukan lisensi yang sesuai sebelum mengizinkan pihak lain menggunakan, memodifikasi, atau mendistribusikan ulang source code.

---

<p align="center">
  Dibuat dengan niat baik dan secangkir kopi oleh <a href="https://www.instagram.com/cecep.maulana_/" target="_blank" rel="noopener noreferrer">Cecep Maulanaツ</a>.
</p>


## Catatan perbaikan katalog doa

Katalog doa menormalkan urutan berdasarkan ID numerik yang tersedia dan memastikan **Doa sebelum makan** berada sebelum **Doa sesudah makan**. Entri khusus **Membaca basmalah sebelum makan** dikecualikan berdasarkan judul yang dinormalisasi secara tepat, tanpa menyaring doa lain yang memuat kata serupa. Katalog API atau cache yang hanya berisi satu/terlalu sedikit doa dianggap tidak lengkap dan tidak boleh menggantikan daftar yang tersedia. Service worker memakai versi cache terbaru.
