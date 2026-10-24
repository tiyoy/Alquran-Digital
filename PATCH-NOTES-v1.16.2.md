# Nurani v1.16.2 — Panduan Warna Tajwid per Surah

## Perubahan

- Menambahkan menu **Panduan warna tajwid** pada setiap halaman pembaca surah, tersedia meskipun mode warna tajwid belum diaktifkan.
- Menyajikan tabel berisi contoh warna yang sama dengan penanda di teks, nama jenis/hukum, ciri pengenalan, serta ringkasan cara membaca untuk 17 penanda dari edisi `quran-tajweed`.
- Menyediakan tata letak tabel responsif: tabel bisa digulir di layar lebar dan berubah menjadi kartu-kartu ringkas pada layar ponsel.
- Menggantikan legenda sederhana pada Pengaturan Tampilan dengan arahan menuju tabel lengkap.
- Memperbarui versi proyek menjadi 1.16.2 dan service worker menjadi `nurani-pwa-v29`.

## Akurasi dan batasan

Warna dan nama anotasi mengikuti dokumentasi edisi tajwid AlQuran.cloud. Warna antar-mushaf dapat berbeda. Ringkasan hukum pada tabel merupakan bantuan belajar; untuk pasangan huruf tertentu dan variasi panjang bacaan, ikuti mushaf/riwayat dan guru yang digunakan. Penanda `silent`, `hamzatul wasal`, dan `lam syamsiyah` adalah anotasi pelafalan dari edisi tersebut, bukan warna hukum panjang bacaan.

## Pemeriksaan sebelum deployment

1. Jalankan `npm run lint` dan `npm run build`.
2. Buka beberapa surah dan pastikan menu Panduan warna tajwid tampil pada masing-masing.
3. Coba mode warna aktif dan nonaktif; pastikan swatch pada tabel cocok dengan warna token di ayat.
4. Periksa layout mode gelap dan ukuran layar ponsel.
