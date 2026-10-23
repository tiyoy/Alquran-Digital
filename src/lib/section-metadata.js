import { siteName, siteUrl } from '@/lib/site-config';

const image = {
  url: '/og-nurani.png',
  width: 1200,
  height: 630,
  alt: 'Nurani — Al-Qur’an Digital Indonesia'
};

export function createSectionMetadata({ title, description, path, keywords = [] }) {
  const fullTitle = `${title} | Nurani`;
  return {
    title: { absolute: fullTitle },
    description,
    keywords: [...keywords, siteName, 'Al-Qur’an Digital Indonesia'],
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: `${siteUrl}${path}`,
      siteName,
      title: fullTitle,
      description,
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ['/og-nurani.png']
    }
  };
}
