# Pengelolaan audio murottal offline

Audio offline disimpan di Cache API dan metadata setiap track disimpan di `localStorage` pada `aq:offline-audios`. Satu surah dapat memiliki audio penuh dan satu atau beberapa audio ayat untuk qari yang sama. Track audio penuh dan track ayat memiliki identitas terpisah agar unduhan ayat tidak mengganti audio penuh.

## Batas penyimpanan
- Maksimum 80 MiB per track.
- Maksimum 200 MiB total audio terdaftar.
- Estimasi Storage API berlaku untuk seluruh origin Nurani, bukan hanya file audio.

## Unduh audio penuh atau per ayat
- Untuk menyimpan audio satu surah, gunakan tombol **Unduh audio** di bagian atas pembaca.
- Untuk mode hemat ruang, gunakan ikon **unduh** pada kartu ayat yang dibutuhkan. Audio per ayat disimpan sebagai file terpisah; tidak perlu menyimpan seluruh surah jika hanya beberapa ayat yang ingin didengarkan offline.
- Saat offline, tombol putar ayat menggunakan file lokal jika ayat tersebut sudah diunduh. Ayat yang belum diunduh akan memberi pesan dan tidak memulai permintaan jaringan.

## Pengelolaan
Buka Pengaturan → Kelola konten offline → Audio murottal offline. Filter daftar menurut qari, hapus satu track, hapus seluruh track qari yang dipilih, atau hapus seluruh audio offline. Nama track ayat mencantumkan nomor ayat.

Menghapus audio tidak menghapus data ayat offline, bookmark, catatan tadabbur, progres khatam, atau posisi bacaan.

## Kualitas dan hemat ruang
API EQuran mendokumentasikan MP3 berkualitas tinggi dan URL audio per ayat, tetapi tidak mendokumentasikan varian bitrate untuk setiap file. Karena itu, Nurani tidak menampilkan pilihan kualitas palsu atau melakukan konversi audio di browser. Mode hemat penyimpanan mengunduh hanya ayat yang dipilih, sehingga ukuran data yang disimpan benar-benar berkurang sesuai jumlah ayat yang diunduh.
