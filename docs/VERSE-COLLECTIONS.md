# Koleksi Ayat dan Folder Bookmark (v1.21.0)

Nurani menyediakan koleksi lokal untuk mengelompokkan referensi ayat berdasarkan tema. Contoh: Sabar, Syukur, Keluarga, atau Bahan Kajian.

## Penggunaan

- Buka `/koleksi-ayat` melalui navigasi **Koleksi**.
- Buat folder dengan nama, catatan singkat, dan warna.
- Pada hasil pencarian atau kartu ayat pembaca, tekan ikon folder untuk menambahkan/mengeluarkan ayat dari satu atau lebih koleksi.
- Pada detail koleksi, buka ayat, kelola bookmark umum, tambahkan ayat dari bookmark lama, atau bagikan daftar referensi dan tautan ayat.
- Berbagi koleksi menyalin daftar referensi dan tautan ayat individual. Karena koleksi lokal, hal ini tidak membuat URL publik untuk folder.

## Penyimpanan dan batas

- Key: `aq:verse-collections`.
- Maksimal 50 koleksi.
- Nama maksimal 48 karakter, deskripsi maksimal 240 karakter.
- Maksimal 6.236 referensi ayat per koleksi.
- Setiap koleksi tersimpan di localStorage dan disertakan dalam backup JSON Nurani.
- Data tidak disinkronkan ke perangkat lain. Backup perlu diekspor dan dipulihkan untuk memindahkan koleksi.
- Menghapus koleksi tidak menghapus bookmark umum ataupun catatan tadabbur.
- Mengeluarkan ayat dari koleksi tidak mengubah bookmark umum.

## Format

```json
{
  "id": "vc-example",
  "name": "Sabar",
  "description": "Ayat tentang sabar untuk bahan kajian pribadi.",
  "color": "emerald",
  "verseKeys": ["2:153", "3:200"],
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```
