# Capacitor setup — 1% Habits Android APK

This project is a web habit tracker. Capacitor wraps it as a native Android app so you can build an APK and get more reliable notifications.

## What was added (Step 1)

| File / change | Purpose |
|---------------|---------|
| `capacitor.config.ts` | App id `com.onepercent.habits`, webDir `dist-mobile` |
| `src/mobile/` | Lightweight SPA entry (Tracker only, no server/auth) |
| `vite.mobile.config.ts` | Vite config that builds a static SPA into `dist-mobile/` |
| `scripts/build-mobile.mjs` | Builds the mobile SPA + copies `habit-sw.js` |
| `package.json` scripts | `build:mobile`, `cap:sync`, `cap:open`, `cap:add:android` |
| Capacitor packages | `@capacitor/core`, `cli`, `android`, `app`, `haptics`, `status-bar`, `keyboard` |

## On your machine (required once)

You need Node 20+ and (for local APK testing) Android Studio.

```bash
# 1. Install dependencies (includes Capacitor)
npm install

# 2. Build the static mobile SPA
npm run build:mobile

# 3. Add the Android platform (once)
npx cap add android

# 4. Copy web assets into the Android project
npx cap sync android

# 5. Commit the android/ folder (required for GitHub Actions)
git add android/ capacitor.config.ts package.json package-lock.json
git add src/mobile/ vite.mobile.config.ts scripts/build-mobile.mjs
git add .github/workflows/android-apk.yml CAPACITOR.md
git commit -m "Add Capacitor Android platform and APK workflow"

# 6. (Optional) Open Android Studio and build locally
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
APK path: `android/app/build/outputs/apk/debug/`.

## Daily local workflow

```bash
npm run cap:sync    # rebuild web + sync into android/
npx cap open android
```

---

## Step 2 — GitHub Actions APK workflow

**File:** `.github/workflows/android-apk.yml`

### What it does

On every push to `main`/`master`, manual run, or GitHub Release:

1. Installs Node + JS deps  
2. Builds the mobile SPA (`npm run build:mobile`)  
3. Sets up Java 21 + Android SDK  
4. Runs `npx cap sync android`  
5. Builds a **debug APK** with Gradle  
6. Uploads the APK as a downloadable Actions artifact (kept 30 days)  
7. On a Release, also attaches the APK to that release  

### How to use it

1. Finish Step 1 locally and **commit the `android/` folder**.  
2. Push the repo to GitHub.  
3. Open the repo → **Actions** tab → **Android APK** → wait for the green check.  
4. Open the successful run → **Artifacts** → download `one-percent-habits-debug`.  
5. On your phone: enable “Install from unknown sources”, open the APK, install.

**Manual run:** Actions → Android APK → **Run workflow**.

**Release APK:** create a GitHub Release; the workflow attaches the APK to it.

### Important requirements

| Requirement | Why |
|-------------|-----|
| `android/` committed in the repo | Workflow does not run `cap add android` (that is interactive / one-time). |
| `package-lock.json` present | So `npm ci` is reproducible. |
| Repo on GitHub with Actions enabled | Free for public repos; private repos need Actions minutes. |

### Debug vs signed release APK

This workflow builds a **debug APK** (no keystore needed). Fine for personal use and testing.

For Play Store / install-without-warnings you need a **signed release** APK/AAB. That requires:

- A keystore file  
- GitHub Secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`  
- Extra Gradle signing config  

Ask when you are ready and we can add a signed-release job.

---

## Notifications

Current notifications use the **browser Notification API + service worker**. Inside Capacitor they work better than a plain Chrome tab.

For **exact timed alarms** (e.g. 6:00 AM while the app is closed), later install:

```bash
npm install @capacitor/local-notifications
```

Then switch `notifyHabit` in `src/lib/habits.ts` to the Local Notifications plugin. Do this after the APK pipeline works.

---

## App identity

- **App ID:** `com.onepercent.habits`  
- **App name:** `1% Habits`  
- **Web dir:** `dist-mobile`  

Change these in `capacitor.config.ts` before publishing if needed.
