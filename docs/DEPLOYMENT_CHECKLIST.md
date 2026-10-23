# Checklist Pra-Deployment Nurani

Gunakan checklist ini sebelum mendorong perubahan ke GitHub dan sebelum membuat Production Deployment di Vercel.

## 1. Siapkan lingkungan

- [ ] Pasang Node.js 22 LTS (versi minimum proyek: 20.9.0; lihat `.nvmrc`).
- [ ] Buka terminal di direktori yang berisi `package.json`.
- [ ] Jalankan `npm install` dan tunggu hingga berhasil.
- [ ] Pastikan `package-lock.json` terbentuk dan ikut di-commit.

## 2. Periksa dependency dan build

```bash
node -v
npm ls next react react-dom eslint-config-next
npm audit
npm run lint
npm run build
```

Versi yang dikunci di `package.json`:

- Next.js `15.5.28`
- `eslint-config-next` `15.5.28`
- React `19.2.9`
- React DOM `19.2.9`

Jika perintah gagal, tangani error sebelum deploy. Periksa advisori resmi Next.js dan tinjau hasil `npm audit`; jangan mengabaikan kerentanan kritis hanya agar build lolos.

Setelah build berhasil, uji hasil produksi secara lokal:

```bash
npm run start
```

## 3. Smoke test fitur

- [ ] Beranda, navigasi bawah, mode terang, dan mode gelap tampil tanpa error.
- [ ] Dropdown pilihan qari terbaca pada mode gelap.
- [ ] Daftar surah, pencarian, teks Arab, latin, terjemahan, bookmark, dan loncat ayat berjalan.
- [ ] Target khatam 30/60/90 hari tersimpan setelah refresh.
- [ ] Posisi baca dan progres ayat tersimpan di perangkat setelah refresh.
- [ ] Mode murajaah audio (mati, 3×, 5×, 10×, tanpa batas) diuji dengan sumber audio yang tersedia.
- [ ] Halaman Doa menampilkan katalog. Doa sebelum makan berada di atas doa sesudah makan dan entri “Membaca basmalah sebelum makan” tidak muncul sebagai kartu terpisah.
- [ ] Jadwal shalat memulai dari Kab. Bogor dan pencarian kota lain masih berfungsi.
- [ ] Asmaul Husna memuat 99 nama.
- [ ] Dari reader, tandai satu surah untuk offline, matikan jaringan, lalu uji halaman baca yang telah dimuat sebelumnya.
- [ ] Pada Chrome DevTools → Application, pastikan manifest, ikon, dan service worker valid.

> Catatan offline: aplikasi menyimpan data yang telah dimuat atau ditandai. Audio dari sumber eksternal dan konten yang belum pernah dibuka mungkin tetap membutuhkan internet.

## 4. Push ke GitHub

```bash
git status
git add package.json package-lock.json .nvmrc README.md docs/
git commit -m "chore: prepare Nurani for production deployment"
git push
```

Pastikan `.env.local` atau secret pribadi tidak ikut di-commit. Endpoint `NEXT_PUBLIC_*` di `.env.example` adalah URL publik, bukan tempat untuk menyimpan secret.

## 5. Deploy di Vercel

- [ ] Import repository GitHub yang benar.
- [ ] Root Directory menunjuk ke folder yang berisi `package.json`.
- [ ] Framework Preset terdeteksi sebagai Next.js.
- [ ] Node.js dipilih versi 22.x atau versi yang didukung proyek.
- [ ] Build Command menggunakan `npm run build`.
- [ ] Tambahkan environment variables hanya bila ingin mengganti endpoint default.
- [ ] Setelah deployment berhasil, tes URL produksi di ponsel dan desktop.
- [ ] Uji instalasi PWA serta perilaku offline lewat HTTPS.

## Sumber teknis

- [Panduan upgrade Next.js 15](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [Deployment Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
