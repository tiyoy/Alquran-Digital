import { canonicalUrl } from '@/lib/site-config';

// The app currently uses a single canonical URL; query-string tabs are UI states,
// not separate indexable pages. Add URL entries only when dedicated routes exist.
export default function sitemap() {
  return [
    {
      url: canonicalUrl,
      changeFrequency: 'weekly',
      priority: 1
    }
  ];
}
