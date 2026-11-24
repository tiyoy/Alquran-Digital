import './globals.css';

export const metadata = {
  title: "Al-Qur'an Digital Indonesia — Baca, Hafal & Pahami Al-Qur'an",
  description:
    "Aplikasi web Al-Qur'an Digital Indonesia berbasis Next.js dengan teks Arab Uthmani HD, Warna Tajwid, Mode Hafalan (Hifz), Terjemahan & Tafsir Kemenag RI, Audio Murottal Offline 5 Qari, Jadwal Shalat, Kompas Kiblat, Tasbih, Doa Harian, dan 99 Asmaul Husna.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: "Al-Qur'an ID",
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;500;600;700&display=swap"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen antialiased selection:bg-emerald-200 selection:text-emerald-950 dark:selection:bg-emerald-800 dark:selection:text-emerald-50"
      >
        {children}
      </body>
    </html>
  );
}
