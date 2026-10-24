# Cadangkan & Pulihkan Data Lokal

## Data yang dicadangkan
Fitur ini mengekspor data personal berikut dari browser:

- Tema terang/gelap.
- Bookmark surah dan ayat.
- Catatan tadabbur (maksimal 500 catatan, maksimal 2.000 karakter per catatan).
- Posisi bacaan terakhir.
- Ayat yang ditandai selesai dan riwayat bacaan harian.
- Target khatam 30, 60, atau 90 hari.
- Pengaturan pengulangan audio.
- Kecepatan audio murottal (0,75×, 0,9×, 1×, 1,1×, 1,25×, dan 1,5×).
- Favorit Asmaul Husna.
- Preferensi tampilan pembaca: visibilitas teks, ukuran font, dan pilihan qari.

Cache katalog surah dan doa tidak disertakan, karena dapat diambil ulang. Data ayat yang disimpan untuk akses offline juga tidak dipindahkan karena terkait cache dan storage perangkat. Jadwal shalat tidak disertakan karena merupakan data yang berubah dan sebaiknya diperbarui dari sumbernya.

## Format file
File JSON memiliki bentuk umum:

```json
{
  "format": "nurani-local-backup",
  "schemaVersion": 1,
  "appVersion": "1.14.0",
  "exportedAt": "2026-10-24T00:00:00.000Z",
  "data": {
    "aq:theme": "light",
    "aq:bookmarked-surahs": [1, 36]
  }
}
```

Contoh di atas hanya ilustrasi singkat, bukan file backup lengkap.

## Perilaku impor
- Hanya menerima file JSON hingga 5 MB.
- Memvalidasi format dan versi skema.
- Hanya menulis key yang tercantum pada daftar key cadangan Nurani; key lain diabaikan.
- Memvalidasi dan menormalisasi bookmark, progres, catatan, dan preferensi sebelum disimpan.
- Menampilkan ringkasan kategori sebelum meminta konfirmasi.
- Kategori yang terdapat di file akan menggantikan kategori yang sama pada perangkat ini. Kategori yang tidak terdapat di file tidak dihapus atau diubah.
- Bila browser gagal menyimpan perubahan, aplikasi mencoba memulihkan nilai sebelumnya.
- Setelah impor sukses, halaman dimuat ulang agar state aplikasi dibaca kembali dari penyimpanan lokal.

## Keamanan dan privasi
File backup dapat memuat catatan tadabbur pribadi dan riwayat tilawah. Simpan file dengan aman. File diproses lokal pada browser dan tidak dikirim ke server oleh fitur ini. File yang tidak dikenal tidak boleh dipakai sebagai backup Nurani.

## Langkah pengguna
1. Buka ikon Pengaturan di header.
2. Pada bagian **Cadangkan & pulihkan data**, pilih **Ekspor cadangan** untuk menyimpan file `.json`.
3. Untuk memulihkan data, tekan **Impor cadangan** dan pilih file Nurani yang sebelumnya diekspor.
4. Baca ringkasan dan konfirmasi. Aplikasi akan dimuat ulang setelah penyimpanan berhasil.
