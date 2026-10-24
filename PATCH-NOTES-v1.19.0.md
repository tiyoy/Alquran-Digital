# Nurani v1.19.0 — Statistik Tilawah dan Target Harian

## Fitur
- Menambahkan halaman `/statistik-tilawah` dengan ringkasan progres, rentetan aktif/terbaik, grafik 7 hari, kalender 30 hari, serta rincian bacaan.
- Menambahkan target pribadi ayat per hari (1–200), preset 5/10/20/30/50/100, dan penyunting target khusus.
- Memperbarui kartu target di beranda agar menampilkan capaian target pribadi dan pintasan ke halaman statistik.
- Menambahkan key `aq:daily-verse-target` ke backup lokal dengan validasi integer 1–200.
- Menambahkan metadata SEO, sitemap melalui `SECTION_ROUTES`, app-shell route, dan service worker v32.

## Penghitungan
- Aktivitas harian menghitung ayat unik yang tercatat pada tanggal tersebut.
- Progres total menggunakan ayat unik dalam `aq:read-verse-keys` dengan maksimum 6.236.
- Rentetan saat ini tetap dihitung aktif jika pengguna membaca hari ini atau hari sebelumnya; rentetan terbaik dihitung dari tanggal aktif yang tersedia.
- Riwayat aktivitas lokal dibatasi ke 90 tanggal terakhir.
- Tidak ada pengukuran durasi membaca, dan data tidak dikirim ke server.

## Validasi dilakukan
- Pemeriksaan parsing TypeScript/JSX untuk seluruh source.
- Pengujian helper: target harian, target tercapai, hari aktif, rentetan saat ini/terbaik, kondisi tanpa data, dan fallback streak dari hari sebelumnya.
- Pengujian validasi backup untuk target harian yang valid, penolakan nilai di luar 1–200, serta kompatibilitas backup lama yang tidak memiliki target baru.
- Parsing CSS, sintaks service worker, konfigurasi JSON, dan integritas ZIP.

`npm run lint` dan `npm run build` perlu dijalankan di lingkungan proyek dengan dependensi terpasang sebelum deployment produksi.
