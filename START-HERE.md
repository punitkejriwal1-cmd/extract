# How to get your APK (simple steps)

You do not need to understand the code. Just follow these steps in order.

---

## What you need on your computer

1. **Node.js** (free)  
   Download and install the LTS version:  
   https://nodejs.org/

2. **A free GitHub account**  
   https://github.com/signup

3. **GitHub Desktop** (easiest way to upload files, free)  
   https://desktop.github.com/

4. (Optional for testing on phone later) Android Studio is NOT required if you use GitHub to build the APK.

---

## Step A — Use the project folder I prepared

You should have a folder that contains files like:
- package.json
- capacitor.config.ts
- START-HERE.md (this file)
- src/
- .github/

If you only have the old zip, use the new zip that was prepared with Capacitor already added.

---

## Step B — Install tools inside the project (one time)

1. Open the project folder.
2. Click the address bar at the top, copy the full path (example: `C:\Users\You\Desktop\habit-app`).
3. Open **Terminal** (Mac) or **Command Prompt / PowerShell** (Windows).
4. Type this, then press Enter (paste your real path):

```text
cd PASTE_YOUR_FOLDER_PATH_HERE
```

5. Then copy-paste these commands one by one. Press Enter after each. Wait until each finishes before the next:

```text
npm install
```

```text
npm run build:mobile
```

```text
npx cap add android
```

```text
npx cap sync android
```

If a command asks a question, choose the default (press Enter).

When all four finish without big red errors, continue.

---

## Step C — Put the project on GitHub

1. Open **GitHub Desktop**.
2. File → Add Local Repository → choose your habit-app folder.  
   If it says “not a git repository”, click **create a repository** there.
3. At the bottom left, type a summary: `Add Android app`
4. Click **Commit to main**.
5. Click **Publish repository** (uncheck “Keep this code private” only if you want it public; private is fine too).
6. Wait until it finishes uploading.

---

## Step D — GitHub builds the APK for you

1. Open your browser and go to your new GitHub repository page.
2. Click the **Actions** tab.
3. Click **Android APK** on the left (or the workflow that is running).
4. Wait 5–15 minutes. Status should become a green check mark.
5. Click the green run → scroll to **Artifacts** → download **one-percent-habits-debug**.
6. Unzip that download. Inside is the **.apk** file.

---

## Step E — Install on your Android phone

1. Copy the `.apk` file to your phone (WhatsApp to yourself, USB cable, Google Drive, etc.).
2. On the phone open the file.
3. If Android warns “unknown app”, allow install from that source for this one time.
4. Install and open **1% Habits**.

---

## If something fails

- Copy the full error text from the black terminal window or from the red X on GitHub Actions.
- Send that text back here and I will tell you exactly what to do next.

---

## Later (not now)

Better “on time” notifications and a signed APK for Play Store can be done after this first APK works.
