# Nurani v1.20.0 — Pengingat Tilawah dan Doa Harian

- Menambahkan menu Pengingat Tilawah dan Doa di Pengaturan.
- Mendukung maksimal 10 jadwal, nama custom, waktu, jenis pengingat, pilihan hari, edit, hapus, dan aktif/nonaktif.
- Meminta izin notifikasi hanya melalui tindakan pengguna; memakai service worker `showNotification()` saat halaman berjalan di latar belakang dan izin diberikan.
- Menambahkan klik notifikasi yang menavigasi ke halaman Nurani yang relevan.
- Menyimpan jadwal pada `aq:reminders` dan menambahkannya ke backup/restore JSON.
- Memperbarui versi package ke 1.20.0 serta service worker ke `nurani-pwa-v33`.
- Batasan: pengingat lokal tidak dijamin berjalan saat browser/PWA ditutup. Pengiriman background yang andal memerlukan server Web Push.
- Belum mengklaim build Next.js penuh berhasil; jalankan `npm run lint` dan `npm run build` sebelum deployment.
