# Audit SEO & Produksi — Nurani

## Implementasi dalam source code

- Metadata dasar bahasa Indonesia: title, description, keyword kontekstual, canonical, robots, Googlebot.
- Open Graph/Twitter Card dengan aset `public/og-nurani.png` (1200×630).
- Structured data JSON-LD bertipe `WebApplication` dan `inLanguage: id-ID`.
- `src/app/robots.js` menghasilkan `/robots.txt`.
- `src/app/sitemap.js` menghasilkan `/sitemap.xml` untuk lima URL bagian utama, 114 halaman surah, dan 6.236 halaman ayat (total 6.355 URL).
- `NEXT_PUBLIC_SITE_URL` dipakai untuk membuat URL absolut yang konsisten.
- Deployment Preview di Vercel mengirim metadata `noindex` agar URL preview tidak bersaing dengan URL produksi di mesin pencari.
- Header dasar: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, dan `Permissions-Policy`.
- Service worker memakai cache versi `nurani-pwa-v14`, memanaskan cache untuk bagian utama dan Surah Al-Fatihah, serta menyimpan dokumen navigasi pada URL persis yang dikunjungi.

## Batasan yang diketahui

1. Lima route bagian utama dan 114 route surah memiliki URL sendiri. Doa individual belum mempunyai URL tersendiri. Ayat individual kini memiliki URL `/quran/<nomor>-<slug>/<nomor-ayat>`.
2. CSP belum diberlakukan sampai origin API, media audio, dan font terverifikasi; policy yang terlalu ketat dapat memutus fitur.
3. SEO tidak menjamin indexing atau ranking. Search Console harus diverifikasi oleh pemilik situs.
4. Lighthouse, build produksi, crawler sosial dan browser nyata tetap perlu dijalankan pada deployment setelah push.

## Pemeriksaan setelah deployment

```bash
# Browser atau terminal yang mendukung curl
curl -I https://nurani-tiyoy.vercel.app/
curl -I https://nurani-tiyoy.vercel.app/quran/1-al-fatihah
curl -I https://nurani-tiyoy.vercel.app/robots.txt
curl -I https://nurani-tiyoy.vercel.app/sitemap.xml
curl -I https://nurani-tiyoy.vercel.app/og-nurani.png
```

Pastikan endpoint memberikan status 200, sitemap menggunakan domain kanonis yang benar, header keamanan tampak pada response, dan gambar OG dapat diakses. Kemudian cek HTML head, JSON-LD, Lighthouse, dan preview card dari layanan terkait.

## Urutan peluncuran yang disarankan

1. Jalankan `npm install`, `npm run lint`, dan `npm run build`.
2. Commit `package-lock.json` agar versi transitive dependency terkunci.
3. Push ke branch produksi GitHub yang terhubung ke Vercel.
4. Tunggu deployment sukses dan jalankan checklist di atas.
5. Daftarkan situs pada Google Search Console dan submit sitemap.
6. Tinjau laporan Search Console dan Lighthouse setelah data mulai terkumpul.


## Pembaruan route SEO

Empat bagian tambahan `/quran`, `/jadwal-shalat`, `/doa`, dan `/asmaul-husna` beserta homepage dapat dibuka langsung dan memiliki metadata unik. Setiap surah juga mempunyai URL mandiri `/quran/<nomor>-<slug>`, dibuat secara statis dan ditambahkan ke sitemap. Navigasi bawah tetap memakai perpindahan client-side dan menyediakan link `href` standar.


## Route SEO utama

- `/quran` — baca Al-Qur’an online dan terjemahan.
- `/jadwal-shalat` — jadwal shalat Kabupaten Bogor dan Indonesia.
- `/doa` — doa harian Arab, Latin, dan artinya.
- `/asmaul-husna` — 99 Asmaul Husna dan artinya.

Konfigurasi route bersama berada di `src/lib/section-routes.js` dan dipakai oleh metadata tiap halaman, update metadata saat navigasi client-side, serta sitemap. UI interaktif bersama berada di `src/components/NuraniApp.jsx`; setiap route App Router mengimpor komponen tersebut, bukan halaman route lain.


## SEO surah individual
- Setiap surah memakai route statis `/quran/<nomor>-<slug>`.
- Sitemap menyertakan lima route bagian utama, 114 route surah, dan 6.236 route ayat.
- Daftar surah memakai anchor HTML dengan URL kanonis agar dapat dijelajahi crawler.
- Metadata per surah menyediakan title, description, canonical, Open Graph, dan Twitter Card.
- Service worker v14 menyimpan navigasi pada URL aktual yang dikunjungi; cache homepage tidak lagi tertimpa oleh response halaman lain.
- Build produksi dan pengujian browser masih perlu dijalankan setelah dependency berhasil dipasang.


## URL ayat individual (v1.6.0)

- Setiap ayat dapat dibuka langsung melalui pola `/quran/<nomor>-<slug>/<nomor-ayat>`, misalnya `/quran/1-al-fatihah/1`.
- Route memvalidasi nomor surah dan nomor ayat; parameter yang tidak valid memunculkan halaman 404.
- Metadata per ayat meliputi title, description, canonical, Open Graph, dan Twitter Card.
- Kartu setiap ayat memiliki tombol **Bagikan ayat**. Perangkat yang mendukung Web Share membuka dialog berbagi; browser lain menyalin teks ayat dan tautannya.
- Ketika tautan dibuka, aplikasi membuka surah terkait, menggulir ke ayat yang diminta, dan menyorot ayat tujuan.
- Sitemap mencantumkan URL semua ayat (6.236 URL) agar crawler dapat menemukan halaman ayat.
- Route ayat dirender saat diminta agar build tidak perlu memprerender seluruh 6.236 halaman.
