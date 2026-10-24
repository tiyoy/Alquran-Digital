import { notFound } from 'next/navigation';
import NuraniApp from '@/components/NuraniApp';
import { siteName, siteUrl } from '@/lib/site-config';
import { getSurahFromSlug, getVersePath } from '@/lib/surah-routes';
import { getSurahVerseRows } from '@/lib/server-quran';

// Ayah routes are rendered on demand rather than prebuilding all 6,236 pages.
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug, verse: verseParam } = await params;
  const surah = getSurahFromSlug(slug);
  const verseNumber = Number(verseParam);
  if (!surah || !Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > Number(surah.jumlahAyat)) return {};

  const title = `Surah ${surah.namaLatin} Ayat ${verseNumber}`;
  const description = `Baca Surah ${surah.namaLatin} ayat ${verseNumber} dengan teks Arab, transliterasi Latin, terjemahan Indonesia, audio murottal, dan tautan yang bisa dibagikan di Nurani.`;
  const url = `${siteUrl}${getVersePath(surah, verseNumber)}`;
  const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';
  return {
    title: { absolute: `${title} — Al-Qur’an Digital | Nurani` },
    description,
    keywords: [
      `Surah ${surah.namaLatin} ayat ${verseNumber}`,
      `${surah.namaLatin} ${surah.nomor}:${verseNumber}`,
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
      title: `${title} | ${siteName}`,
      description,
      images: [{ url: '/og-nurani.png', width: 1200, height: 630, alt: `Nurani — ${title}` }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nurani`,
      description,
      images: ['/og-nurani.png']
    }
  };
}

export default async function VersePage({ params }) {
  const { slug, verse: verseParam } = await params;
  const surah = getSurahFromSlug(slug);
  const verseNumber = Number(verseParam);
  if (!surah || !Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > Number(surah.jumlahAyat)) notFound();

  const initialVerseRows = await getSurahVerseRows(surah.nomor);

  return (
    <NuraniApp
      initialTab="quran"
      initialSurahNumber={surah.nomor}
      initialVerseNumber={verseNumber}
      initialVerseRows={initialVerseRows}
    />
  );
}
