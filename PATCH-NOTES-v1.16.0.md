# Nurani v1.16.0 — Warna Tajwid Digital

## Ringkasan

- Menambahkan sakelar **Warna tajwid** pada Pengaturan bacaan.
- Mengambil teks beranotasi dari edisi `quran-tajweed` melalui endpoint same-origin `/api/tajweed/[surah]`.
- Mengurai penanda seperti `[h:9421[ٱ]` menjadi segmen React dengan kode warna eksplisit, tanpa `dangerouslySetInnerHTML`.
- Menambahkan legenda 17 kategori warna dan atribusi ke AlQuran.cloud / Islamic Network.
- Mengingat tiga surah terakhir yang telah dimuat di `localStorage` (`aq:tajweed-cache`) untuk akses ulang, termasuk fallback dari cache API service worker.
- Menyimpan pilihan toggle dalam `aq:reader-prefs`, sehingga pilihan pengguna ikut dalam backup/pulihkan preferensi yang sudah ada.
- Menaikkan versi service worker menjadi `nurani-pwa-v27` dan versi package ke `1.16.0`.

## Cara kerja dan catatan akurasi

Data warna berasal dari edition `quran-tajweed` di AlQuran.cloud. Kode tidak menginferensikan hukum tajwid sendiri. Saat toggle mati, Nurani menampilkan teks standar yang sebelumnya sudah digunakan. Saat toggle aktif, teks Arab beranotasi berasal dari edition eksternal; tampilan transliterasi dan terjemahan tetap mengikuti data Nurani.

Jika endpoint tidak tersedia, teks standar tetap bisa dibaca dan UI menampilkan status gagal serta tombol coba lagi. Jangan menghapus/mengoreksi tanda anotasi menjadi markup HTML; parser mengubah penanda data menjadi teks dan span React yang aman.

## File utama

- `src/lib/tajweed.js`: daftar warna, parsing anotasi, validasi dan cache lokal.
- `src/app/api/tajweed/[surah]/route.js`: endpoint server untuk edition `quran-tajweed`, timeout dan cache 24 jam.
- `src/components/NuraniApp.jsx`: kontrol toggle, pemuatan dan tampilan anotasi.
- `src/app/globals.css`: warna tajwid, legenda dan kontras dark mode.
- `src/app/layout.jsx`: SEO feature keywords.
- `src/lib/local-backup.js`: mempertahankan pilihan warna tajwid dalam backup pengaturan.
- `public/sw.js`: cache network-first untuk endpoint tajwid dan fallback dari cache saat offline.

## Cara menguji

1. Buka pembaca Al-Qur'an saat online, buka **Tampilan**, lalu aktifkan **Warna tajwid**.
2. Pastikan penanda memuat, daftar legenda bisa dibuka, dan ada atribusi sumber.
3. Pindah ke surah lain ketika mode tetap aktif; pastikan data surah yang baru dimuat.
4. Matikan toggle dan pastikan teks standar kembali.
5. Uji mode gelap, ukuran teks Arab, dan mode offline untuk surah yang sudah dimuat sebelumnya.
6. Ekspor backup pengaturan, lalu periksa `aq:reader-prefs.tajweedEnabled` ikut disertakan.
7. Jalankan `npm run lint` dan `npm run build` sebelum deploy.

## Validasi yang diketahui

Pemeriksaan sintaks statis JavaScript/JSX/TypeScript, helper parsing dan normalisasi, serta parsing CSS dilakukan pada paket sumber. Build Next.js penuh dan permintaan API langsung tidak dijalankan pada lingkungan ini karena dependensi proyek tidak tersedia dan akses jaringan runtime tidak tersedia. Jalankan lint/build lokal dan uji respons API di Vercel sebelum produksi.

## Sumber

- Panduan warna dan format anotasi: https://alquran.cloud/tajweed-guide
- Dokumentasi API: https://alquran.cloud/api
