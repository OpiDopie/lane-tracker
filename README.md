# Lane — Weight Loss Tracker

A simple, private workout / weight / steps tracker you host yourself. No account,
no server, no backend — all your data lives in your phone's browser storage.
It's a PWA, so you can add it to your home screen and it opens like a real app.

## Features

- **Workout tab** — pick a day, hit **Start**, tap each exercise as you finish it
  (it greys out with a strikethrough). **Pause** stops the clock without losing
  your place; **Finish** (or completing every exercise) logs the total active
  time. If you close the app mid-workout, it picks the session back up when you
  return.
- **Config tab** — a plain editable sheet for your plan: add days, add
  exercises, edit sets/reps/weight/notes any time you increase weight or reps.
  No code editing needed.
- **Weight tab** — log your weight once each morning. Shows a 30-day trend line
  and a weekly average (Monday–Sunday), with the change vs. the prior week.
- **Steps tab** — same idea: log steps (and optional miles) each day, see a
  trend line and weekly averages.
- **Home tab** — set a start weight, goal weight, and goal date in Config, and
  the home screen shows a lane-style progress bar plus **On track / Off track**
  based on your actual recent trend versus what's needed to hit your date.
- **Backup / restore** — Config → "Download backup" saves everything as a
  `.json` file; "Restore from backup" loads it back in. Do this occasionally,
  and especially before switching phones, since data is local to one browser.
- Installable PWA with offline support (add to home screen, works without
  signal once loaded).

## Deploying it on GitHub Pages (free hosting, ~2 minutes)

1. Create a new **public** GitHub repository (e.g. `lane-tracker`).
2. Upload every file in this folder to the repo, keeping the same structure
   (`index.html` at the root, `css/`, `js/`, `icons/`, etc.). Easiest way:
   on the repo page, click **Add file → Upload files**, drag the whole
   folder's contents in, and commit.
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source** to **Deploy from a branch**,
   branch **main**, folder **/ (root)**, then **Save**.
5. Wait a minute, then GitHub shows your live URL, something like:
   `https://<your-username>.github.io/lane-tracker/`

That URL is your app — open it anywhere.

## Adding it to your phone's home screen

**iPhone (Safari):** open the URL → tap the **Share** icon → **Add to Home
Screen**.

**Android (Chrome):** open the URL → tap the **⋮** menu → **Add to Home
screen** (or you may see an "Install app" banner automatically).

Once added, it opens full-screen with its own icon, no browser bar.

## Editing your plan

Go to the **Config** tab. Add a day, name it whatever you like ("Push Day",
"Legs", "Day 3"), then add exercises with sets/reps/weight/notes. Everything
saves automatically as you type (fields save when you tab or click away).
Bump the weight or reps here whenever you progress — the Workout tab always
reflects whatever's in Config.

## A couple of notes

- All data is stored in the browser's local storage on that one device/browser.
  It is **not** synced anywhere and nobody but you can see it. That also means
  clearing your browser's site data, or switching phones without restoring a
  backup, will lose it — export a backup from Config regularly.
- If you'd rather have this sync across devices automatically, that would
  need a real backend/database, which is a bigger project than "upload to
  GitHub Pages" — happy to help set that up separately if you want it later.

## Local development

No build step. Just open `index.html` in a browser, or serve the folder with
any static server, e.g.:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
