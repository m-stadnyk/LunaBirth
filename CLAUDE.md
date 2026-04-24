# CLAUDE.md — LunaBirth Codebase Guide

LunaBirth is a privacy-first Progressive Web App (PWA) for labour support. It runs entirely in the browser — all state persists to `localStorage` by default. Optional cloud sync via Supabase is available as an opt-in feature, but the app functions fully offline without it.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| UI | React 18 (JSX, no TypeScript) |
| Build | Vite 6 + `@vitejs/plugin-react` |
| PWA | `vite-plugin-pwa` + Workbox |
| Tests | Vitest 4 + @testing-library/react |
| Styling | Inline CSS-in-JS using theme tokens |
| i18n | Custom context-based system (en / uk) |
| Storage | Browser `localStorage` (primary) + optional Supabase |
| Cloud | `@supabase/supabase-js` ^2 (opt-in sync only) |
| Node | >=20.0.0 required |

---

## Project Structure

```
src/
├── App.jsx                 # Root: wires all hooks, manages tab nav, renders layout
├── main.jsx                # React entry point
├── adapters/               # Storage adapters (swappable local ↔ Supabase)
│   ├── DatabaseAdapter.js  # Abstract base interface
│   ├── LocalAdapter.js     # localStorage implementation
│   └── SupabaseAdapter.js  # Supabase implementation (cloud sync)
├── constants/              # Static data (affirmations, pain methods, phase configs)
│   ├── affirmations.js     # 12 English labour affirmations
│   ├── affirmations_uk.js  # 14 Ukrainian labour affirmations
│   ├── featureFlags.js     # Feature flag definitions (labels, defaults)
│   ├── methods.js          # 8 default pain relief methods
│   ├── phases.js           # Phase configs: tracking/early/active/transition
│   └── index.js            # Re-exports AFFIRMATIONS, PHASES, DEFAULT_METHODS
├── context/
│   ├── LocaleContext.jsx   # i18n provider (en/uk) — wrap with useLocale() hook
│   ├── DatabaseContext.jsx # Provides active storage adapter to the component tree
│   └── FeatureFlagContext.jsx # Provides feature flag values and toggles
├── theme/
│   └── index.js            # Two palettes: N (night-sky/dark) and P (legacy warm)
├── utils/                  # Pure functions: formatters, phase analysis, i18n, media
│   ├── countdown.js        # computeCountdown(dueDate, now, unit)
│   ├── formatters.js       # fmtSec, fmtMMSS
│   ├── i18n.js             # getNestedValue, createTranslator
│   ├── media.js            # getMediaType(url), getYtId(url)
│   ├── phaseAnalysis.js    # computePhase, computeStats, sortByPhase
│   ├── storage.js          # Async localStorage wrapper (get/set)
│   └── todoSorter.js       # sortTodos, groupByArea (keyword-based categorization)
├── hooks/                  # Stateful logic
│   ├── useAffirmations.js  # Locale-aware affirmation rotation (9s interval)
│   ├── useAppMode.js       # Labour ↔ expectation mode toggle
│   ├── useCloudSync.js     # Supabase auth, session sharing, partner invite flow
│   ├── useContractions.js  # Contraction timer, phase detection, stats
│   ├── useDueDate.js       # Due date + countdown unit management
│   ├── useFeatureFlags.js  # Feature flag state with localStorage persistence
│   ├── useHydration.js     # Water reminder timer, drink logging, intervals
│   ├── useLocale.js        # Language switching (en/uk)
│   ├── useNotifications.js # Browser Notification API for water reminders
│   ├── useRelief.js        # CRUD for pain relief methods, phase filtering
│   ├── useTodos.js         # Todo list with priority, calendar dates, sorting
│   └── useLabourContacts.js # CRUD for labour contacts (nickname + phone), localStorage + Supabase
├── components/             # Shared UI
│   ├── Icon.jsx            # 13 inline SVG icons
│   ├── Header.jsx          # Title, affirmation, mode toggle, settings button
│   ├── TabBar.jsx          # Tab navigation (different tabs per mode)
│   ├── ModeToggle.jsx      # Labour (✦) ↔ Expecting (☽) switcher
│   ├── SettingsModal.jsx   # Language, notifications, cloud sync, feature flags
│   ├── LabourContactsModal.jsx # Contacts popup: add/remove/call (tel: links), Contact Picker API on Android
│   ├── MethodModal.jsx     # Full-screen relief method viewer with media
│   ├── MediaDisplay.jsx    # YouTube / Spotify / image / link embeds
│   └── MediaInlineEditor.jsx # Text input for editing media URLs
├── features/               # Feature-based tab content
│   ├── contractions/
│   │   └── ContractionsTab.jsx  # Tap timer, phase/stats display, 5-1-1 rule
│   ├── hydration/
│   │   └── HydrationTab.jsx     # Ring timer, drink button, interval management
│   ├── relief/
│   │   └── ReliefTab.jsx        # Phase-sorted method list, inline editor
│   └── expectation/
│       ├── ExpectationTab.jsx   # Container: countdown + todo list
│       ├── DueDateCountdown.jsx # Due date picker, countdown (wks+days/days/hrs)
│       ├── TodoList.jsx         # Task list renderer
│       ├── TodoCard.jsx         # Task card: priority, calendar, done toggle
│       ├── AddTaskForm.jsx      # New task input
│       └── TaskModal.jsx        # Detailed task editor modal
└── i18n/
    ├── en.json             # English translations
    └── uk.json             # Ukrainian translations
```

