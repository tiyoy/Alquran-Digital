import { notFound } from 'next/navigation';
import NuraniApp from '@/components/NuraniApp';
import { fallbackSurahs } from '@/lib/data';
import { siteName, siteUrl } from '@/lib/site-config';
import { getSurahFromSlug, getSurahSlug } from '@/lib/surah-routes';

export const dynamicParams = false;

export function generateStaticParams() {
  return fallbackSurahs.map((surah) => ({ slug: getSurahSlug(surah) }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const surah = getSurahFromSlug(slug);
  if (!surah) return {};

  const title = `Surah ${surah.namaLatin} (${surah.arti}) — Baca Al-Qur’an Online`;
  const description = `Baca Surah ${surah.namaLatin}, surah ke-${surah.nomor} dalam Al-Qur’an, dengan ${surah.jumlahAyat} ayat, teks Arab, transliterasi Latin, terjemahan Indonesia, audio murottal, dan bookmark.`;
  const url = `${siteUrl}/quran/${slug}`;
  const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';
  const image = {
    url: '/og-nurani.png',
    width: 1200,
    height: 630,
    alt: `Nurani — Surah ${surah.namaLatin}`
  };

  return {
    title: { absolute: `${title} | Nurani` },
    description,
    keywords: [
      `Surah ${surah.namaLatin}`,
      `Surat ${surah.namaLatin} dan artinya`,
      `Surah ${surah.namaLatin} ayat ${surah.jumlahAyat}`,
      'Al-Qur’an online',
      'terjemahan Al-Qur’an Indonesia'
    ],
    alternates: { canonical: url },
    robots: {
      index: !isPreviewDeployment,
      follow: !isPreviewDeployment,
      googleBot: { index: !isPreviewDeployment, follow: !isPreviewDeployment, 'max-image-preview': 'large' }
    },
    openGraph: {
      type: 'article',
      locale: 'id_ID',
      url,
      siteName,
      title: `${title} | Nurani`,
      description,
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nurani`,
      description,
      images: ['/og-nurani.png']
    }
  };
}

export default async function SurahPage({ params }) {
  const { slug } = await params;
  const surah = getSurahFromSlug(slug);
  if (!surah) notFound();

  return <NuraniApp initialTab="quran" initialSurahNumber={surah.nomor} />;
}
