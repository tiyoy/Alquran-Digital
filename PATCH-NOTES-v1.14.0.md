# Nurani v1.14.0 — Kontrol Kecepatan Murottal

## Perubahan
- Menambahkan kontrol kecepatan audio: 0,75×; 0,9×; 1×; 1,1×; 1,25×; dan 1,5×.
- Kontrol tersedia pada toolbar pembaca dan saat sticky player diperluas, agar kecepatan dapat diubah tanpa kembali ke halaman surah.
- Kecepatan diterapkan ke pemutaran audio surah penuh maupun ayat, termasuk audio yang berasal dari cache offline.
- Kecepatan disimpan pada `localStorage` sebagai `aq:audio-speed` dan dimasukkan ke ekspor/impor backup lokal. Nilai impor dibatasi pada pilihan yang didukung.
- Mencoba mempertahankan pitch melalui `preservesPitch` (serta prefiks browser lama jika tersedia). Perilaku dapat berbeda pada browser/perangkat tertentu.
- Versi service worker ditingkatkan ke `nurani-pwa-v25`; cache audio khusus tetap terpisah sehingga tidak dihapus oleh pergantian versi app shell.

## Validasi
- Pemeriksaan sintaks JSX/JS, CSS, dan service worker dijalankan setelah perubahan.
- Helper backup diuji agar nilai kecepatan yang valid diterima dan nilai di luar daftar ditolak.
- Build Next.js penuh harus dijalankan pada lingkungan proyek yang memiliki dependensi terpasang sebelum deployment produksi.
