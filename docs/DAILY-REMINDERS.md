# Pengingat Tilawah dan Doa Harian (v1.20.0)

## Kemampuan
- Maksimal 10 jadwal lokal.
- Setiap jadwal berisi nama, waktu lokal perangkat (`HH:mm`), jenis `tilawah`, `doa`, atau `both`, hari pengulangan (0 Minggu sampai 6 Sabtu), serta status aktif.
- Pengingat disimpan di `localStorage` sebagai `aq:reminders` dan dimasukkan ke file cadangan JSON Nurani.
- Izin Notifications hanya diminta melalui tombol yang ditekan pengguna.
- Ketika jadwal jatuh tempo dan halaman terlihat, aplikasi menampilkan toast. Saat halaman berada di latar belakang, aplikasi mencoba `ServiceWorkerRegistration.showNotification()` jika izin diberikan.
- Klik notifikasi akan membuka `/quran`, `/doa`, atau `/` sesuai tipe jadwal.

## Batasan penting
Penjadwalan ini bersifat lokal dan membutuhkan halaman/PWA tetap berjalan. Browser dapat membatasi timer saat tab di latar belakang; jika browser/PWA ditutup sepenuhnya, notifikasi tidak dijamin terkirim. Untuk pengingat andal saat aplikasi ditutup dibutuhkan Web Push, server pengirim, penyimpanan subscription, dan kredensial VAPID. Fitur ini tidak mengklaim menyediakan pengiriman push latar belakang.

## Privasi
Tidak ada jadwal yang dikirim ke server. Waktu menggunakan zona waktu lokal perangkat. Catatan `aq:reminders-last-fired` digunakan hanya untuk mencegah pengingat yang sama berbunyi berulang dalam satu hari dan tidak termasuk backup.
