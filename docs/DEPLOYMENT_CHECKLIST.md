# Checklist Pra-Deployment Nurani

Gunakan checklist ini sebelum mendorong perubahan ke GitHub dan sebelum membuat Production Deployment di Vercel.

## 1. Siapkan lingkungan

- [ ] Pasang Node.js 22 LTS (versi minimum proyek: 20.9.0; lihat `.nvmrc`).
- [ ] Buka terminal di direktori yang berisi `package.json`.
- [ ] Jalankan `npm install` dan tunggu hingga berhasil.
- [ ] Pastikan `package-lock.json` terbentuk dan ikut di-commit.

## 2. Periksa dependency dan build

```bash
node -v
npm ls next react react-dom eslint-config-next
npm audit
npm run lint
npm run build
```

Versi yang dikunci di `package.json`:

- Next.js `15.5.28`
- `eslint-config-next` `15.5.28`
- React `19.2.9`
- React DOM `19.2.9`

Jika perintah gagal, tangani error sebelum deploy. Periksa advisori resmi Next.js dan tinjau hasil `npm audit`; jangan mengabaikan kerentanan kritis hanya agar build lolos.

Setelah build berhasil, uji hasil produksi secara lokal:

```bash
npm run start
```

## 3. Smoke test fitur

- [ ] Beranda, navigasi bawah, mode terang, dan mode gelap tampil tanpa error.
- [ ] URL tidak dikenal menampilkan halaman 404 Nurani, bukan halaman error bawaan yang membingungkan.
- [ ] Error runtime menampilkan tombol Coba lagi yang memanggil reset boundary.
- [ ] Dropdown pilihan qari terbaca pada mode gelap.
- [ ] Daftar surah, pencarian, teks Arab, latin, terjemahan, bookmark, dan loncat ayat berjalan.
- [ ] Target khatam 30/60/90 hari tersimpan setelah refresh.
- [ ] Posisi baca dan progres ayat tersimpan di perangkat setelah refresh.
- [ ] Mode murajaah audio (mati, 3×, 5×, 10×, tanpa batas) diuji dengan sumber audio yang tersedia.
- [ ] Halaman Doa menampilkan katalog. Doa sebelum makan berada di atas doa sesudah makan dan entri “Membaca basmalah sebelum makan” tidak muncul sebagai kartu terpisah.
- [ ] Jadwal shalat memulai dari Kab. Bogor dan pencarian kota lain masih berfungsi.
- [ ] Asmaul Husna memuat 99 nama.
- [ ] Dari reader, tandai satu surah untuk offline, matikan jaringan, lalu uji halaman baca yang telah dimuat sebelumnya.
- [ ] Pada Chrome DevTools → Application, pastikan manifest, ikon, dan service worker valid.

> Catatan offline: aplikasi menyimpan data yang telah dimuat atau ditandai. Audio dari sumber eksternal dan konten yang belum pernah dibuka mungkin tetap membutuhkan internet.

## 4. SEO dan header keamanan

- [ ] Pastikan `NEXT_PUBLIC_SITE_URL` bernilai `https://nurani-tiyoy.vercel.app` (atau domain kanonis yang sudah diverifikasi).
- [ ] Pastikan deployment Preview memakai metadata `noindex`, sedangkan deployment Production boleh diindeks.
- [ ] Buka `/robots.txt` dan pastikan baris sitemap menunjuk ke domain yang benar.
- [ ] Buka `/sitemap.xml` dan pastikan URL kanonis tidak memakai `localhost` atau deployment preview.
- [ ] Buka `/quran`, `/jadwal-shalat`, `/doa`, dan `/asmaul-husna` secara langsung; masing-masing harus tampil pada tab yang sesuai.
- [ ] Buka `/quran/1-al-fatihah`, `/quran/2-al-baqarah`, dan `/quran/36-yasin` langsung dari tab baru; reader harus membuka surah yang sesuai.
- [ ] Periksa setiap route bagian dan beberapa route surah memiliki title, meta description, canonical dan Open Graph URL yang sesuai.
- [ ] Klik navigasi antarbagian, lalu uji tombol Back/Forward; URL, judul tab browser dan konten harus tetap sinkron.
- [ ] Pastikan sitemap mencantumkan lima URL bagian utama plus 114 URL surah individual (119 URL total), tanpa URL preview.
- [ ] Buka HTML sumber halaman dan pastikan title, description, canonical, Open Graph, Twitter Card, dan JSON-LD muncul.
- [ ] Pastikan `https://nurani-tiyoy.vercel.app/og-nurani.png` bisa dibuka dan ukurannya 1200×630.
- [ ] Periksa response headers untuk `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, dan `Permissions-Policy`.
- [ ] Jalankan Lighthouse pada build produksi, terutama SEO, Accessibility, Best Practices, dan Performance. Catat masalah dan perbaiki sebelum mengklaim skor tertentu.
- [ ] Pastikan `/google47c4b90e54eddd18.html` menampilkan isi verifikasi Google tanpa login sebelum menekan Verify di Search Console.
- [ ] Verifikasi domain di Google Search Console dan kirim `https://nurani-tiyoy.vercel.app/sitemap.xml`.
- [ ] Uji kartu pratinjau tautan di aplikasi chat/media sosial. Crawler pihak ketiga dapat menyimpan pratinjau lama dalam cache.

> Content-Security-Policy (CSP) belum diaktifkan otomatis. Sebelum menambahkannya, inventarisasi semua origin API, audio, dan font yang benar-benar digunakan, lalu uji policy di preview deployment agar tidak memblokir fitur. Jangan menerapkan CSP ketat tanpa pengujian browser.

## 5. Push ke GitHub

```bash
git status
git add package.json package-lock.json .nvmrc README.md docs/
git commit -m "chore: prepare Nurani for production deployment"
git push
```

Pastikan `.env.local` atau secret pribadi tidak ikut di-commit. Endpoint `NEXT_PUBLIC_*` di `.env.example` adalah URL publik, bukan tempat untuk menyimpan secret.

## 6. Deploy di Vercel

- [ ] Import repository GitHub yang benar.
- [ ] Root Directory menunjuk ke folder yang berisi `package.json`.
- [ ] Framework Preset terdeteksi sebagai Next.js.
- [ ] Node.js dipilih versi 22.x atau versi yang didukung proyek.
- [ ] Build Command menggunakan `npm run build`.
- [ ] Tambahkan environment variables hanya bila ingin mengganti endpoint default.
- [ ] Setelah deployment berhasil, tes URL produksi di ponsel dan desktop.
- [ ] Uji instalasi PWA serta perilaku offline lewat HTTPS.

## Sumber teknis

- [Panduan upgrade Next.js 15](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [Deployment Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)


## Halaman surah individual
- [ ] Buka `/quran/1-al-fatihah` langsung dari tab baru dan pastikan pembaca Al-Qur'an membuka Surah Al-Fatihah.
- [ ] Refresh route detail dan pastikan tidak 404.
- [ ] Dari daftar surah, klik beberapa item dan pastikan URL berubah menjadi `/quran/<nomor>-<slug>`.
- [ ] Uji Back/Forward browser untuk berpindah antara daftar dan detail surah.
- [ ] Periksa title, description, canonical, dan Open Graph pada HTML untuk setidaknya tiga surah berbeda.
- [ ] Pastikan sitemap mencakup 114 URL surah ditambah lima halaman utama (119 total).
- [ ] Setelah membuka satu surah secara online, uji URL yang sama ketika offline.
