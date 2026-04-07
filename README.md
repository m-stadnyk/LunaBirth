# LunaBirth — Personal Labour Support App

A mobile-first Progressive Web App (PWA) for tracking contractions, hydration, and pain relief techniques during labour. Runs entirely in the browser — no backend required. All data stays on your device by default; cloud sync and partner sharing are available optionally via Supabase.

## Features

- **Contraction Tracker** — tap to start/stop, automatic 5-1-1 rule detection, labour phase analysis
- **Hydration Reminders** — countdown ring timer, adaptive intervals based on labour phase
- **Pain Relief Methods** — phase-sorted techniques with optional images, YouTube, or Spotify links
- **Labour Phase Detection** — evidence-based majority-vote algorithm (tracking → early → active → transition)
- **Affirmations** — rotating supportive messages throughout
- **Expectation Mode** — due date countdown and task list for pre-labour preparation
- **Bilingual** — English and Ukrainian (🇬🇧 / 🇺🇦)
- **Cloud Sync & Partner Sharing** *(optional)* — real-time sync across devices via Supabase

---

## Prerequisites

- **Node.js ≥ 20.0.0** — check with `node --version`
- **npm** — bundled with Node; check with `npm --version`

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/m-stadnyk/lunabirth.git
cd lunabirth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate PWA icons (first time only)

```bash
node scripts/generate-icons.js
```

This creates `public/icons/icon-192.png` and `public/icons/icon-512.png` required by the PWA manifest.

### 4. Configure environment variables

```bash
cp .env.example .env
```

