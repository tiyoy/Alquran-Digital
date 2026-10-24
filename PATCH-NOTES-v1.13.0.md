# Nurani v1.13.0 — Mode Hemat Audio per Ayat

## Perubahan
- Menambahkan ikon unduh pada setiap kartu ayat untuk menyimpan file audio ayat yang dipilih oleh qari aktif tanpa mengunduh seluruh surah.
- Audio ayat memakai endpoint same-origin `/api/audio-proxy` yang memvalidasi host `cdn.equran.id` dan ruang path MP3 `audio*`; URL dari host lain tetap ditolak.
- Pemutaran ayat memeriksa cache saat offline dan memakai file audio lokal bila tersedia. Jika belum tersimpan, pengguna mendapat pesan yang menjelaskan cara mengunduh ayat terlebih dahulu.
- Metadata audio membedakan track `full` dan `verse` (termasuk nomor ayat), sehingga menyimpan/menghapus ayat tidak mengganti track surah penuh atau ayat lain pada qari yang sama.
- Batas total 200 MiB menghitung semua jenis track, baik audio penuh maupun audio per ayat.
- Service worker dinaikkan ke `nurani-pwa-v23`; nama cache audio offline tetap stabil agar file yang sudah diunduh tidak terhapus saat pembaruan PWA.

## Catatan kualitas
Dokumentasi EQuran menyediakan audio MP3 berkualitas tinggi per surah dan per ayat, tetapi tidak menyebut varian bitrate resmi per file. Mode hemat versi ini bekerja dengan menyimpan hanya ayat yang diperlukan, bukan mengubah bitrate atau mengonversi audio.

## Validasi
- Pemeriksaan sintaks statis dilakukan pada file JavaScript/JSX, route proxy, dan service worker.
- Pengujian helper memeriksa beberapa track (audio penuh dan beberapa ayat) untuk surah/qari yang sama dan menghitung byte total tanpa saling menggantikan.
- Build/lint Next.js penuh dan pengunduhan langsung dari CDN tetap harus diverifikasi dari komputer proyek sebelum deployment.
