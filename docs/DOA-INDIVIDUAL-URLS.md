# URL Individual Doa Harian — v1.7.1

## Format

Route: `/doa/[slug]`

Slug dibuat dari ID dan judul doa, misalnya:

- `/doa/1-doa-sebelum-makan`
- `/doa/2-doa-sesudah-makan`
- `/doa/3-doa-sebelum-tidur`

ID menjaga route tetap stabil saat judul konten berubah. Untuk ID numerik, resolver tetap mencari data berdasarkan ID apabila bagian judul dalam URL lama berbeda.

## Alur fitur

1. Daftar doa membuat tautan ke detail doa.
2. **Bagikan doa** membuka Web Share jika didukung; jika tidak, fitur menyalin isi doa beserta URL.
3. Halaman detail dirender memakai `NuraniApp` dengan `initialDua` dari server agar konten utama tersedia pada HTML awal.
4. `generateMetadata` menyiapkan title, description, canonical, Open Graph, Twitter Card, dan pengaturan robots per doa.
5. `/sitemap.xml` menyertakan URL dari katalog doa yang berhasil dimuat.
6. Service worker menggunakan cache namespace `nurani-pwa-v15`.

## Pengujian sebelum deploy

Jalankan:

```bash
npm run lint
npm run build
```

Setelah deployment, uji:

- `/doa`
- `/doa/1-doa-sebelum-makan`
- `/doa/2-doa-sesudah-makan`
- `/sitemap.xml`

Pastikan halaman detail menunjukkan isi doa yang benar, tautan salin/bagikan berisi URL saat ini, tombol kembali ke kumpulan doa berfungsi, serta URL slug tidak valid menampilkan 404.

## Batasan

Katalog utama tetap bersumber dari EQuran.id. Jika API sedang tidak dapat dijangkau, hanya doa cadangan yang dibundel yang dapat di-resolve dari server; direct URL untuk doa lain bergantung pada ketersediaan katalog/API.
