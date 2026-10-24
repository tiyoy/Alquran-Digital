# Nurani v1.18.0 — Pencarian Al-Qur'an Terpadu

- Menambahkan halaman `/pencarian`, metadata SEO, sitemap otomatis, pintasan PWA, dan item navigasi Cari.
- Menambahkan API route server untuk mencari teks Arab, terjemahan Indonesia, dan transliterasi Latin dari edisi AlQuran.cloud.
- Menggabungkan hasil dengan key surah:ayat serta menyediakan filter surah, pembatasan hasil, bookmark, bagikan tautan, dan buka ayat.
- Normalisasi harakat pada kata kunci khusus untuk pencarian di edisi `quran-simple-clean`, agar pencarian Arab yang diketik dengan harakat juga dapat dicocokkan dengan teks sumber tanpa harakat.
- Menambahkan fallback offline yang hanya mencari ayat yang sudah tersimpan secara lokal, dengan keterangan yang transparan.
- Memperbarui service worker ke `nurani-pwa-v31`.
- Mempertahankan Tailwind CSS `3.4.17` dan konfigurasi PostCSS yang diperbaiki pada v1.17.1.

## Pemasangan

1. Cadangkan repository terlebih dahulu.
2. Ekstrak patch di root proyek, tempat `package.json` berada.
3. Jalankan `npm run lint` lalu `npm run build`.
4. Jika keduanya berhasil, commit dan push ke GitHub agar Vercel melakukan deployment.

Build Next.js harus diverifikasi pada lingkungan proyek pengguna sebelum deployment.
