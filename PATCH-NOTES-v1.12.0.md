# Nurani v1.12.0 — Pengelolaan Audio per Qari

## Perubahan
- Penyimpanan metadata audio offline sekarang menggunakan identitas surah + qari, bukan surah saja. Pengguna dapat menyimpan audio surah yang sama dari beberapa qari.
- Mengganti unduhan untuk qari yang sama akan memperbarui track qari tersebut tanpa menghapus audio qari lain pada surah yang sama.
- Batas total penyimpanan 200 MB menghitung seluruh audio lintas qari, kecuali track qari yang sedang diganti.
- Panel Pengaturan → Kelola konten offline kini memiliki filter qari, menampilkan jumlah file dan qari yang tersimpan, serta tombol untuk menghapus seluruh audio milik qari yang dipilih.
- Audio individual tetap dapat dihapus dan penghapusan cache audio tidak menghapus bookmark, catatan, cache ayat, maupun progres bacaan.
- Service worker dinaikkan ke `nurani-pwa-v22`; cache audio offline memakai nama yang stabil agar audio yang telah disimpan tidak terhapus oleh pembaruan service worker.

## Tentang kualitas audio
Dokumentasi publik EQuran v2 yang diperiksa mendeskripsikan audio penuh sebagai MP3 berkualitas tinggi per qari/surah, tetapi tidak mendokumentasikan pilihan bitrate rendah/tinggi untuk file yang sama. Antarmuka tidak menampilkan pilihan kualitas palsu. Untuk versi ini, ukuran aktual ditampilkan setelah unduhan; penghematan ruang dilakukan dengan memilih qari yang benar-benar digunakan dan menghapus file lain. Selector bitrate baru layak ditambahkan bila sumber menyediakan beberapa varian atau proyek memiliki proses transcoding yang nyata.

## Verifikasi
- Pemeriksaan sintaks TypeScript parser pada file JSX/JavaScript yang berubah.
- Pengujian helper: dua qari untuk surah yang sama tetap disimpan, ID qari diinferensikan dari URL, upsert memperbarui qari yang sama saja, dan total bytes dihitung dengan benar.
- Pemeriksaan integritas ZIP patch dan source.
- `npm run lint` dan `npm run build` perlu dijalankan pada lingkungan proyek karena dependensi Next.js tidak terpasang di lingkungan penyusunan ini.
