import { siteUrl } from '@/lib/site-config';
import { SECTION_ROUTES } from '@/lib/section-routes';
import { fallbackSurahs } from '@/lib/data';
import { getSurahPath, getVersePath } from '@/lib/surah-routes';
import { getDuaPath } from '@/lib/dua-routes';
import { getServerDuaCatalog } from '@/lib/server-duas';

export default async function sitemap() {
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

  const verseUrls = fallbackSurahs.flatMap((surah) =>
    Array.from({ length: Number(surah.jumlahAyat) || 0 }, (_, index) => ({
      url: `${siteUrl}${getVersePath(surah, index + 1)}`,
      changeFrequency: 'yearly',
      priority: 0.55
    }))
  );

  const duaCatalog = await getServerDuaCatalog();
  const duaUrls = duaCatalog.map((dua, index) => ({
    url: `${siteUrl}${getDuaPath(dua, index)}`,
    changeFrequency: 'monthly',
    priority: 0.65
  }));

  return [...sectionUrls, ...duaUrls, ...surahUrls, ...verseUrls];
}
