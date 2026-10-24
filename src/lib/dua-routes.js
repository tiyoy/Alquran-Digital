/** URL helpers for stable, shareable daily-dua pages. */
export function slugifyDuaText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getDuaSlug(dua, index = 0) {
  const id = slugifyDuaText(dua?.id ?? index + 1) || String(index + 1);
  const title = slugifyDuaText(dua?.judul ?? dua?.title ?? dua?.nama ?? dua?.name) || 'doa-harian';
  return `${id}-${title}`;
}

export function getDuaPath(dua, index = 0) {
  return `/doa/${getDuaSlug(dua, index)}`;
}

export function getDuaSlugFromPathname(pathname) {
  const normalized = String(pathname || '/').replace(/\/+$/, '') || '/';
  const match = normalized.match(/^\/doa\/([a-z0-9-]+)$/i);
  return match ? match[1].toLowerCase() : null;
}
