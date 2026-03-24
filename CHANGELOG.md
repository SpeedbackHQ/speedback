# Changelog

All notable changes to SpeedBack are documented in this file.

---

## [2026-03-24] — Narrativa Survey Refinements

### Changed
- **4 daily workshop surveys** instead of 1 shared survey — each day (Thu/Fri/Sat/Sun) gets its own survey with its own QR code
- **Workshop selection as Q1** — each daily survey starts with Tap to Select for that day's 4 workshops
- **Combined Opening Party + Murder Mystery** into one survey — "Did you play the Murder Mystery?" gate question with conditional follow-ups (12 surveys, 12 QR codes total)
- **Workshop Q12 unconditional** — "One thing to improve?" always shown with skip option (`allow_skip: true`) instead of conditional on negative swipes
- Replaced workshop Q6 ("beginners or experienced?") with two new questions: "Would you want a deeper dive?" (Swipe) and "How new was the material?" (This or That)
- **Narrativa QR codes** now solid black (`#212121`) instead of SpeedBack gradient — custom brand colors use solid color, SpeedBack default keeps gradient
- **"How did you hear about Narrativa?"** added to Opening Party (Tap to Select)

### Added
- **Favicon** — ⚡ lightning bolt emoji as SVG favicon
- **SpeedBack logo SVG** in public assets

---

## [2026-03-16] — Narrativa Festival

### Added
- **Festival URL routing** — `/f/[festival]/[slug]` public routes for branded QR code links
- **Workshop selection flow** — daily QR codes load a picker screen (workshop name + facilitator) before the shared survey
- **show_conditions system** — cross-question conditional visibility with OR logic across multiple questions (e.g., show Q10 only if Q1 or Q2 was negative)
- **Email capture question type** (`email_capture`) — collects email + organizer checkbox, saves lead immediately via `/api/leads` (not on survey completion)
- **Dashboard folders** — surveys grouped under collapsible folder headers by `folder` column (e.g., "Narrativa 2026")
- **Dashboard inline delete** — trash icon on each survey card with confirm/cancel dialog (no more navigating in to delete)
- **Leads CSV export** — "Download Leads" button on survey detail page for surveys with email_capture questions
- **12 Narrativa surveys seeded** covering workshops, shows, community events, and meta feedback
- **12 QR slugs** mapped via `festival_configs` table (4 workshop days, 3 shows, 4 community events, 1 meta)
- **Database**: `slug` + `folder` columns on surveys, `metadata` on responses, `leads` table, `festival_configs` table

---

## [Unreleased] — 2026-03-16

### Added
- **Wheel mechanic** — spinning wheel with SVG segments, tap-to-spin, deceleration, confirm/retry
- **Rank mechanic** — drag-to-reorder list with Framer Motion `Reorder`, grip handles
- **Counter mechanic** — +/− buttons with large number display for counting questions
- **Single-select mode** for Paint Splatter and Bingo Card — "Allow multiple selections" toggle in editor; single-select auto-submits on tap
- **TEST MECHANICS survey** — comprehensive test survey with all mechanics for QA testing
- Pulsing **TAP!** cue on Treasure Chest, Pinata, and Tap Meter (replaces gray instruction text); persists throughout entire tapping phase
- Confirm/retry buttons on **Bubble Pop** (replaces auto-submit)
- **Flick Cards** — left/right arrow navigation buttons beside cards
- **Sticker Board + Jar Fill** — prominent animated drag hint ("↕ Drag items...")
- **Fullscreen API** — requests fullscreen on Start tap to hide mobile browser chrome
- **Leaderboard re-entry** — clicking "See where you rank" after submitting initials goes directly to leaderboard (no re-prompting)

### Fixed
- **Mobile viewport** — SurveyPlayer uses `position: fixed; inset: 0` to prevent page scroll on mobile
- **Door Choice** — doorknob repositioned to right side above divider line (no longer overlaps text or sits in bottom corner)
- **Gravity Drop** — letter-coded buckets (A/B/C/D) with color legend below; horizontal padding prevents right-edge clipping
- **Scratch Card** — `touch-action: none` on wrapper prevents page scroll while scratching
- **Bubble Pop** — removed bottom legend (unnecessary for short options)
- **Slingshot** — letter-coded targets (A/B/C/D) with color legend below (fixes text overflow on targets)
- **Claw Machine** — letter-coded items with color legend below
- **Treasure Chest** — improved opened phase with `overflow-visible` and perspective
- **Spin & Stop** — removed duplicate result badge below reel
- **Stacked Cards** — increased container height for bottom spacing; vertical dots on right side with more gap
- **Conveyor Belt** — infinite looping (removed 3-loop limit); toggle grab/ungrab; removed loop counter
- **Press & Hold** — labels now show "0% = Meh" / "100% = All in" for clear scale endpoints
- **Leaderboard "← you" arrow** — changed to yellow bold for readability on dark overlay
- **Slot Machine (`slot_machine`)** — mapped to SpinStopQuestion (no more "unknown type" error)

### Changed
- **Whack-a-Mole** — moles loop continuously until user whacks one (no more all-show freeze)
- **"Try Again" labels** — contextual per mechanic: Pick Again, Drop Again, Pop Again, Spin Again
- **Fanned Swipe** — increased 3D perspective (rotateY 25° → 35°, scale 0.85 → 0.8)
- **Stacked Cards** — rotateZ tilt on background cards for visual depth
- **Wheel** — reduced result redundancy (removed subtitle update + emoji, kept confirm/retry only)

### Removed
- **Countdown Tap** mechanic — fully removed (component, editor, types, templates, playground). Not collecting valuable data.
- Thermometer gesture overlay (intuitive without it)

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
