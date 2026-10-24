# Nurani v1.17.0 — Mode Belajar Tajwid Interaktif

## Perubahan

- Menambahkan pengaturan **Mode belajar tajwid** di bawah pengaturan Warna Tajwid.
- Saat mode belajar aktif, setiap segmen bertanda pada teks tajwid menjadi tombol yang dapat disentuh/diakses dengan keyboard.
- Ketika penanda disentuh, Nurani menampilkan kartu belajar di bawah ayat terkait berisi nama hukum, nama Arab (bila tersedia), contoh teks dari penanda yang disentuh, ciri pengenalan, dan ringkasan cara membaca.
- Kartu dapat ditutup dan akan hilang saat pengguna membuka surah lain atau menonaktifkan mode.
- Preferensi mode belajar disimpan di `aq:reader-prefs` dan dipertahankan oleh ekspor/impor backup lokal.
- Parser anotasi dan sumber teks tidak diubah; penjelasan dipetakan ke `TAJWEED_RULES` yang sama dengan tabel panduan warna.
- Service worker app shell diperbarui ke `nurani-pwa-v30`.

## Cara mencoba

1. Buka surah, lalu pilih **Tampilan → Warna tajwid**.
2. Aktifkan **Mode belajar tajwid**.
3. Ketuk salah satu segmen huruf berwarna pada ayat yang sudah termuat data tajwid.
4. Kartu penjelasan muncul di bawah ayat. Uji tombol tutup, keyboard/focus, mode gelap, dan tampilan HP.

## Akurasi dan batasan

- Penjelasan berasal dari `TAJWEED_RULES` yang digunakan juga pada Panduan Warna Tajwid; Nurani tidak menyimpulkan hukum baru dari teks Arab.
- Mode belajar hanya interaktif saat data anotasi tajwid surah berhasil dimuat. Jika data tidak tersedia, teks standar tetap dapat dibaca dan pengaturan akan menampilkan status pemuatan/error.
- Ini alat bantu belajar, bukan pengganti mushaf/riwayat yang digunakan atau bimbingan guru tajwid.

## Pemeriksaan sebelum deployment

- Jalankan `npm run lint` dan `npm run build`.
- Uji mode warna ON/OFF dan mode belajar ON/OFF.
- Ketuk beberapa penanda berbeda serta pastikan informasi yang tampil sesuai aturan dari tabel 17 penanda.
- Uji dengan keyboard, mode gelap, layar HP, dan ekspor/impor backup.
