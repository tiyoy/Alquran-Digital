# Patch Nurani v1.19.0

Ekstrak isi ZIP ini ke root proyek Nurani (folder yang berisi `package.json`) dan timpa file yang sama.

File utama:
- `src/components/NuraniApp.jsx`: statistik tilawah, target harian di beranda, dan halaman statistik.
- `src/lib/tilawah-stats.js`: helper statistik/streak/target harian.
- `src/lib/section-routes.js` dan `src/app/statistik-tilawah/page.jsx`: route `/statistik-tilawah` serta metadata SEO.
- `src/lib/local-backup.js`: validasi target harian di backup JSON.
- `src/app/globals.css`: tampilan responsif statistik.
- `public/sw.js`: app-shell dan cache PWA v32.

Setelah menerapkan, jalankan `npm run lint` dan `npm run build` sebelum push ke GitHub/Vercel.
