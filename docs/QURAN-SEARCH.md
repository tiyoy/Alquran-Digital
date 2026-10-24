# Pencarian Al-Qur'an Terpadu — v1.18.0

## Fitur

- Route `/pencarian`, juga tersedia dari navigasi bawah dan pintasan daftar surah.
- Cari teks Arab, terjemahan Bahasa Indonesia, dan transliterasi Latin.
- Filter ke seluruh mushaf atau salah satu dari 114 surah.
- Hasil menunjukkan referensi surah:ayat, cuplikan yang cocok, serta tindakan Buka Ayat, Bookmark, dan Bagikan.
- Debounce 350 ms, hasil maksimum 60 ayat unik (maksimum 25 dari setiap sumber edisi), serta tombol untuk menampilkan hasil berikutnya.
- Fallback offline hanya mencari ayat yang telah disimpan di `localStorage` (`aq:verses:{surahNumber}`). Hasil offline diberi pemberitahuan dan tidak diklaim sebagai pencarian seluruh mushaf.

## Sumber pencarian

Route server `/api/quran-search` menggunakan endpoint pencarian legacy AlQuran.cloud yang terdokumentasi:

- Teks Arab: `quran-simple-clean` (membantu mencari teks tanpa harakat). Untuk pencarian Arab, harakat pada kata kunci dibersihkan khusus pada permintaan ke edisi ini agar cocok dengan teks sumber yang bersih; query asli tetap dipakai untuk terjemahan dan transliterasi.
- Terjemahan Indonesia: `id.indonesian`.
- Transliterasi Latin: `en.transliteration`.

Hasil dari sumber-sumber tersebut digabung berdasarkan `surah.number` dan `numberInSurah`. Teks di setiap hasil ditandai sesuai jenis edisi yang benar-benar cocok. Transliterasi mengikuti edisi publik tersebut dan dapat berbeda dari transliterasi pilihan lembaga atau guru tertentu.

## API internal

`GET /api/quran-search?q={keyword}&type={all|arabic|translation|latin}&surah={all|1..114}`

- Query wajib minimal 2 karakter dan dipotong maksimal 80 karakter setelah pembersihan karakter kontrol.
- Filter surah divalidasi terhadap 1–114.
- Tiap sumber diambil secara paralel; bila hanya sebagian sumber gagal, hasil yang tersedia tetap dikembalikan dan UI menampilkan pemberitahuan.
- Respons diberi `Cache-Control: no-store`; permintaan upstream dapat direvalidasi Next.js setelah 30 menit.
- Ketika semua sumber gagal, endpoint mengembalikan status 502 dengan pesan yang dapat ditampilkan UI.

## Uji manual

1. Buka `/pencarian` dan cari `sabar` pada mode Semua.
2. Cari `الرحمن` dengan mode Teks Arab.
3. Cari `Bismillaah` pada mode Transliterasi Latin.
4. Pilih satu surah pada filter; semua hasil harus berasal dari surah tersebut.
5. Buka hasil, simpan bookmark, dan bagikan tautan ayat.
6. Putus internet dan cari lagi: hanya hasil dari ayat yang tersimpan lokal yang boleh muncul.
7. Periksa filter pencarian, tombol Coba lagi, mode gelap, layout HP, dan navigation Back/Forward.
