# Pengelolaan Konten Offline — Nurani v1.10.0

## Fungsi

Panel **Kelola konten offline** berada di Pengaturan. Panel ini menunjukkan:

- Surah yang ditandai untuk akses offline (`aq:offline-surahs`).
- Surah dengan data ayat yang ditemukan di `localStorage` (`aq:verses:<nomor>`).
- Estimasi ukuran JSON ayat yang tersimpan dan, bila tersedia, estimasi pemakaian serta kuota penyimpanan origin melalui Storage API browser.
- Daftar surah yang ditandai offline, status data ayatnya, tombol untuk membuka surah, dan tombol untuk menghapus satu unduhan.

## Penghapusan

- **Hapus untuk satu surah** menghapus `aq:verses:<nomor>`, mengeluarkan nomor surah dari `aq:offline-surahs`, dan meminta service worker menghapus rute surah/ayat serta respons API surah yang sesuai.
- **Hapus semua cache ayat** menghapus semua key lokal `aq:verses:<nomor>`, mengosongkan `aq:offline-surahs`, dan meminta service worker membersihkan cache rute/endpoint surah.
- Bookmark, catatan tadabbur, posisi bacaan, progres khatam, favorit Asmaul Husna, tema, dan pengaturan pembaca dipertahankan.

## Batasan

- Penyimpanan data ayat utama menggunakan localStorage agar reader yang berjalan dapat memakainya tanpa jaringan. Cache HTML rute surah/ayat oleh service worker merupakan best-effort; bila gagal, pembaca tetap dapat memakai cache ayat lokal setelah aplikasi shell terbuka.
- Storage API melaporkan pemakaian tingkat origin/browser, bukan pemakaian Nurani saja. Nilainya berupa estimasi dan tidak tersedia di semua browser.
- Cache browser dapat dihapus oleh pengguna atau dievakuasi browser bila ruang perangkat terbatas.
- Audio murottal tidak diunduh dan tidak dimasukkan ke dalam cache offline oleh perubahan ini.

## Pemeriksaan manual sebelum deployment

1. Buka satu surah saat online, pilih **Simpan offline**, lalu pastikan surah tampil di Pengaturan > Kelola konten offline dan filter **Offline**.
2. Tutup lalu buka kembali aplikasi, masuk mode offline, buka Beranda, filter **Offline**, lalu buka surah tersimpan.
3. Coba membuka langsung URL surah yang sudah disimpan dalam mode offline; perilakunya bergantung pada apakah browser berhasil melakukan precache dokumen.
4. Hapus satu surah dan pastikan bookmark, catatan, progres, serta posisi bacaan tidak hilang.
5. Pilih **Hapus semua cache ayat**, pastikan daftar offline kosong, lalu pastikan data pribadi tetap tersimpan.
6. Periksa konsol browser dan jalankan `npm run lint` serta `npm run build` sebelum deploy.
