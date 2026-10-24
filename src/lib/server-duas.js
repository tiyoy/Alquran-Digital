import { cache } from 'react';
import { fallbackDuas, enforceBeforeMealDua, MIN_DUA_CATALOG_SIZE } from '@/lib/data';
import { extractDuaRows, isUsableDua, normalizeDua } from '@/lib/duas';
import { getDuaSlug } from '@/lib/dua-routes';
import { unwrapPayload } from '@/lib/api';

const DOA_BASE = process.env.NEXT_PUBLIC_DOA_API || 'https://equran.id/api/doa';

/**
 * Load the same dua catalogue used by the client so detail routes, metadata,
 * and sitemap URLs all use the same stable IDs and title normalization.
 */
export const getServerDuaCatalog = cache(async function getServerDuaCatalog() {
  try {
    const response = await fetch(DOA_BASE, {
      next: { revalidate: 86400, tags: ['daily-duas'] },
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const payload = unwrapPayload(await response.json());
      const apiRows = extractDuaRows(payload).map(normalizeDua).filter(isUsableDua);
      if (apiRows.length >= MIN_DUA_CATALOG_SIZE) {
        return enrichDuaSlugs(enforceBeforeMealDua(apiRows));
      }
    }
  } catch {
    // Keep direct links to bundled fallback prayers usable while offline/upstream fails.
  }
  return enrichDuaSlugs(enforceBeforeMealDua(fallbackDuas.map(normalizeDua).filter(isUsableDua)));
});

function enrichDuaSlugs(rows) {
  return rows.map((dua, index) => ({ ...dua, slug: getDuaSlug(dua, index) }));
}

export async function getServerDuaBySlug(slug) {
  const rows = await getServerDuaCatalog();
  const requested = String(slug || '').toLowerCase();
  const exact = rows.find((dua) => dua.slug === requested);
  if (exact) return exact;

  // Keep older shared links working if an upstream title changes but its numeric ID remains stable.
  const numericId = requested.match(/^(\d+)-/i)?.[1];
  if (numericId) return rows.find((dua) => String(dua.id) === numericId) || null;
  return null;
}
