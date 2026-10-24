# Nurani v1.16.1 — Perbaikan parser warna tajwid

## Masalah

Edisi tajwid yang diterima Nurani dapat menggunakan dua bentuk anotasi: `[h:9421[ٱ]` (dengan ID) dan `[l[ل]` (tanpa ID). Parser sebelumnya hanya mengenali bentuk pertama, sehingga bentuk kedua tampil sebagai teks literal seperti `[l[ل]`, `[n[ـٰ]`, dan `[p[ِي]`.

## Perbaikan

- Parser sekarang menerima ID anotasi yang opsional.
- Semua kode tajwid yang dikenal dirender sebagai span berwarna.
- Jika kode baru yang belum dikenal muncul, konten Arab tetap ditampilkan tanpa syntax marker mentah.
- Versi service worker dinaikkan ke `nurani-pwa-v28` untuk menghindari cache aplikasi lama.

## Uji yang perlu dilakukan

1. Jalankan `npm run lint` dan `npm run build`.
2. Deploy ke Vercel.
3. Di aplikasi, matikan dan aktifkan lagi **Warna tajwid** lalu buka Al-Fatihah.
4. Pastikan string `[l[`, `[n[`, `[p[` tidak tampak; huruf terkait semestinya terwarnai sesuai legenda.
5. Coba surah lain, lalu matikan tajwid untuk memastikan teks standar tetap normal.

Catatan: perubahan ini memperbaiki parsing format anotasi; ketepatan warna tetap mengikuti anotasi sumber AlQuran.cloud.
