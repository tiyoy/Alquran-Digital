# Nurani v1.13.1 — Tombol Unduh Audio Ayat

## Perbaikan
- Menambahkan tombol berlabel **Unduh audio ayat** secara eksplisit di setiap kartu ayat, agar mudah ditemukan di layar HP (sebelumnya hanya ikon kecil di baris aksi).
- Tombol tetap dapat ditekan saat alamat audio belum ada di cache metadata; aplikasi mengambil ulang detail surah dari API EQuran, menyimpan metadata terbaru ke localStorage, lalu mencoba unduhan.
- Jika sebuah track ayat sudah tersimpan berdasarkan surah, nomor ayat, dan qari, UI tetap menampilkan status tersimpan meskipun payload teks lokal yang lebih lama tidak memiliki peta audio.
- Pemutar ayat menggunakan track lokal sebagai fallback jika metadata ayat tidak membawa URL audio.
- Service worker dinaikkan ke `nurani-pwa-v24` supaya shell/cache halaman terbaru dapat diaktifkan setelah deployment.

## Pengujian manual yang disarankan
1. Deploy ke Vercel dan refresh PWA (tutup/buka ulang aplikasi jika dipasang ke home screen).
2. Buka surah saat online; setiap kartu ayat harus menampilkan tombol **Unduh audio ayat**.
3. Tekan unduh pada ayat yang belum tersimpan. Tombol akan mengambil ulang metadata jika URL audio tidak ada lalu menampilkan progres.
4. Pastikan status berubah menjadi **Audio ayat tersimpan**, dan audio dapat diputar saat offline.

## Status validasi
Pemeriksaan dilakukan pada perubahan sintaks JSX/CSS dan struktur service worker. Build Next.js penuh belum dijalankan dalam lingkungan penyusunan ini; jalankan `npm run lint` dan `npm run build` sebelum deployment.
