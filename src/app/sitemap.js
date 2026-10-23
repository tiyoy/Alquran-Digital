import { siteUrl } from '@/lib/site-config';
import { SECTION_ROUTES } from '@/lib/section-routes';

export default function sitemap() {
  return SECTION_ROUTES.map(({ path, tab }) => ({
    url: path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`,
    changeFrequency: tab === 'prayer' ? 'daily' : tab === 'asma' ? 'monthly' : 'weekly',
    priority: tab === 'home' ? 1 : tab === 'quran' ? 0.9 : tab === 'asma' ? 0.7 : 0.8
  }));
}
