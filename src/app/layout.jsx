import './globals.css';

export const metadata = {
  title: 'Nurani — Al-Qur’an Digital Indonesia',
  description: 'Teman tilawah harian: baca Al-Qur’an, pelajari tafsir, dengarkan murottal, cek jadwal shalat, dan temukan doa harian.',
  applicationName: 'Nurani Al-Qur’an Digital',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nurani'
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#064e3b'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
