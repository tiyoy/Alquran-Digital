# Warna Tajwid Digital

Nurani v1.16.0 menyertakan mode warna tajwid opt-in. Pengguna mengaktifkannya di **Pembaca Al-Qur'an → Tampilan → Warna tajwid**.

## Sumber data

Mode warna memakai edition `quran-tajweed` yang disediakan oleh AlQuran.cloud / Islamic Network. Peraturan warna bersumber dari [Tajweed Guide](https://alquran.cloud/tajweed-guide), yang mendokumentasikan 17 kode dan format anotasi seperti `[h:9421[ٱ]` maupun `[l[ل]`. Lihat juga [dokumentasi API](https://alquran.cloud/api).

Nurani tidak membuat inferensi hukum tajwid sendiri. Format beranotasi diparsing menjadi text segments dan React spans, bukan disuntikkan sebagai HTML. Saat mode mati atau data gagal dimuat, teks standar Nurani tetap tersedia.

## Arsitektur

- `/api/tajweed/[surah]`: route server memvalidasi nomor surah (1–114), meminta edition tajwid, memakai timeout 8 detik dan revalidate 24 jam.
- `src/lib/tajweed.js`: tabel 17 kode warna, parser marker, normalizer nomor ayat, dan cache tiga surah terakhir.
- `aq:tajweed-cache`: cache lokal opsional untuk tiga surah terakhir. Data ini tidak dimasukkan ke backup karena hanya merupakan data referensi yang bisa diambil ulang.
- `aq:reader-prefs.tajweedEnabled`: preferensi toggle ikut dalam backup pembaca yang sudah ada.
- Service worker: request `/api/tajweed/` menggunakan network-first dan menyimpan respons berhasil di API cache untuk fallback offline.

## Batasan dan pemeriksaan

- Kualitas penanda bergantung pada anotasi edition eksternal; Nurani tidak menyatakan telah melakukan audit tajwid mandiri per kata.
- Saat mode aktif, teks Arab berasal dari edition `quran-tajweed`, tidak dari sumber teks standar yang ditampilkan ketika toggle mati. Legenda dan atribusi ditampilkan supaya pergantian sumber ini jelas.
- Ketika offline, hanya surah yang sudah dimuat dan yang masih berada di cache tiga surah terakhir yang tersedia untuk mode berwarna. Teks standar tetap dapat dibaca.
- Cache API hanya menyimpan respons yang berhasil. Data tajwid tidak disisipkan ke HTML atau ke teks standar secara permanen.
- Uji langsung endpoint, `npm run lint`, dan `npm run build` wajib dilakukan sebelum deployment.
