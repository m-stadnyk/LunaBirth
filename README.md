# LunaBirth — Personal Labour Support App

A mobile-first Progressive Web App (PWA) for tracking contractions, hydration, and pain relief techniques during labour. Runs entirely in the browser — no backend, no accounts, all data stays on your device.

## Features

- **Contraction Tracker** — tap to start/stop, automatic 5-1-1 rule detection, labour phase analysis
- **Hydration Reminders** — countdown ring timer, adaptive intervals based on labour phase
- **Pain Relief Methods** — phase-sorted techniques with optional images, YouTube, or Spotify links
- **Labour Phase Detection** — evidence-based majority-vote algorithm (tracking → early → active → transition)
- **Affirmations** — rotating supportive messages throughout
- **Expectation Mode** — due date countdown and task list for pre-labour preparation
- **Bilingual** — English and Ukrainian (🇬🇧 / 🇺🇦)

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

### 4. Start the development server

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
├── constants/
│   ├── affirmations.js        # Rotating positive messages
│   ├── phases.js              # Labour phase definitions (colors, thresholds, tips)
│   ├── methods.js             # Default pain relief methods
│   └── index.js
├── context/
│   └── LocaleContext.jsx      # i18n provider (en/uk)
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
│   └── useTodos.js            # Expectation mode task list
├── components/
│   ├── Header.jsx             # App header with affirmation
│   ├── TabBar.jsx             # Tab navigation
│   ├── Icon.jsx               # Inline SVG icon system
│   ├── MediaDisplay.jsx       # Image / YouTube / Spotify / link renderer
│   ├── MediaInlineEditor.jsx  # URL input widget
│   └── MethodModal.jsx        # Full-screen method detail overlay
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
| Storage | Browser `localStorage` only |
