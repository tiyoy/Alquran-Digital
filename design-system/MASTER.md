# Nurani — UI/UX Design System

Design brief for the Al-Qur'an Digital Indonesia application. The interface follows a design-system-first workflow inspired by the UI UX Pro Max approach: define the product context, tokens, typography, interaction rules, and failure states before extending components.

## Product context
- **Product:** mobile-first Islamic daily companion and Qur'an reader for Indonesian users.
- **Primary job:** continue tilawah with as little friction as possible.
- **Secondary jobs:** check local prayer times, discover daily duas, and reflect on Asmaul Husna.
- **Main device:** phones; layouts expand progressively for tablet and desktop.
- **Emotional direction:** calm, respectful, clear, warm, trustworthy—not ornate to the point of reducing reading comfort.

## Visual direction
- **Style:** quiet editorial utility with restrained Islamic geometric details, rounded surfaces, subtle elevation, and generous whitespace.
- **Primary palette:** Emerald `#059669`; deep emerald `#064E3B`; emerald tint `#E4F5ED`.
- **Accent:** Amber/gold `#D97706`; muted gold highlight `#F9E5B2`.
- **Canvas:** warm green-tinted off-white `#F6F8F5`.
- **Text:** dark forest `#172F27`; supporting text `#7D9289`.
- **Dark mode:** dark forest canvas with contrast-adjusted surfaces and emerald accent.
- **Typography:** Plus Jakarta Sans for interface; Amiri Quran / Scheherazade New with Noto Naskh Arabic / Amiri fallbacks for Arabic.
- **Iconography:** Lucide React, with consistent 16–20 px functional icons.

## Layout and breakpoints
- Start at 320 px wide; no horizontal page overflow.
- Mobile: single-column pages, sticky bottom navigation, player above navigation, compact list for surahs, thumb-friendly controls.
- Tablet: wider content gutters, 2–3 column surah and feature grids.
- Desktop: centered content capped around 1080 px; 3-column surah cards and 4-column Asmaul Husna grid.
- Safe areas: bottom navigation and modal spacing respect device `safe-area-inset-bottom`.

## Interaction standards
- All primary controls should have a minimum 44 × 44 px hit target where the layout permits; icon-only utility actions may be smaller only when grouped with surrounding spacing.
- Show loading, empty, offline, active, saved, and error states.
- Preserve bookmarks, last-read position, theme, reader visibility toggles, font sizes, reciter selection, and cached data in local storage.
- Provide clear back/navigation paths from reader detail to surah catalogue.
- Keep Quran text content readable above secondary controls. Arabic uses RTL, a dedicated Arabic font stack, responsive font size, and generous line-height.
- Audio playback uses one global sticky player, a clear active verse state, dismiss control, and auto-next for verse playback.
- Motion is subtle and disabled/reduced for users who prefer reduced motion.

## Component rules
- **Primary action:** emerald or gold-filled, strong contrast, concise verb label.
- **Secondary action:** surface-colored with a quiet border.
- **Card:** surface + neutral border; shadows are shallow and reserved for content groups.
- **Status:** small dot + label, never color alone.
- **Search:** explicit label/placeholder and visible clear state.
- **Modal/sheet:** dismissible backdrop, bounded height, readable content, close control.
- **Arabic text:** never truncate verse text; keep `dir="rtl"`, `lang="ar"`, line-height ≥ 2.3, and a fallback Arabic font chain.

## Content and data safety
- Official Quran text and translations should come from EQuran.id rather than manually recreating the full mushaf.
- Surah labels may use a bundled metadata fallback when disconnected; verses are cached after a successful read.
- Do not fabricate prayer times. When no local or API schedule is available, show an explicit unavailable state.
- API failure must not block navigation or locally saved preferences.

## Non-goals for first implementation
- No user account, server-side profile, or cloud sync.
- No claim of certified tajwid coloring, qibla direction, downloadable audio, or personal verse notes until those are implemented and validated.
