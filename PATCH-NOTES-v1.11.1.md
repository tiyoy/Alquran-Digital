# Nurani v1.11.1 — Perbaikan Tombol Unduh Audio

## Masalah yang diperbaiki
- Tombol `Unduh audio` dapat tetap disabled ketika pembaca dibuka melalui URL langsung atau metadata surah berasal dari cache/fallback yang belum memuat `audioFull`.
- ID qari dari EQuran tidak sama dengan urutan label pada dropdown sebelumnya, sehingga URL yang dipilih dapat menunjuk qari yang berbeda dari label.

## Perubahan
- Metadata audio diselaraskan dengan katalog surah terbaru ketika tersedia.
- Jika `audioFull` belum tersedia pada metadata pembaca, tombol unduh akan mencoba memuat ulang metadata detail surah sekali sebelum menampilkan pesan kegagalan.
- Pemetaan qari memakai ID EQuran yang benar, tanpa mengubah qari default Misyari.
- Menambahkan pilihan Yasser Al-Dosari sebagai qari keenam.
- Tombol Unduh audio tidak lagi disabled hanya karena URL sumber belum selesai dimuat; klik akan memberi pesan yang menjelaskan langkah pemulihan. Tombol tetap disabled saat offline, saat unduhan berlangsung, atau saat audio qari yang sama sudah tersimpan.
- Ketika API menyajikan beberapa URL qari tetapi bentuk datanya tidak dikenali, aplikasi tidak diam-diam memilih audio qari lain.

## Pengujian
- Helper `chooseAudio` diuji untuk objek URL berkunci ID `01`-`06`, array URL, URL tunggal, metadata kosong, dan fallback yang tidak boleh salah memilih qari.
- Pemeriksaan sintaks dilakukan pada file sumber yang berubah.
- `npm run lint` dan `npm run build` harus dijalankan di komputer proyek sebelum deploy karena dependensi Next.js tidak tersedia di lingkungan penyusunan patch ini.