---

## Development Commands

```bash
npm run dev              # Dev server at localhost:5173 (hot reload)
npm run build            # Production build → dist/
npm run preview          # Preview production build locally
npm test                 # Run all tests once
npm run test:watch       # Tests in watch mode
npm run test:ui          # Browser test UI
npm run test:coverage    # Coverage report (HTML + text, uses v8)

# Build + serve over LAN (for testing PWA on mobile)
./scripts/build-and-serve.sh
./scripts/build-and-serve.sh --https   # Required for iOS PWA install
```

> **Note:** The production build requires `NODE_OPTIONS="--require ./crypto-shim.cjs"` — this is already set in the `build` script via `package.json`. Do not remove it; it polyfills Node 18 crypto for workbox-build.

---

## Architecture Patterns

### State Management
- All state lives in custom hooks in `src/hooks/`.
- No Redux, no Zustand — plain `useState`/`useEffect`/`useRef`/`useMemo`.
- Persistent state is loaded on mount and saved on change via the active `DatabaseAdapter` from `DatabaseContext`.
- Feature hooks (`useContractions`, `useTodos`, `useHydration`, `useRelief`) call `adapter.getX()` / `adapter.saveX()` / `adapter.subscribeX()` from `useDatabase()` — never `storage.get/set` directly.
- When adapter changes (e.g. partner joins and context swaps to `SupabaseAdapter`), hooks re-hydrate automatically because `adapter` is in their `useEffect` dependency array.

### Storage Adapters
- `src/adapters/` contains a pluggable storage layer: `DatabaseAdapter` (abstract base), `LocalAdapter` (localStorage), `SupabaseAdapter` (cloud).
- The active adapter is provided via `DatabaseContext` and consumed by feature hooks via `useDatabase()`.
- The app defaults to `LocalAdapter` — Supabase is only activated when the user opts into cloud sync.
- Swapping adapters (via `setAdapter` from `DatabaseContext`) causes all feature hooks to re-load their state from the new backend and start new realtime subscriptions.
- Tests for adapters live in `src/__tests__/adapters/`.

### Feature Flags
- Feature flag definitions (labels, defaults) live in `src/constants/featureFlags.js`.
- Runtime values are managed by `useFeatureFlags` and provided via `FeatureFlagContext`.
- Flags are persisted to `luna_flags` in localStorage.
- The Settings modal surfaces a toggleable list of flags.

### Cloud Sync (Supabase)
- Managed by `useCloudSync` — handles sign-in, session creation, partner invite flow, sync, and sign-out.
- The primary user generates a 6-character invite code stored in `luna_invite_code`; a partner joins with that code.
- User role is stored in `luna_user_role` (`"primary"` or `"partner"`).
- Last sync timestamp is stored in `luna_cloud_last_sync`.
- Cloud sync is entirely opt-in; removing Supabase credentials leaves the app fully functional via localStorage.

