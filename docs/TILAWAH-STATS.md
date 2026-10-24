# Statistik Tilawah dan Target Harian (v1.19.0)

Halaman `/statistik-tilawah` menampilkan statistik dari riwayat membaca lokal Nurani.

## Data yang ditampilkan

- Ayat unik yang ditandai pernah dibaca dan persentase dari 6.236 ayat.
- Rentetan hari membaca saat ini serta rekor rentetan terbaik pada riwayat lokal yang tersedia.
- Aktivitas tujuh hari dan kalender 30 hari terakhir.
- Total ayat yang dicatat pada hari aktif selama 7 dan 30 hari, serta rata-rata ayat per hari aktif dalam 30 hari.
- Target membaca pribadi dalam ayat per hari, dengan preset 5, 10, 20, 30, 50, dan 100 ayat serta target khusus 1–200 ayat.
- Perkiraan sederhana jumlah hari untuk menyelesaikan ayat yang belum ditandai jika pengguna terus mencapai target harian. Ini bukan perkiraan durasi membaca.

## Cara pencatatan

Nurani mencatat ayat ketika ayat terlihat dalam pembaca. Satu ayat dihitung paling banyak sekali per tanggal pada `aq:reading-days`; progres unik seumur riwayat disimpan dalam `aq:read-verse-keys`. Riwayat aktivitas dipertahankan untuk 90 tanggal terakhir. Semua statistik dihitung di browser dan tidak diunggah ke server.

Target harian pribadi disimpan pada `aq:daily-verse-target`, nilai integer dari 1 sampai 200. Target ini terpisah dari rencana khatam 30, 60, atau 90 hari. Target harian ikut diekspor/impor dalam cadangan lokal Nurani. File backup lama yang tidak menyertakan key ini tetap valid; target harian di perangkat tidak akan diganti jika kategorinya tidak ada di file impor.

## Batasan interpretasi

- Aplikasi mencatat ayat yang terdeteksi terlihat, bukan durasi membaca atau pemahaman pengguna.
- Total aktivitas harian merupakan akumulasi ayat yang ditandai pada masing-masing hari; ayat yang dibaca ulang pada hari berbeda dapat dihitung pada kedua hari itu.
- Rentetan dan kalender hanya berdasarkan data yang tersimpan di browser/perangkat yang sama.
- Data dapat hilang jika pengguna menghapus penyimpanan browser; gunakan Pengaturan → Cadangkan & pulihkan data untuk menyimpan backup.
