# Patch Nurani v1.7.0 — URL Individual Doa Harian

## Perubahan
- Menambahkan dynamic route `src/app/doa/[slug]/page.jsx` untuk halaman doa harian individual.
- Memindahkan normalisasi data doa ke `src/lib/duas.js` agar client dan server memakai aturan yang sama.
- Menambahkan `src/lib/dua-routes.js` untuk membentuk URL stabil berdasarkan ID dan judul.
- Menambahkan `src/lib/server-duas.js` untuk mengambil katalog doa di server dengan cache 24 jam dan timeout 5 detik, dengan lima doa cadangan bila sumber tidak tersedia.
- Setiap kartu doa kini menyediakan tombol **Bagikan doa** dan **Buka doa**.
- Halaman individual menampilkan Arab, Latin, terjemahan, sumber, salin, dan bagikan.
- Metadata SEO individual mencakup title, description, canonical, Open Graph, dan Twitter Card.
- `/sitemap.xml` kini memuat URL dari katalog doa yang tersedia.
- Service worker diubah ke `nurani-pwa-v15` dan menambahkan beberapa URL doa cadangan ke app shell.
- Versi proyek diperbarui menjadi `1.7.0`.

## Cara menerapkan patch
1. Cadangkan repository proyek Nurani.
2. Ekstrak ZIP patch ke root repository, lalu timpa file yang sama.
3. Jalankan `npm install` bila diperlukan, kemudian `npm run lint` dan `npm run build`.
4. Push ke GitHub dan tunggu deployment Vercel selesai.
5. Uji `/doa`, `/doa/1-doa-sebelum-makan`, `/doa/2-doa-sesudah-makan`, tombol berbagi, tombol kembali, dan `/sitemap.xml`.

## Status validasi
- Pemeriksaan sintaks terhadap seluruh 24 file JavaScript/JSX di bawah `src` tidak menemukan diagnostic sintaks.
- Helper URL diuji dengan contoh doa sebelum makan, sesudah makan, serta judul dengan tanda apostrof; parser route diuji terhadap detail dan route koleksi.
- `public/sw.js` lolos `node --check`.
- `npm run lint` dan `npm run build` belum dapat dijalankan pada lingkungan penyiapan karena dependensi Next.js tidak terpasang dan registry npm tidak dapat dijangkau (`EAI_AGAIN`). Jalankan kedua perintah itu secara lokal sebelum deployment produksi.

## Catatan data
Katalog utama tetap berasal dari EQuran.id. Jika API tidak tersedia, lima doa cadangan yang dibundel dapat dibuka secara langsung; tautan doa lain bergantung pada ketersediaan katalog/API ketika permintaan server dilakukan.
