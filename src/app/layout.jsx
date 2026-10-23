import './globals.css';
import { canonicalUrl, siteDescription, siteName, siteUrl } from '@/lib/site-config';

const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: '%s | Nurani'
  },
  description: siteDescription,
  applicationName: siteName,
  category: 'education',
  keywords: [
    'Al-Qur’an digital',
    'baca Al-Qur’an online',
    'terjemahan Al-Qur’an Indonesia',
    'murottal Al-Qur’an',
    'jadwal shalat Indonesia',
    'doa harian',
    'Asmaul Husna',
    'PWA Al-Qur’an'
  ],
  alternates: {
    canonical: '/'
  },
  robots: {
    index: !isPreviewDeployment,
    follow: !isPreviewDeployment,
    googleBot: {
      index: !isPreviewDeployment,
      follow: !isPreviewDeployment,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: canonicalUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: '/og-nurani.png',
        width: 1200,
        height: 630,
        alt: 'Nurani — Al-Qur’an Digital Indonesia, teman ibadah harian'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/og-nurani.png']
  },
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

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: siteName,
  alternateName: 'Nurani',
  url: canonicalUrl,
  description: siteDescription,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  inLanguage: 'id-ID',
  image: `${siteUrl}/og-nurani.png`,
  featureList: [
    'Membaca Al-Qur’an dengan terjemahan Indonesia',
    'Audio murottal dan mode murajaah',
    'Jadwal shalat wilayah Indonesia',
    'Doa harian dan Asmaul Husna',
    'Progres tilawah dan target khatam',
    'Dukungan Progressive Web App'
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  );
}