### Notifications
- Managed by `useNotifications` — wraps the browser Notification API.
- Used for water reminder alerts; fires when the hydration countdown expires if permission is granted.
- Enabled state persists to `luna_notif_water` (`"1"` / `"0"`).
- Notification permission is requested lazily on first enable; a hint is shown in Settings if denied.

### localStorage Keys
| Key | Content |
|-----|---------|
| `lc_c4` | Contraction history array |
| `lc_m4` | Pain relief methods |
| `lc_dc` | Drink count |
| `lc_ld` | Last drink timestamp |
| `lc_di` | Active drink interval (minutes) |
| `lc_iv` | Custom interval list |
| `luna_mode` | App mode: `"labour"` or `"expectation"` |
| `luna_locale` | Language: `"en"` or `"uk"` |
| `luna_due_date` | ISO date string |
| `luna_countdown_unit` | Countdown display unit (`wks_days` / `days` / `hours`) |
| `luna_todos` | Task list array |
| `luna_flags` | Feature flags JSON object |
| `luna_contacts` | Labour contacts array |
| `luna_notif_water` | Water notifications enabled: `"1"` or `"0"` |
| `luna_cloud_uid` | Supabase user ID (cloud sync only) |
| `luna_session_id` | Cloud session ID (cloud sync only) |
| `luna_user_role` | Session role: `"primary"` or `"partner"` (cloud sync only) |
| `luna_cloud_last_sync` | Timestamp of last successful cloud sync |
| `luna_invite_code` | 6-character partner invite code (cloud sync only) |

### Internationalization
- All user-facing strings must go through `t()` from `useLocale()`.
- Translation files are `src/i18n/en.json` and `src/i18n/uk.json`.
- Supports `{{variable}}` interpolation: `t("key", { var: value })`.
- Both locale files must be kept in sync — add keys to both when adding UI text.
- Ukrainian affirmations (`affirmations_uk.js`) are culturally adapted, not direct translations.

