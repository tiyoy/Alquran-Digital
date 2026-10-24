# Nurani v1.15.0 — Arah Kiblat

## Ringkasan
Menambahkan fitur pencari arah kiblat berbasis browser untuk melengkapi alat ibadah harian. Fitur dapat dibuka dari akses cepat di beranda maupun URL langsung `/arah-kiblat`.

## Perubahan
- Menambahkan `src/lib/qibla.js` untuk validasi koordinat, normalisasi derajat, perhitungan azimuth lingkaran besar ke Ka'bah, serta label arah mata angin.
- Menambahkan `src/components/QiblaFinder.jsx` dengan permintaan lokasi eksplisit setelah tombol ditekan, sensor kompas opsional, status fallback, panduan penggunaan, dan catatan privasi.
- Menambahkan route `src/app/arah-kiblat/page.jsx` serta metadata title/description/canonical/Open Graph/Twitter Card.
- Menambahkan tautan fitur pada akses cepat beranda.
- Menambahkan URL ke sitemap melalui `SECTION_ROUTES` dan app shell service worker.
- Memperbarui service worker ke `nurani-pwa-v26`.
- Menambah shortcut PWA Arah Kiblat.

## Privasi dan batasan
- Koordinat hanya berada dalam state memori selama halaman terbuka. Fitur tidak menulisnya ke `localStorage` atau mengirimnya ke server.
- Geolocation membutuhkan HTTPS dan izin pengguna.
- Sensor orientasi membutuhkan dukungan perangkat/browser; beberapa browser meminta izin eksplisit dari klik pengguna. Bila sensor tidak tersedia, azimuth dari utara geografis tetap ditampilkan.
- Heading kompas dapat dipengaruhi kalibrasi sensor, variasi perangkat, dan gangguan magnet. Gunakan hasil sebagai panduan dan kalibrasi kompas.

## Verifikasi
- Uji helper matematika dengan koordinat Jakarta (hasil sekitar 295.15°, arah barat laut).
- Uji koordinat di luar rentang dan nilai bukan angka harus ditolak.
- Uji route `/arah-kiblat`, tombol akses cepat, izin lokasi ditolak, sensor tidak tersedia, serta sensor aktif pada perangkat fisik.
- Jalankan `npm run lint` dan `npm run build` sebelum deployment.
