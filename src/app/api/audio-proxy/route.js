const AUDIO_PATH_PATTERN = /^\/audio[a-z0-9-]*(?:\/[a-z0-9_-]+){1,5}\.mp3$/i;
const ALLOWED_AUDIO_HOST = 'cdn.equran.id';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Audio is streamed end-to-end; do not buffer a complete MP3 in this function.
export const maxDuration = 60;

function isAllowedAudioUrl(value) {
  try {
    const url = value instanceof URL ? value : new URL(value);
    return url.protocol === 'https:'
      && url.hostname.toLowerCase() === ALLOWED_AUDIO_HOST
      && !url.username
      && !url.password
      && !url.port
      && !url.search
      && !url.hash
      && AUDIO_PATH_PATTERN.test(url.pathname);
  } catch {
    return false;
  }
}

function jsonError(message, status = 502) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

/**
 * Same-origin streaming proxy for EQuran full-surah and individual-verse MP3s.
 * Browser-side fetch to the CDN can fail when the CDN does not expose CORS headers;
 * this route keeps the file streamed instead of buffering the whole response in a
 * Vercel Function. Only MP3 paths within the official EQuran audio namespace are permitted; arbitrary hosts and paths are rejected.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const rawSource = requestUrl.searchParams.get('src');
  if (!rawSource || rawSource.length > 2048) {
    return jsonError('URL audio tidak ada atau terlalu panjang.', 400);
  }

  let source;
  try {
    source = new URL(rawSource);
  } catch {
    return jsonError('URL audio tidak valid.', 400);
  }
  if (!isAllowedAudioUrl(source)) {
    return jsonError('Sumber dibatasi ke file MP3 audio resmi CDN EQuran.', 400);
  }

  const outgoingHeaders = new Headers();
  const range = request.headers.get('range');
  if (range && /^bytes=\d*-\d*(?:,\d*-\d*)*$/.test(range)) outgoingHeaders.set('Range', range);

  let upstream;
  let current = source;
  try {
    for (let hop = 0; hop < 2; hop += 1) {
      upstream = await fetch(current, {
        method: 'GET',
        headers: outgoingHeaders,
        cache: 'no-store',
        redirect: 'manual'
      });

      if ([301, 302, 303, 307, 308].includes(upstream.status)) {
        const location = upstream.headers.get('location');
        await upstream.body?.cancel().catch(() => {});
        if (!location || hop === 1) return jsonError('CDN audio mengalihkan permintaan berulang kali.');
        let redirected;
        try { redirected = new URL(location, current); } catch { return jsonError('Alamat pengalihan CDN tidak valid.'); }
        if (!isAllowedAudioUrl(redirected)) return jsonError('CDN mengalihkan audio ke host yang tidak diizinkan.');
        current = redirected;
        continue;
      }
      break;
    }
  } catch {
    return jsonError('Server Nurani tidak dapat mengambil file audio dari CDN EQuran. Coba lagi beberapa saat.');
  }

  if (!upstream || (upstream.status !== 200 && upstream.status !== 206)) {
    const status = upstream?.status;
    await upstream?.body?.cancel().catch(() => {});
    return jsonError(status ? `CDN EQuran mengembalikan HTTP ${status} untuk file audio ini.` : 'CDN EQuran tidak mengembalikan respons audio.');
  }
  if (!upstream.body) return jsonError('CDN EQuran mengembalikan file audio kosong.');

  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg'
  });
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Return the upstream ReadableStream directly. Do not call arrayBuffer(), blob(),
  // or text() here: MP3 files can exceed the non-streamed Vercel response limit.
  return new Response(upstream.body, { status: upstream.status, headers });
}
