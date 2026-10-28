# 1% Habits — Native Android (Kotlin)

This is a **full native rewrite** of the habit tracker using:

- **Kotlin**
- **Jetpack Compose** (UI)
- **Room** (database — survives app updates)
- **AlarmManager + NotificationCompat** (sticky reminders, works when app is killed)

Package id: `com.onepercent.habits.nativeapp`  
(Different from the Capacitor app so both can be installed side by side while you test.)

## Why native?

Capacitor/WebView is fine for UI, but Realme/Android 16 often delays or drops web-scheduled alarms when the app is swiped away. Native `AlarmManager.setExactAndAllowWhileIdle` + `NotificationCompat.setOngoing(true)` is the same approach apps like Loop Habit Tracker use.

## How to build the APK

### Option A — Android Studio (recommended)

1. Install [Android Studio](https://developer.android.com/studio).
2. **File → Open** → select the `native-android` folder (not the repo root).
3. Wait for Gradle sync.
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. Install the APK on your phone (or run on a device with the green Play button).

### Option B — Command line

```bash
cd native-android
# first time only, if gradlew is missing: use Android Studio once to generate wrapper
./gradlew assembleDebug
```

APK path:
`native-android/app/build/outputs/apk/debug/app-debug.apk`

## Features included

- Timeline home: start time, end time, colored name pill, duration
- Separate **session** times vs **reminder** time
- Sticky ongoing notifications (hard to swipe away)
- Alarms rescheduled after reboot / app update
- Done / Partial / Missed marking
- OLED pure-black dark theme + light theme in Settings
- JSON export / import via system share & file picker
- Room DB so data is kept across APK updates (same signing key)

## Realme tips (still recommended)

Settings → Apps → 1% Habits → Battery → **No restrictions**  
Lock the app in Recents if needed.

## Capacitor app

The old Capacitor project remains in the repo root. You can keep using it or switch fully to this native app. Data does **not** auto-migrate between the two; use JSON export/import if you want to move habits.
