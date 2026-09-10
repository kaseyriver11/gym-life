# Life

A personal "life" app: today's todos, a long-term honey-do list, workout
logging with progress charts, and a manual health log — combined into one
dashboard. Runs as a web app and as a native Android app (via Capacitor).

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Firebase (Auth + Firestore) — free Spark tier, no card required
- Capacitor (Android) + local notifications for reminders
- Recharts for progress/weight trend charts

## First-time setup

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project.
2. **Build → Authentication → Get started → Email/Password** → enable it.
3. **Build → Firestore Database → Create database** → start in production mode.
4. In **Firestore → Rules**, paste the contents of `firestore.rules` from this repo and publish.
5. **Project settings → General → Your apps → Web app (</>)** → register an app, no need for hosting. Copy the `firebaseConfig` values.

### 2. Configure environment variables

```
cp .env.example .env.local
```

Fill in the six `VITE_FIREBASE_*` values from the Firebase config you just copied. `.env.local` is gitignored.

### 3. Create your account

```
npm install
npm run dev
```

Open the app, use the "Sign up" toggle on the login screen once to create your account (email/password), then switch back to normal sign-in going forward. Since this is a single-user app, there's no public sign-up flow beyond this.

## Day-to-day development

```
npm run dev
```

Opens at `http://localhost:5173` with instant hot-reload — the same for every feature, no phone needed.

## Getting it onto your Android phone

The `android/` folder (native project) is already scaffolded.

**One-time:** install [Android Studio](https://developer.android.com/studio) (needed for the Android SDK + an easy way to build/install to your phone).

**Build & install a snapshot to your phone:**

```
npm run cap:sync    # builds the web app and copies it into the native project
npm run cap:android # opens the project in Android Studio — run it from there
```

Do this whenever you want to push your latest changes to the phone (daily, weekly, whenever) — not on every code change.

**Live-reload on the phone while developing** (optional, for testing native-only features like notifications):

1. Find your computer's LAN IP (`ipconfig` → IPv4 address).
2. In `capacitor.config.ts`, uncomment the `server.url` line and set it to `http://<your-ip>:5173`.
3. `npm run cap:sync`, install once from Android Studio, then run `npm run dev` — the installed app will hot-reload from your dev server as long as your phone and computer share wifi.
4. Revert the `server.url` change before doing a real "push to phone" build.

## Data model

Everything lives in Firestore under `users/{yourUid}/...`:

- `dailyTasks` — today-view todos, optional `time`, optional local-notification reminder
- `longTermTasks` — the long-term/honey-do list, grouped by category
- `exercises` — your exercise library
- `workoutSessions` — one per day, each with exercise entries and sets (reps × weight)
- `healthSnapshots` — manual daily weight/steps/calories entries

## Roadmap / not yet built

- **Google Health Connect** integration (automatic steps/nutrition sync) — needs a native Android plugin and testing on a real device; the Health tab has a placeholder and manual entry in the meantime.
- Editing/rescheduling existing daily task times (currently: delete and re-add).
- Push notifications for reminders when the app isn't open (would need the Firebase Blaze plan + Cloud Functions; local notifications work today without it as long as the app has run recently).