- **Local-only mode** (default): leave the `.env` values blank — all data stays in `localStorage`.
- **Cloud sync mode**: fill in your Supabase credentials (see [Cloud Sync Setup](#cloud-sync--partner-sharing-optional) below).

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build for Production

```bash
npm run build
```

Output is in `dist/`. The build script automatically applies a Node crypto polyfill (`crypto-shim.cjs`) required by the Workbox PWA plugin — do not remove it from `package.json`.

Preview the production build locally:

```bash
npm run preview
# Opens at http://localhost:4173
```

---

## Install on Your Phone (PWA)

### Option A — Deploy to Netlify (recommended, free)

1. `npm run build`
2. Go to **[netlify.com/drop](https://app.netlify.com/drop)** and drag-and-drop the `dist/` folder
3. Open the generated URL in Safari (iOS) or Chrome (Android) on your phone
4. **iOS Safari**: Share → "Add to Home Screen"
5. **Android Chrome**: menu → "Add to Home Screen" (or the install banner)

### Option B — Deploy to Vercel

```bash
npm run build
npx vercel deploy --prod
```

### Option C — Local Wi-Fi preview

Both your phone and computer must be on the same Wi-Fi network.

```bash
./scripts/build-and-serve.sh          # HTTP — works on Android
./scripts/build-and-serve.sh --https  # HTTPS — required for iOS PWA install
```

The script prints the local URL to open on your phone.

> **iOS note:** iOS requires HTTPS for full PWA installation. Use Netlify/Vercel or the `--https` flag above.

---

## Cloud Sync & Partner Sharing *(optional)*

Cloud sync lets you share live labour data with a partner on another device in real time. It uses [Supabase](https://supabase.com) (free tier is sufficient).

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project
2. Go to **Project Settings → API** and copy:
   - **Project URL** (`https://your-project-id.supabase.co`)
   - **anon / public key**

### 2. Run the database schema

In your Supabase project, go to **Database → SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.

This creates the `sessions`, `contraction_snapshots`, `hydration_snapshots`, and `todo_snapshots` tables with Row Level Security policies enforcing owner/partner access.

### 3. Add credentials to `.env`

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Enable Realtime

In the Supabase dashboard, go to **Database → Replication** and enable replication for:
- `contraction_snapshots`
- `hydration_snapshots`
- `todo_snapshots`

*(The schema SQL also includes `ALTER PUBLICATION` statements that do this automatically.)*

### How partner sharing works

1. The **primary user** (labouring person) signs in and creates a session — a short invite code is generated
2. The **partner** opens the app, enters the invite code, and gets real-time read-only access to contractions, hydration, and todos
3. All writes are locked to the owner; the partner view updates live via Supabase Realtime

> **Privacy note:** Without Supabase credentials, the app runs entirely in local-only mode — no data ever leaves the device.

---

## Tests

```bash
npm test                 # run all tests once
npm run test:watch       # watch mode (re-runs on file save)
npm run test:ui          # Vitest browser UI
npm run test:coverage    # coverage report (HTML + text)
```

Test files live in `src/__tests__/`, mirroring the `src/` structure.

---

## Project Structure

```
src/
├── App.jsx                    # Root component — wires hooks to tabs
├── main.jsx                   # React entry point
├── adapters/
│   ├── DatabaseAdapter.js     # Abstract base class for storage adapters
│   ├── LocalAdapter.js        # localStorage implementation
│   └── SupabaseAdapter.js     # Supabase cloud implementation
├── constants/
│   ├── affirmations.js        # Rotating positive messages
│   ├── phases.js              # Labour phase definitions (colors, thresholds, tips)
│   ├── methods.js             # Default pain relief methods
│   └── featureFlags.js        # Feature flag definitions
├── context/
│   ├── LocaleContext.jsx      # i18n provider (en/uk)
│   ├── DatabaseContext.jsx    # Active storage adapter provider
│   └── FeatureFlagContext.jsx # Feature flag provider
├── theme/
│   └── index.js               # Color palette tokens (N.* dark / P.* warm)
├── utils/
│   ├── storage.js             # localStorage async adapter
│   ├── formatters.js          # fmtSec, fmtMMSS
│   ├── media.js               # getMediaType, getYtId
│   └── phaseAnalysis.js       # computePhase, computeStats, sortByPhase
├── hooks/
│   ├── useContractions.js     # Contraction tracking, phase detection, persistence
│   ├── useHydration.js        # Drink reminders, countdown, interval management
│   ├── useAffirmations.js     # Rotating message carousel
│   ├── useRelief.js           # Pain relief methods CRUD + persistence
│   ├── useTodos.js            # Expectation mode task list
│   ├── useCloudSync.js        # Cloud sync orchestration
│   ├── useNotifications.js    # Push notification scheduling
│   └── useFeatureFlags.js     # Feature flag access hook
├── components/
│   ├── Header.jsx             # App header with affirmation
│   ├── TabBar.jsx             # Tab navigation
│   ├── Icon.jsx               # Inline SVG icon system
│   ├── MediaDisplay.jsx       # Image / YouTube / Spotify / link renderer
│   ├── MediaInlineEditor.jsx  # URL input widget
│   ├── MethodModal.jsx        # Full-screen method detail overlay
│   └── SettingsModal.jsx      # Settings + Supabase connection UI
├── features/
│   ├── contractions/ContractionsTab.jsx
│   ├── hydration/HydrationTab.jsx
│   ├── relief/ReliefTab.jsx
│   └── expectation/ExpectationTab.jsx
└── i18n/
    ├── en.json                # English translations
    └── uk.json                # Ukrainian translations
```

---

## Data Persistence

### Local mode (default)

All data is stored in `localStorage` — private to your device, never sent anywhere.

| Key | Contents |
|-----|----------|
| `lc_c4` | Contraction history |
| `lc_m4` | Pain relief methods |
| `lc_dc` | Drink count |
| `lc_ld` | Last drink timestamp |
| `lc_di` | Active drink interval (minutes) |
| `lc_iv` | Custom interval list |
| `luna_mode` | App mode (`"labour"` or `"expectation"`) |
| `luna_locale` | Language (`"en"` or `"uk"`) |
| `luna_due_date` | ISO date string |
| `luna_countdown_unit` | Countdown display unit |
| `luna_todos` | Task list array |

### Cloud mode (Supabase)

When cloud sync is enabled, snapshots are stored in Supabase tables (`contraction_snapshots`, `hydration_snapshots`, `todo_snapshots`) with Row Level Security — only the session owner and invited partners can access the data.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| UI | React 18 (JSX) |
| Build | Vite 6 + `@vitejs/plugin-react` |
| PWA | `vite-plugin-pwa` + Workbox |
| Tests | Vitest 4 + @testing-library/react |
| Styling | Inline CSS-in-JS (theme tokens) |
| i18n | Custom context-based system |
| Storage | `localStorage` (local) / Supabase (cloud) |
