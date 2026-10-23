# UI/UX Pre-delivery Audit

## Implemented
- [x] Mobile-first layout with small-screen breakpoints.
- [x] Bottom navigation for five primary sections.
- [x] Emerald / gold visual system and dark/light theme.
- [x] Arabic font fallback chain, RTL and responsive reading controls.
- [x] Hifz toggles for Arabic, Latin, and translation.
- [x] Surah search, revelation-place filters, bookmarks, and jump-to-verse.
- [x] Per-verse playback control, global sticky audio player, verse highlighting, and auto-next.
- [x] Tafsir overlay and loading feedback.
- [x] City search for prayer times and visible failure messaging.
- [x] Doa list, search, expandable reading details, and copy action.
- [x] 99 Asmaul Husna cards with search and device-local favorites.
- [x] PWA manifest, offline page, service worker, app icons, and install prompt handling.
- [x] Local storage for theme, reading preferences, bookmarks, last-read position, and API caches.
- [x] `prefers-reduced-motion` support and keyboard focus styles.

## Engineering release gates
- [ ] Review current Next.js advisories and upgrade from the PRD's Next.js 14 baseline to a supported patched version before production deployment.
- [ ] Install dependencies and run a production build in a network-enabled environment (dependency install was unavailable in the authoring runtime).

## Verify on real devices before release
- [ ] Confirm current EQuran.id response fields for the chosen reciter's verse audio and full-surah audio.
- [ ] Confirm service worker caching behavior on deployed HTTPS origin and test airplane-mode launch.
- [ ] Verify prayer schedules for the user's selected city and its time zone.
- [ ] Check Arabic glyph quality across Android Chrome, iOS Safari, and desktop Firefox.
- [ ] Run full `npm install`, `npm run build`, Lighthouse PWA/accessibility/performance, and browser smoke tests in a network-enabled environment.
