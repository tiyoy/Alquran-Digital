# Audit SEO & Produksi — Nurani

## Implementasi dalam source code

- Metadata dasar bahasa Indonesia: title, description, keyword kontekstual, canonical, robots, Googlebot.
- Open Graph/Twitter Card dengan aset `public/og-nurani.png` (1200×630).
- Structured data JSON-LD bertipe `WebApplication` dan `inLanguage: id-ID`.
- `src/app/robots.js` menghasilkan `/robots.txt`.
- `src/app/sitemap.js` menghasilkan `/sitemap.xml` untuk URL kanonis utama.
- `NEXT_PUBLIC_SITE_URL` dipakai untuk membuat URL absolut yang konsisten.
- Deployment Preview di Vercel mengirim metadata `noindex` agar URL preview tidak bersaing dengan URL produksi di mesin pencari.
- Header dasar: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, dan `Permissions-Policy`.
- Service worker dinaikkan ke `nurani-pwa-v9` supaya klien PWA memperbarui cache pada rilis ini.

## Batasan yang diketahui

1. Nurani saat ini merupakan single-page app: tab Al-Qur'an, Doa, Shalat, dan Asmaul Husna adalah state UI, bukan route URL tersendiri. Karena itu sitemap hanya memasukkan homepage. Untuk SEO per surah atau per doa, buat route server-rendered yang memiliki metadata unik terlebih dahulu.
2. CSP belum diberlakukan sampai origin API, media audio, dan font terverifikasi; policy yang terlalu ketat dapat memutus fitur.
3. SEO tidak menjamin indexing atau ranking. Search Console harus diverifikasi oleh pemilik situs.
4. Lighthouse, build produksi, crawler sosial dan browser nyata tetap perlu dijalankan pada deployment setelah push.

## Pemeriksaan setelah deployment

```bash
# Browser atau terminal yang mendukung curl
curl -I https://nurani-tiyoy.vercel.app/
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
