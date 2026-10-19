# Gym Everyday

**Gym everyday, gym today.**

A late-night gym log. Track sets, see which muscles you hit, compare to strength standards, and keep a monthly streak.

Official site: https://mypeanutbutterjam-netizen.github.io/gym-everyday/

## Features
- Daily workout log (weight × reps, bodyweight reps, timed holds)
- Rest timer between sets, one-tap fill from last session, weekly Push / Pull / Legs plan
- Last-session reminder + all-time PR timeline
- Anatomical front/back muscle map (tappable)
- Age-adjusted strength standards (strengthlevel.com data)
- Month heat map, badges, streaks, compare vs last month
- Share cards: Neon, Poster, and stats Grid (day / month)
- English + 繁體中文
- Offline PWA. Install from Chrome/Edge, or Share → Add to Home Screen on iPhone Safari
- Optional Google cloud sync (Cloudflare Workers + D1). Not enabled on the public site
- Privacy: local-first. In the app open Profile → Privacy, or open `privacy.html` on the site

## Dev
```bash
npm install
npm run dev
npm run build
```

Vite `base` is `./`, so one build works on a GitHub Pages project site at any subpath until cutover. Do not hardcode `/fitness-app/` as the only base.

## Cloud sync
Optional. The public site does not ship a Google OAuth client, so cloud sync stays off there.

Current API host: `https://gym-everyday-api.jansonlau.workers.dev`

To turn sync on for a deployment, create a Google OAuth **Web** client ID whose authorized JavaScript origins include that site and localhost. Set it as Worker secret `GOOGLE_CLIENT_ID` and Vite env `VITE_GOOGLE_CLIENT_ID`.
