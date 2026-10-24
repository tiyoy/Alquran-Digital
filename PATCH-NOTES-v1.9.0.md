# Nurani v1.9.0 — Cadangkan & Pulihkan Data

## Perubahan
- Menambahkan fitur **Cadangkan & Pulihkan Data** di Pengaturan aplikasi.
- Ekspor membuat file JSON berisi data personal yang disimpan secara lokal: tema, bookmark surah/ayat, catatan tadabbur, posisi bacaan terakhir, progres ayat, riwayat bacaan harian, target khatam, pengulangan audio, favorit Asmaul Husna, dan preferensi pembaca.
- File ekspor memakai format `nurani-local-backup` skema versi 1 serta mencatat versi aplikasi dan waktu ekspor.
- Impor memvalidasi skema, membatasi ukuran file hingga 5 MB, memfilter hanya key Nurani yang diizinkan, menormalisasi nilai, dan meminta konfirmasi sebelum menulis.
- Bila penyimpanan gagal di tengah proses impor, aplikasi berusaha mengembalikan nilai sebelumnya untuk seluruh kategori yang terdampak.
- Saat impor, kategori yang ada di file menggantikan kategori serupa pada perangkat; kategori yang tidak ada pada file dibiarkan tetap.
- Katalog surah/doa yang dapat diambil ulang, jadwal shalat yang dapat berubah, token, data surah offline, dan cache tidak dimasukkan ke file cadangan.
- Service worker dinaikkan ke `nurani-pwa-v17` agar browser mengambil cache aplikasi versi terbaru.

## Privasi
- File backup bisa berisi catatan tadabbur pribadi, bookmark, dan riwayat membaca. Pengguna disarankan menyimpannya secara aman.
- Cadangan diproses lokal di browser; aplikasi tidak mengunggah file ke server.
- Backup tidak memuat data dari akun karena Nurani saat ini tidak mewajibkan akun atau sinkronisasi cloud.

## Pengujian yang disarankan
1. Buka Pengaturan > Cadangkan & pulihkan data dan ekspor file JSON.
2. Periksa isi JSON: `format` harus `nurani-local-backup`, `schemaVersion` harus `1`, dan `data` hanya berisi key yang dikenal.
3. Ubah bookmark/catatan secara lokal, lalu impor file yang diekspor. Pastikan konfirmasi tampil dan data kembali sesuai cadangan.
4. Coba file non-JSON, file format lain, dan file lebih besar dari 5 MB; impor harus ditolak tanpa mengubah data.
5. Coba backup dengan satu field tidak dikenal; field tersebut dilewati dan hanya kategori valid yang dipulihkan.
6. Pastikan data kategori yang tidak ada pada file tetap tersimpan.
7. Jalankan `npm run lint` dan `npm run build` sebelum deployment.

Status lingkungan pembuat: validasi statis dan uji helper backup dilakukan; build penuh Next.js harus dikonfirmasi pada lingkungan proyek dengan dependensi terpasang.
