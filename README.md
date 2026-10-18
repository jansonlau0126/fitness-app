# Gym Everyday

**Gym everyday, gym today.**

A simple gym log for Janson — inspired by the 4am grind. Track sets, see which muscles you hit, compare to strength standards, and keep a monthly streak.

Live: https://jansonlau0126.github.io/fitness-app/

## Features
- Daily workout log (weight × reps, bodyweight reps, timed holds)
- Last-session reminder + all-time PR
- Anatomical front/back muscle map (tappable)
- Age-adjusted strength standards (strengthlevel.com data)
- Month summary, badges, streaks
- Share cards (day / month)
- English + 繁體中文
- Offline PWA + optional Google cloud sync (Cloudflare Workers + D1)

## Dev
```bash
npm install
npm run dev
npm run build
```

## Cloud sync
API: `https://gym-everyday-api.jansonlau.workers.dev`

Requires a Google OAuth **Web** client ID (authorized origins: this GitHub Pages URL + localhost). Set as Worker secret `GOOGLE_CLIENT_ID` and Vite env `VITE_GOOGLE_CLIENT_ID`.
