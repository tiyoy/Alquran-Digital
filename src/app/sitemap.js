import { siteUrl } from '@/lib/site-config';
import { SECTION_ROUTES } from '@/lib/section-routes';
import { fallbackSurahs } from '@/lib/data';
import { getSurahPath } from '@/lib/surah-routes';

export default function sitemap() {
  const sectionUrls = SECTION_ROUTES.map(({ path, tab }) => ({
    url: path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`,
    changeFrequency: tab === 'prayer' ? 'daily' : tab === 'asma' ? 'monthly' : 'weekly',
    priority: tab === 'home' ? 1 : tab === 'quran' ? 0.9 : tab === 'asma' ? 0.7 : 0.8
  }));

  const surahUrls = fallbackSurahs.map((surah) => ({
    url: `${siteUrl}${getSurahPath(surah)}`,
    changeFrequency: 'monthly',
    priority: surah.nomor === 1 || surah.nomor === 2 ? 0.85 : 0.75
  }));

  return [...sectionUrls, ...surahUrls];
}
