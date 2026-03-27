# LunaBirth — Personal Labour Support App

A mobile-first Progressive Web App (PWA) for tracking contractions, hydration, and pain relief techniques during labour.

## Features

- **Contraction Tracker** — tap to start/stop, automatic 5-1-1 rule detection, labour phase analysis
- **Hydration Reminders** — countdown ring timer, adaptive intervals based on labour phase
- **Pain Relief Methods** — phase-sorted techniques with optional images, YouTube, or Spotify links
- **Labour Phase Detection** — evidence-based majority-vote algorithm (tracking → early → active → transition)
- **Affirmations** — rotating supportive messages throughout

## Install on Your Phone (PWA)

### Quickest way — deploy to Netlify Drop

1. `npm run build` → produces the `dist/` folder
2. Go to **[netlify.com/drop](https://app.netlify.com/drop)** and drag-and-drop the `dist/` folder
3. Open the generated URL on your phone in Safari (iOS) or Chrome (Android)
4. **iOS Safari**: Share button → "Add to Home Screen"
5. **Android Chrome**: menu → "Add to Home Screen" (or the install banner)

### Local preview on the same Wi-Fi

```bash
./scripts/build-and-serve.sh
```

Then open the printed URL on your phone's browser.

> **iOS note**: iOS requires HTTPS for full PWA install. Use Netlify/Vercel deployment or run `./scripts/build-and-serve.sh --https`.

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

## Tests

```bash
npm test                # run all tests once
npm run test:watch      # watch mode
npm run test:ui         # Vitest UI in browser
npm run test:coverage   # coverage report
```

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
├── theme/
│   └── index.js               # Color palette (P)
├── utils/
│   ├── storage.js             # localStorage async adapter
│   ├── formatters.js          # fmtSec, fmtMMSS
│   ├── media.js               # getMediaType, getYtId
│   └── phaseAnalysis.js       # computePhase, computeStats, sortByPhase
├── hooks/
│   ├── useContractions.js     # Contraction tracking, phase detection, persistence
│   ├── useHydration.js        # Drink reminders, countdown, interval management
│   ├── useAffirmations.js     # Rotating message carousel
│   └── useRelief.js           # Pain relief methods CRUD + persistence
├── components/
│   ├── Header.jsx             # App header with affirmation
│   ├── TabBar.jsx             # 3-tab navigation
│   ├── MediaDisplay.jsx       # Image / YouTube / Spotify / link renderer
│   ├── MediaInlineEditor.jsx  # URL input widget
│   └── MethodModal.jsx        # Full-screen method detail overlay
└── features/
    ├── contractions/ContractionsTab.jsx
    ├── hydration/HydrationTab.jsx
    └── relief/ReliefTab.jsx
```

## Data Persistence

All data is stored locally in `localStorage` under these keys:

| Key     | Contents                |
|---------|-------------------------|
| `lc_c4` | Contraction history     |
| `lc_m4` | Pain relief methods     |
| `lc_dc` | Drink count             |
| `lc_ld` | Last drink timestamp    |
| `lc_di` | Active drink interval   |
| `lc_iv` | Custom interval list    |

Data is private to your device and never sent anywhere.
