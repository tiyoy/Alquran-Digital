import { notFound } from 'next/navigation';
import NuraniApp from '@/components/NuraniApp';
import { siteName, siteUrl } from '@/lib/site-config';
import { getDuaPath } from '@/lib/dua-routes';
import { getServerDuaBySlug } from '@/lib/server-duas';

// Daily dua pages are rendered on demand; the catalogue remains data-driven.
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dua = await getServerDuaBySlug(slug);
  if (!dua) return {};

  const title = `${dua.judul} — Doa Harian Arab, Latin, dan Artinya`;
  const description = `Baca ${dua.judul} dalam bahasa Arab, bacaan Latin, dan terjemahan Indonesia${dua.sumber ? ` (${dua.sumber})` : ''}. Bagikan tautan doa ini melalui Nurani.`;
  const url = `${siteUrl}${getDuaPath(dua)}`;
  const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';
  const image = {
    url: '/og-nurani.png',
    width: 1200,
    height: 630,
    alt: `Nurani — ${dua.judul}`
  };

  return {
    title: { absolute: `${title} | Nurani` },
    description,
    keywords: [dua.judul, 'doa harian', 'doa sehari-hari', 'doa Arab Latin dan artinya', 'doa Islam'],
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
      title: `${dua.judul} | ${siteName}`,
      description,
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dua.judul} | Nurani`,
      description,
      images: ['/og-nurani.png']
    }
  };
}

export default async function DailyDuaPage({ params }) {
  const { slug } = await params;
  const dua = await getServerDuaBySlug(slug);
  if (!dua) notFound();

  return <NuraniApp initialTab="duas" initialDuaSlug={dua.slug} initialDua={dua} />;
}
