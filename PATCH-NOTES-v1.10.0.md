# Nurani v1.10.0 — Pengelolaan Konten Offline

## Perubahan
- Menambahkan panel Pengaturan > Kelola konten offline.
- Menunjukkan jumlah surah tersimpan, ukuran cache ayat lokal, serta estimasi usage/quota browser bila tersedia.
- Menyediakan navigasi ke surah yang tersimpan, penghapusan per surah, dan penghapusan seluruh cache ayat.
- Penghapusan cache ayat tetap mempertahankan bookmark, catatan tadabbur, bacaan terakhir, progres khatam, favorit Asmaul Husna, tema, dan preferensi pembaca.
- Tombol Simpan offline meminta service worker melakukan precache best-effort untuk halaman surah dan URL ayat yang sedang dipilih.
- Service worker dapat menghapus cache rute dan endpoint API yang terkait dengan surah yang dihapus.
- Service worker dinaikkan menjadi `nurani-pwa-v18`.
- Versi aplikasi dan versi yang dicatat di file backup berubah menjadi `1.10.0`.

## Validasi
- Lakukan pemeriksaan sintaks untuk modul helper dan service worker.
- Jalankan `npm run lint` serta `npm run build` dengan dependensi proyek sudah terpasang sebelum push/deploy.
- Uji skenario offline secara manual pada browser/perangkat target.

## Catatan
Storage quota browser adalah estimasi tingkat origin; bukan ukuran yang spesifik hanya untuk Nurani. Precaching HTML untuk rute dinamis bersifat best-effort, sementara cache data ayat lokal tetap menjadi fallback utama di aplikasi.
