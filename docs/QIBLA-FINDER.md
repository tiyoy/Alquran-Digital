# Arah Kiblat

Route: `/arah-kiblat`

Nurani menghitung initial great-circle bearing menuju Ka'bah pada koordinat 21.422487° N, 39.826206° E. Hasil dihitung di browser dari lokasi yang pengguna pilih untuk diberikan kepada browser.

## Privasi
Lokasi diminta hanya saat pengguna menekan tombol. Latitude/longitude tidak disimpan ke `localStorage`, backup data, maupun dikirim ke server Nurani. Komponen hanya menyimpan koordinat di state memori selama sesi halaman.

## Kompas
- Menggunakan `DeviceOrientationEvent.requestPermission(true)` jika browser menyediakan metode tersebut; pemanggilannya dilakukan langsung dalam handler klik.
- Memakai `webkitCompassHeading` bila tersedia, atau event orientasi absolut dengan `alpha` untuk heading perangkat.
- Sensor tidak selalu tersedia di desktop atau setiap browser. Dalam keadaan itu, azimuth numerik dari utara geografis masih ditampilkan.

## Uji manual
1. Buka `/arah-kiblat` di perangkat melalui HTTPS.
2. Tekan **Gunakan lokasi saya**, lalu izinkan lokasi dan sensor bila diminta.
3. Pastikan azimuth muncul dan kompas ikut bergerak ketika perangkat diputar.
4. Tolak izin sensor/kompas dan pastikan azimuth masih muncul dengan pesan fallback.
5. Tolak izin lokasi dan pastikan pesan kesalahan dapat dimengerti serta tombol coba lagi tersedia.
6. Periksa `localStorage`: tidak boleh ada key baru berisi koordinat lokasi.

Kompas perangkat perlu dikalibrasi dan dijauhkan dari benda logam atau sumber magnetik. Azimuth dihitung dari utara geografis; pembacaan sensor kompas merupakan panduan, bukan alat ukur presisi survey.
