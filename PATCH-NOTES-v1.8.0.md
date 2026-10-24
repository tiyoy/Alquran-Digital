# Nurani v1.8.0 — Catatan Tadabbur per Ayat

## Perubahan
- Menambahkan catatan pribadi pada setiap ayat, dengan tombol tambah/edit pada kartu ayat.
- Catatan maksimal 2.000 karakter per ayat dan dapat disunting atau dihapus.
- Catatan disimpan di `localStorage` dengan key `aq:verse-notes`, sehingga bertahan setelah browser ditutup pada perangkat yang sama.
- Beranda menampilkan tiga catatan terbaru dan menyediakan daftar seluruh catatan jika jumlahnya lebih dari tiga.
- Memperbarui service worker ke `nurani-pwa-v16` agar perangkat mendapat cache versi aplikasi yang baru.
- Menjaga data catatan terpisah dari reset progres khatam; reset progres tidak menghapus catatan.

## Privasi dan batasan
- Catatan hanya disimpan pada browser/perangkat saat ini. Tidak ada akun, backend, atau sinkronisasi antarperangkat.
- Penyimpanan lokal dapat dihapus oleh pengguna/browser dan bisa tidak tersedia jika storage dinonaktifkan atau penuh.
- Catatan dibatasi 500 entri untuk mengendalikan penggunaan localStorage.

## Pengujian yang disarankan
1. Buka surah, pilih tombol pensil pada ayat, simpan catatan.
2. Muat ulang aplikasi dan pastikan catatan tetap tersedia.
3. Buka beranda dan pastikan catatan terbaru muncul; pilih catatan untuk kembali ke ayat yang tepat.
4. Edit, hapus, dan uji modal seluruh catatan jika jumlah catatan lebih dari tiga.
5. Pastikan reset khatam tidak menghapus catatan.
6. Jalankan `npm run lint` dan `npm run build` sebelum deployment.

Status lingkungan pembuat: pemeriksaan sintaks/struktur dilakukan secara statis; build Next.js perlu diverifikasi di lingkungan proyek karena dependensi penuh tidak tersedia di sesi ini.
