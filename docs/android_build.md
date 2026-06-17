# Building the Android APK

The Android app (`android/`) is a thin WebView wrapper around the EvacuWay
dashboard. By default it loads the dashboard **bundled inside the APK**
(`assets/www`), so the app opens offline; OpenStreetMap tiles and the optional
live API / PAGASA feed still use the network when available.

## Prerequisites
- Android Studio (Giraffe+) or the Android SDK + JDK 17.
- Node.js 18+ (to build the dashboard).

## Build steps

```bash
# 1. Build the dashboard (emits frontend/dist with relative asset paths)
cd frontend
npm install
npm run build

# 2. Build the APK — the copyWebAssets Gradle task copies frontend/dist into
#    android/app/src/main/assets/www automatically before each build.
cd ../android
./gradlew assembleDebug        # or: open android/ in Android Studio and Run
# APK -> android/app/build/outputs/apk/debug/app-debug.apk
```

In Android Studio: **Open** the `android/` folder, let it sync Gradle (it
generates the Gradle wrapper on first sync), then **Run ▶** or
**Build → Build APK(s)**.

## Where the dashboard comes from

`android/app/build.gradle` sets `DASHBOARD_URL`. Two options:

| Mode | `DASHBOARD_URL` | Notes |
|------|-----------------|-------|
| **Bundled (default)** | `file:///android_asset/www/index.html` | Offline-capable; app shell + bundled data ship in the APK. Run `npm run build` first. |
| **Hosted** | `https://qjmre23.github.io/EvacuWay/` (or your Replit URL) | WebView loads a deployed build over the network. |

The dashboard is built with `base: "./"` (relative asset/data paths) so the
exact same `dist` works from `file://` (the APK), from a subpath
(GitHub Pages `/EvacuWay/`), and from the root dev server.

## What works offline in the APK
- Full dashboard UI, controls, charts, run history.
- Bundled simulation routes (road-following) + KPIs for all 9 scenarios.
- Evacuation-centre directory + **PDF export**.
- PAGASA card from the bundled `sample_rainfall.json`.

## What needs the network
- OpenStreetMap basemap tiles.
- Live FastAPI simulations (`POST /api/simulate`) — falls back to bundled data.
- Live PAGASA rainfall (`/api/rainfall`) — falls back to the bundled sample.

`AndroidManifest.xml` already grants `INTERNET` + `ACCESS_NETWORK_STATE` and
enables `usesCleartextTraffic` for a local dev server during debugging.
