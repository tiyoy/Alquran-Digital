# Patch Nurani v1.6.1 — SEO rendering ayat

## Perubahan
- Menambahkan `src/lib/server-quran.js` untuk mengambil dan menormalisasi ayat di server dengan cache Next.js 24 jam dan timeout 5 detik.
- Memperbarui route ayat agar mengirim data ayat awal ke komponen pembaca.
- Memperbarui komponen pembaca agar memakai data server saat tersedia, menyimpannya ke cache lokal, dan mempertahankan scroll/highlight ayat yang dituju.
- Memperbarui versi ke 1.6.1, README, dan dokumentasi audit SEO/produksi.

## Cara menerapkan patch
1. Buat backup proyek yang sekarang.
2. Ekstrak ZIP patch ke root repository proyek, lalu timpa file yang sama.
3. Jalankan `npm install` jika lingkungan lokal belum memiliki dependensi, lalu `npm run lint` dan `npm run build`.
4. Uji URL ayat langsung dan **View Page Source** sebelum push ke branch produksi.

## Status validasi
Pemeriksaan sintaks statis untuk file yang berubah lulus, dan pemeriksaan angka surah/ayat menghasilkan 114 surah dan 6.236 ayat. `npm run build` belum dapat dijalankan di lingkungan penyusunan patch ini karena dependensi Next.js tidak terpasang (`next: not found`) dan tidak tersedia akses jaringan untuk memasangnya. Karena itu, build produksi harus diverifikasi di komputer pengembang sebelum deploy.
