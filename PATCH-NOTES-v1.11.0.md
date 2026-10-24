# Nurani v1.11.0 — Unduhan Audio Murottal Offline

## Fitur

- Tombol **Unduh audio** di halaman pembaca untuk menyimpan audio penuh surah berdasarkan qari yang sedang dipilih.
- Progres unduhan dan status tersimpan ditampilkan pada pembaca.
- Pengaturan → Kelola konten offline menampilkan daftar audio yang benar-benar ada di Cache API, estimasi ukuran, nama qari, dan file cache yang hilang.
- Hapus audio per surah atau semua audio offline. Operasi ini tidak menghapus cache ayat, bookmark, catatan, posisi bacaan, atau progres khatam.
- Pemutaran surah saat offline menggunakan berkas audio lokal jika tersedia.

## Batas dan perilaku teknis

- Satu berkas audio disimpan untuk tiap surah; mengunduh versi qari lain akan menggantikan track offline lama untuk surah tersebut setelah unduhan baru berhasil.
- Batas maksimum 80 MB per berkas dan 200 MB total cache audio, ditambah pemeriksaan kuota melalui Storage API bila browser mendukungnya.
- Unduhan memakai `fetch` CORS dan Cache API. Jika host audio tidak memberi izin CORS, unduhan ditolak dan aplikasi menampilkan pesan untuk mencoba kembali; audio streaming biasa tetap menggunakan alur yang sudah ada.
- Cache audio memakai nama tetap `nurani-audio-offline-v1`, sehingga tidak ikut terhapus saat versi service worker PWA berubah.
- Audio tersimpan lokal di origin/browser ini dan tidak dimasukkan ke file backup JSON.
- Metadata hanya ditulis setelah file berhasil masuk ke Cache API. Browser masih dapat membersihkan cache karena keterbatasan penyimpanan; panel pengelola memeriksa file cache aktual.

## Pemeriksaan sebelum produksi

1. Pilih surah dan qari, tekan **Unduh audio**, lalu tunggu hingga selesai.
2. Buka Pengaturan → Kelola konten offline dan pastikan audio terdaftar dengan ukuran file.
3. Aktifkan mode pesawat, lalu tekan **Putar satu surah** untuk surah yang audio-nya telah diunduh.
4. Hapus satu audio dan pastikan teks ayat, bookmark, catatan, serta progres tidak berubah.
5. Hapus semua audio dan pastikan cache ayat tetap tersedia.
6. Jalankan `npm run lint` dan `npm run build` sebelum push.
