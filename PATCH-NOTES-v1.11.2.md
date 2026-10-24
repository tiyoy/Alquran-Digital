# Nurani v1.11.2 — Perbaikan Unduhan Audio Murottal

## Perubahan
- Unduhan MP3 tidak lagi melakukan `fetch` langsung dari browser ke `cdn.equran.id`, yang bisa gagal bila CDN tidak mengizinkan CORS.
- Ditambahkan route `/api/audio-proxy` yang memvalidasi host/path audio-full EQuran dan meneruskan file secara streaming satu arah.
- Proxy meneruskan metadata panjang/tipe file agar indikator progres tetap bekerja dan tidak mengumpulkan seluruh audio di memori server.
- Client mencoba unduhan berbasis byte range dalam potongan 4 MiB untuk mencegah satu fungsi menahan stream surah panjang sampai timeout. Jika CDN mengabaikan `Range`, aplikasi kembali ke stream penuh.
- Pesan error proxy yang relevan ditampilkan di aplikasi.
- Service worker dinaikkan ke `nurani-pwa-v21` dan route audio proxy dikecualikan dari cache runtime agar file besar tidak disalin ke cache yang salah.

## Batasan dan pengujian
- Host yang diizinkan adalah `cdn.equran.id` dan pola `/audio-full/{qari}/{NNN}.mp3`, mengikuti contoh URL audio penuh pada dokumentasi EQuran.
- Pemeriksaan sintaks statis dilakukan untuk route API dan service worker. Build/lint penuh serta pengunduhan nyata harus diverifikasi dari komputer proyek/Vercel karena lingkungan penyusunan tidak dapat mengakses CDN dan dependensi npm.
- Proxy tidak melewati batas ukuran file produk 80 MB per audio / 200 MB total yang sudah diterapkan pada sisi aplikasi.