### Theming
- Theme tokens are in `src/theme/index.js`.
- `N.*` = night-sky (dark, primary palette). Key tokens:
  - `N.bg` (#0B1229), `N.bgGradient` (radial CSS gradient — use this for full-page backgrounds instead of a flat colour), `N.card` (rgba card), `N.cardSolid` (#131D45)
  - `N.gold` / `N.goldDark` / `N.goldLight` — accent gold
  - `N.silver` / `N.silverDark` / `N.silverLight` — secondary silver
  - `N.text` (#E8EDF8), `N.muted` (#8A9ABE), `N.border`, `N.alert` (#E07575)
- `P.*` = legacy warm palette (kept for backward compatibility, secondary use).
- Priority colours (for todos): `high: #D4A843`, `medium: rgba(212,168,67,0.52)`, `low: rgba(212,168,67,0.22)`.
- Apply via inline style objects: `style={{ background: N.bgGradient, color: N.text }}`.
- Do not introduce CSS files or CSS modules — keep styling inline.
- There is no background image — the night-sky depth is achieved purely via `N.bgGradient` (a CSS radial gradient). Do not re-introduce an image-based background.

### Icon System
- 13 stroke-based inline SVG icons in `src/components/Icon.jsx`, all 24×24, inheriting `currentColor`.
- Available names: `wave`, `drop`, `leaf`, `sparkle`, `moon`, `seedling`, `phone`, `calendar`, `bulb`, `image`, `check`, `star`, `close`.
- Usage: `<Icon name="wave" size={24} color={N.accent} />`.
- To add a new icon: add a case to the switch in `Icon.jsx` with the SVG path.

### Phase Detection (Labour)
- Computed in `src/utils/phaseAnalysis.js` via a majority-vote algorithm.
- Requires at least 5 contractions to leave "tracking" phase.
- Phases: `tracking` → `early` → `active` → `transition`.
- Phase configs (icons, colors, drink intervals) are in `src/constants/phases.js`.
- Relief methods in `src/constants/methods.js` carry a `phases` array for sorting.

### Tab Layout
- **Labour mode:** Contractions → Hydration → Relief
- **Expectation mode:** Expecting (countdown + todos) → Hydration → Relief
- Tab switching is managed in `App.jsx`; the active component is rendered in the content area.
- `MethodModal` and `SettingsModal` render as overlays on top of tab content.

### PWA / Caching
- PWA manifest and Workbox strategy configured in `vite.config.js`.
- Cached at runtime: Google Fonts (365 days) and YouTube thumbnails (30 days).
- Service worker is generated by Vite PWA plugin — do not hand-edit it.

### App Icons & Splash Screen
- Icons live in `public/icons/`: `icon.svg` (any size, used by modern Android/desktop), `icon-192.png` (192×192, used as `apple-touch-icon`), `icon-512.png` (512×512, maskable for Android home screen).
- All icons show a gold crescent moon (`#D4A843`) on a deep navy background with silver stars, matching the night-sky palette.
- PWA manifest `theme_color` and `background_color` are both `#0B1229` — this controls the splash screen colour and the Android task-switcher card.
- `index.html` sets `<meta name="theme-color" content="#0B1229">` (Android status bar) and `apple-mobile-web-app-status-bar-style` to `black-translucent` (iOS status bar blends with app background).
- To update the icon design, regenerate both PNGs and update `icon.svg` to keep all three in sync.

---

## Data Models

```javascript
// Contraction
{ start: 1712262400000, duration: 45, time: "10:30 AM" }

// Pain Relief Method
{ id: "m1", name: "Sway & slow hip circles", mediaUrl: "", phases: ["early", "active"] }
// Custom user methods use id: `u${Date.now()}`

// Todo Task
{
  id: "uuid", text: "Pack hospital bag",
  priority: "high" | "medium" | "low",
  done: false, createdAt: 1712262400000,
  calendarDate: "2024-05-20",   // optional
  calendarUrl: "https://...",   // optional
  group: "medical" | "shopping" | "admin" | "home" | "other"  // auto-assigned by todoSorter
}

// Phase Stats (computed, not persisted)
{ avgDur: 45, avgGap: 5.2, trend: "intensifying" | "spacing out" | "stable", rule511: false }

// Countdown result (from utils/countdown.js)
{ overdue: false, primary: 12, secondary: 3, labels: { primary: "weeks", secondary: "days" } }
```

---

## Testing Conventions

### Test-Driven Development (TDD)
Prefer TDD for all new code and refactoring. The goal is to catch bugs at the earliest possible point — before the implementation exists.

**Workflow:**
1. **Red** — write a failing test that describes the desired behaviour.
2. **Green** — write the minimum code to make it pass.
3. **Refactor** — clean up while keeping tests green.

**Apply TDD to:**
- All new hooks and utilities — write edge-case tests first, then implement.
- Bug fixes — write a test that reproduces the bug before fixing it; the test proves the fix.
- Refactors — ensure existing tests cover the affected paths before touching code; add missing ones first.
- New components — write render/interaction tests before wiring up the JSX.

**Practical notes:**
- Run `npm run test:watch` while developing to get a tight red/green feedback loop.
- Keep each test focused on one behaviour; prefer many small tests over a few large ones.
- Test observable behaviour (outputs, DOM state, hook return values), not implementation details.

### General Conventions
- Test files live in `src/__tests__/` mirroring `src/` structure.
- Adapters: `src/__tests__/adapters/`, Hooks: `src/__tests__/hooks/`, Components: `src/__tests__/components/`, Context: `src/__tests__/context/`, Utils: `src/__tests__/utils/`.
- `src/__tests__/setup.js` provides: localStorage mock, jest-dom matchers, Vitest globals.
- Wrap components under test with `<LocaleContext>` when they use `useLocale()`.
- Mock `src/utils/storage.js` for hook tests that touch persistence.
- Mock Supabase client when testing `useCloudSync` or `SupabaseAdapter`.
- Vitest environment: `jsdom`. Coverage provider: `v8`.

### Current Test Coverage (27 test files)
| Directory | Files |
|-----------|-------|
| `adapters/` | LocalAdapter |
| `components/` | DueDateCountdown, Header, MediaDisplay, ModeToggle, SettingsModal, TaskModal, TodoCard |
| `context/` | FeatureFlagContext, LocaleContext |
| `hooks/` | useAppMode, useCloudSync, useContractions, useDueDate, useFeatureFlags, useHydration, useLocale, useNotifications, useRelief, useTodos |
| `utils/` | countdown, formatters, i18n, media, phaseAnalysis, todoSorter |

---

## Key Conventions

1. **localStorage-first** — all core features must work offline via localStorage. Supabase is the only permitted external call, and only when the user explicitly enables cloud sync.
2. **No new CSS files** — all styling is inline using theme tokens.
3. **No TypeScript** — plain JSX throughout; do not convert files.
4. **Privacy first** — no analytics, no tracking. Cloud sync is opt-in and user-controlled.
5. **i18n everything** — all user-visible text must have keys in both `en.json` and `uk.json`.
6. **TDD first** — write tests before (or alongside) implementation for all new hooks, utilities, adapters, and bug fixes. See Testing Conventions for the workflow.
7. **Phase-aware UI** — new features in labour mode should respect the current phase (use `currentPhase` from `useContractions()`).
8. **Affirmations rotate every 9 seconds** — do not change this interval without updating `useAffirmations.js`.
9. **Feature flags** — new experimental features should be gated behind a flag defined in `src/constants/featureFlags.js`.

---

## Deployment

```bash
npm run build             # Output in dist/
# Then deploy dist/ via:
# - Netlify Drop: drag dist/ to netlify.com/drop
# - Vercel: npx vercel deploy --prod
# - GitHub Pages: push dist/ to gh-pages branch
```

**Automated deployment:** The production app is deployed via Netlify with continuous deployment. Pushes to the `main` branch automatically trigger a new Netlify build and publish. No manual `dist/` upload is needed for production — just merge to `main`.

HTTPS is required for iOS PWA installation and for the browser Notification API. Use Netlify/Vercel or the `--https` flag in `build-and-serve.sh` for local testing.

### App Versioning

- The app version is defined in `package.json` (`version` field).
- Vite injects it as `__APP_VERSION__` at build time (via `define` in `vite.config.js`).
- The version is displayed as a fixed badge at the bottom of every screen.
- Users can check for PWA updates via the "Check for Updates" button in Settings → App Version.
- The update check calls `ServiceWorkerRegistration.update()`. Because `registerType: "autoUpdate"` is set, any new service worker skips waiting and immediately takes control, triggering a page reload.

#### Automated version bumping (CI)

- `.github/workflows/bump-version.yml` runs on every PR targeting `main`.
- It compares the PR branch version against `main`. If they match, it auto-bumps the **patch** segment (`npm version patch --no-git-tag-version`) and commits `package.json` + `package-lock.json` back to the PR branch.
- If the branch already carries a manually-bumped version (minor or major), the action skips the bump — the human decision is respected.
- The commit message format is `chore: bump version X.Y.Z → X.Y.Z+1`; the action also ignores commits with that prefix to avoid infinite loops.

#### When to bump manually

Use `npm version <patch|minor|major> --no-git-tag-version` before opening a PR when:

| Change type | Version segment |
|-------------|----------------|
| Bug fixes, copy changes, style tweaks | `patch` (auto-bumped by CI if you skip this) |
| New feature or notable UX addition | `minor` |
| Breaking change, major redesign, large new section | `major` |

**Suggestion cadence:** After every meaningful feature branch, verify the version in `package.json` is intentional before merging. For pure chore/docs branches it is fine to let CI handle the patch bump automatically.

---

## Roadmap (TODO.md)

- Birth keepsake PDF generator
- Statistics logging
- Configurable fun-fact popups / achievement badges
- User info storage (v3.0)

---

## Custom instructions 

- Update CLAUDE.md when updating existing logic/approach or adding a new feature 
- Ask feature priority and evaluate risks of adding some complex logic to prevent bugs and tech debt 

