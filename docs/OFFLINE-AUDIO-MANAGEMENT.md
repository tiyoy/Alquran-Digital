# Pengelolaan audio murottal offline

Audio offline disimpan di Cache API dan metadata per track disimpan di `localStorage` pada `aq:offline-audios`. Identitas track adalah kombinasi nomor surah dan ID qari (dengan URL sebagai fallback), sehingga satu surah boleh memiliki lebih dari satu qari yang disimpan.

## Batas penyimpanan
- Maksimum 80 MiB per track.
- Maksimum 200 MiB total audio terdaftar.
- Estimasi Storage API berlaku untuk seluruh origin Nurani, bukan hanya file audio.

## Pengelolaan
Buka Pengaturan → Kelola konten offline → Audio murottal offline. Filter daftar menurut qari, hapus satu track, hapus seluruh track qari yang dipilih, atau hapus seluruh audio offline.

Menghapus audio tidak menghapus data ayat offline, bookmark, catatan tadabbur, progres khatam, atau posisi bacaan.

## Kualitas
EQuran API yang digunakan menyediakan MP3 berkualitas tinggi per surah/qari. Karena dokumentasi sumber tidak menyatakan adanya varian bitrate, Nurani tidak menawarkan pilihan kualitas yang tidak didukung. File sumber tetap dalam kualitas aslinya; pengguna menghemat ruang dengan hanya menyimpan qari yang ingin didengarkan offline.
