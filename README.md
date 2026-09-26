# Fitness Log (for Janson)

**Live:** https://jansonlau0126.github.io/fitness-app/

Mobile-first gym tracker. Vite + React + TypeScript. Static SPA, no backend, no login.
All data is stored in the browser (`localStorage`, key `janson-fit-v1`). Export/Import JSON backups in **Profile → Your data**.

## Commands
```bash
npm install
npm run dev        # local dev server
npm run build      # -> dist/ (relative base "./", works from any sub-path)
npx vite preview --port 4173 --host
npm run shots      # phone-size screenshots into screenshots/ (needs preview running + Chrome)
```

## Features
- **Log** – pick date, add exercise (Body part → Exercise drop-downs), sets of kg × reps, add/remove sets, edit/delete. Est. 1RM per set (Epley: `w × (1 + r/30)`, 1 rep = weight). PR badges.
- **Summary** – front/back SVG body map (main muscles strong, helper muscles light), totals, exercises with best est. 1RM.
- **Month** – workout days vs last month, sets/reps/volume, encouraging messages, badges, calendar heat map, sets/volume per body part, est. 1RM chart, new PRs, strength level changes.
- **Library** – 106 exercises (13 body parts) with muscles, tool and simple how-to, mini body map; equipment guide; add your own exercises.
- **Profile** – sex, age, height, weight, body-weight history, strength standards (Beginner → Elite with progress bar), theme, export/import, demo data, clear all.
- PWA: manifest, icons, small offline service worker.

## Strength standards
`src/data/standards.ts` holds the bodyweight tables (male + female) copied from strengthlevel.com
(`/strength-standards/<lift>/kg`, fetched 25 Sep 2026, data cutoff 10 Mar 2026). Values are interpolated
between bodyweight rows (clamped at the ends). Body-weight lifts (pull-ups, dips, push-ups…) use the reps tables.
Dumbbell standards are for the weight of one dumbbell.

## Pictures & credits
- Exercise photos (start/end, 104 of 106 exercises): [free-exercise-db](https://github.com/yuhonas/free-exercise-db) by yuhonas,
  public domain under **The Unlicense**. Resized to 240 px WebP (~0.9 MB total) and bundled in `public/ex/` (no hotlinking).
  Mapping: `src/data/images.ts`.
- Equipment icons and fallback exercise icons (`src/components/Icons.tsx`) and the body map are drawn for this app.
