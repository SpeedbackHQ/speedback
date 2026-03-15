# Changelog

All notable changes to SpeedBack are documented in this file.

---

## [Unreleased] — 2026-03-15

### Added
- **Wheel mechanic** — new spinning wheel question type with SVG segments, tap-to-spin, deceleration animation, and confirm/retry flow
- **TEST MECHANICS survey** — comprehensive test survey with all 46+ question mechanics for QA testing
- Pulsing **TAP!** cue on Treasure Chest, Pinata, and Tap Meter mechanics (replaces easy-to-miss gray instruction text)
- Confirm/retry buttons on **Bubble Pop** (replaces auto-submit after 1200ms)

### Fixed
- **Mobile viewport** — SurveyPlayer now uses `position: fixed; inset: 0` to prevent page scroll on mobile browsers (Samsung S23 confirmed)
- **Door Choice** — doorknob moved to bottom-right corner so it no longer overlaps option text; added right padding to text
- **Gravity Drop** — added horizontal padding to bucket container to prevent right-edge clipping on 4-option layouts
- **Scratch Card** — added `touch-action: none` and `overscroll-behavior: none` to wrapper to prevent page scroll while scratching on mobile
- **Bubble Pop** — removed bottom legend (unnecessary for short option names)

### Changed
- **Whack-a-Mole** — moles now loop continuously until user whacks one (previously all popped up and stayed after 6 pairs)
- **"Try Again" labels** — contextual labels per mechanic: "Pick Again" (Treasure Chest, Pinata), "Drop Again" (Gravity Drop), "Pop Again" (Bubble Pop), "Spin Again" (Wheel)
- **Fanned Swipe** — increased 3D perspective effect (rotateY 25° → 35°, scale 0.85 → 0.8) for more dramatic fanning
- **Stacked Cards** — added rotateZ tilt (-1° to 2°) and increased y offsets between stacked cards for more visual depth

---

## [2026-03-06]

### Improved
- Apply Sync Game UX learnings: drag disambiguation, responsive typography, `.maybeSingle()` for safer data queries

---

## [2026-03-04]

### Added
- **This or That** question type with binary choice UX
- Readable option legend below slingshot game area
- Frictionless signup with deferred email verification

### Fixed
- Swipe gesture icons and door mechanic visuals
- Replaced generic "Option 1/2/3" defaults with realistic example text

---

## [2026-03-03]

### Changed
- Complete redesign of slingshot mechanic with carnival game aesthetics
- Repositioned targets (top) and slingshot (bottom) for better layout
- Multiple rounds of target positioning and label visibility fixes

### Fixed
- Mobile layout issues across game mechanics
- Slingshot auto-launch when dragging outside container
- Target cutoff at screen edges

---

## [2026-03-02]

### Fixed
- Door choice mechanic UX interaction
- Leaderboard display polish
- Survey player cleanup when survey is full
- Added thermometer gesture hint

---

## [2026-03-01]

### Added
- **Completion leaderboard** with percentile scores
- Poster CTAs for survey sharing
- **Internal analytics dashboard** for survey creators

### Changed
- Renamed routes: `/admin` → `/dashboard` (users), `/internal` → `/admin` (owner analytics)

---

## [2026-02-23]

### Changed
- Updated landing page hero and subtitle copy
- Replaced "Lightning Fast" feature card with qualitative depth messaging

### Fixed
- Dropdown click-outside handler using separate refs for desktop/mobile

---

## [2026-02-22]

### Improved
- Comprehensive SaaS UI/UX best practices across 8 phases

---

## [2026-02-21]

### Improved
- Comprehensive mobile responsiveness improvements across all pages

---

## [2026-02-20]

### Added
- Payment system and premium feature restrictions (Stripe integration)
- Test account bypass for development

### Fixed
- Double header and navigation issues
- Navigation showing on homepage when logged in
- Brand wordmark font consistency across all pages
- Auth redirect flow and account UX
- Typography consistency (removed forced uppercase from UI text)
- Dropdown UX and display names
- Survey editor 406 error (correct Supabase client)

### Changed
- Consolidated Profile/Settings into single Account tab
- Consistent branded header layout across admin and account pages

---

## [2026-02-19]

### Added
- **SaaS infrastructure**: authentication, user accounts, subscription management
- Domain migration from `speedback.app` → `speedback.fun`

---

## [2026-02-18] — Launch

### Added
- **Pricing page** with free tier and Stripe payment integration
- **PostHog** event tracking in survey player
- **Microsoft Clarity** session recording
- Email infrastructure via Resend
- Inline mechanic editing in question editor
- Mechanic type badge with emoji indicator and swap icon

### Fixed
- Dark mode styling issues
- Resend lazy init to prevent build crash when API key is unset
- Stripe build-time init error with lazy singleton
- Gesture hint now shown once per gesture type per session

### Removed
- "Create Poster" button (pre-launch cleanup)
- Gesture overlay from slider and tug_of_war (unnecessary)

---

## [2026-02-10]

### Added
- **8 curated survey templates** for quick survey creation

---

## [2026-02-09]

### Added
- **8 multi-select game mechanics**: paint splatter, bingo card, shopping cart, sticker board, jar fill, conveyor belt, magnet board, claw machine
- Converted Sticker Board and Jar Fill from tap to drag-and-drop

---

## [2026-02-08]

### Added
- **Mechanics Playground** for instant game testing during development
- **10 new interactive mechanics**: toggle switch, dial, press & hold, spin & stop, countdown tap, door choice, whack-a-mole, tug of war, tilt, flick
- **5 qualitative question types**: short text, mad libs, emoji reaction, word cloud, voice note
- Category-first mechanic picker in editor
- Gesture hint overlays for non-obvious mechanics

---

## [2026-02-07]

### Fixed
- Bubble animation: memoize options to prevent re-initialization during render

---

## [2026-02-06]

### Fixed
- Lint errors: removed `Math.random` during render, cleaned up unused imports

---

## [2026-02-05]

### Changed
- Limited all question types to max 4 options
- Redesigned Bubble Pop mechanic for consistency

---

## [2026-02-04] — Core App

### Added
- **SpeedBack core app** with 20+ interactive question types
- Tabbed survey editor with auto-save
- **Treasure Chest** and **Pinata** question types
- CSV export for survey responses
- Drop Zone drag-and-drop mechanic (replaced TiltMaze)

### Fixed
- Mobile viewport issues
- Mini-game mechanics and user choice experience
- Racing Lanes: slower AI, preview phase, user lane position, double-submit prevention
- Slingshot targets getting clipped at edges
- Option flickering and Racing Lanes layout with many options
- Emoji slider: allow dragging when tapping directly on thumb

---

## [2026-02-01] — Project Init

### Added
- Initial Next.js 16 project with React 19, TypeScript, and Tailwind CSS 4
- Supabase backend integration

---

## Tech Stack

- **Framework**: Next.js 16 / React 19 / TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Payments**: Stripe
- **Email**: Resend
- **Analytics**: PostHog, Microsoft Clarity
- **Domain**: speedback.fun
