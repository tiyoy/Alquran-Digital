# Catatan Tadabbur per Ayat — v1.8.0

## Penggunaan
1. Buka salah satu surah pada halaman Al-Qur'an.
2. Tekan ikon pensil pada bagian aksi ayat untuk menambah atau menyunting catatan.
3. Isi catatan maksimal 2.000 karakter dan tekan **Simpan catatan**.
4. Catatan yang tersimpan muncul pada kartu ayat dan bagian **Catatan tadabbur** di beranda.
5. Pilih catatan di beranda untuk kembali ke surah dan ayat terkait. Jika catatan lebih dari tiga, gunakan **Lihat semua catatan** untuk menelusuri daftar; dari daftar tersebut catatan juga dapat dibuka atau dihapus.

## Perilaku penyimpanan
- Key localStorage: `aq:verse-notes`.
- Tiap catatan diidentifikasi dengan pasangan `nomorSurah:nomorAyat`.
- Batas panjang: 2.000 karakter per catatan. Batas jumlah: 500 catatan yang paling baru diperbarui.
- Catatan tidak ikut terhapus saat progres khatam direset.
- Data hanya ada di browser/perangkat yang digunakan; tidak ada backup cloud atau sinkronisasi otomatis. Menghapus data browser dapat menghapus catatan.

## Checklist uji manual
- [ ] Tambah catatan, muat ulang, dan pastikan catatan tetap muncul.
- [ ] Edit catatan dan pastikan isinya diperbarui.
- [ ] Hapus catatan dari editor dan dari daftar seluruh catatan.
- [ ] Simpan lebih dari tiga catatan dan buka daftar seluruh catatan.
- [ ] Pilih catatan dari beranda/daftar dan pastikan surah serta ayat yang tepat terbuka.
- [ ] Reset target khatam dan pastikan catatan tetap ada.
- [ ] Coba tampilan ponsel dan tema gelap.
- [ ] Jalankan `npm run lint` dan `npm run build` sebelum deployment.
