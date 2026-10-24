import NuraniApp from '@/components/NuraniApp';
import { createSectionMetadata } from '@/lib/section-metadata';
import { SECTION_SEO_BY_TAB } from '@/lib/section-routes';

export const metadata = createSectionMetadata(SECTION_SEO_BY_TAB.qibla);

export default function QiblaPage() {
  return <NuraniApp initialTab="qibla" />;
}
