import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const BASE = process.argv[2] || 'https://jansonlau0126.github.io/fitness-app/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
  hasTouch: true,
  isMobile: true,
  locale: 'en-US',
});
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));

await p.goto(BASE + '?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(500);
await p.evaluate(async () => {
  if (window.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  localStorage.clear();
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(700);

const tab = async (i) => { await p.locator('.tabbar button').nth(i).click(); await p.waitForTimeout(400); };

await tab(4);
await p.locator('button').filter({ hasText: /Load demo data/ }).click();
await p.locator('.dialog button').filter({ hasText: /Load demo/ }).click();
await p.waitForTimeout(2800);
await p.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
  d.settings.locale = 'en';
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(700);

await tab(1);
// Prefer Saturday push (day-2): click prev until BodyMap / Share appear
for (let i = 0; i < 8; i++) {
  const hasShare = await p.locator('button').filter({ hasText: /^Share$/ }).count();
  const hasMap = await p.locator('.body-map').count();
  console.log('day try', i, 'share', hasShare, 'map', hasMap);
  if (hasShare && hasMap) break;
  await p.locator('button[aria-label="Previous day"], .datebar button, .date-bar button').first().click().catch(async () => {
    // fallback: click left chevron in date widget
    await p.locator('.page-head ~ * button').first().click();
  });
  await p.waitForTimeout(500);
}

await p.waitForSelector('.body-map', { timeout: 15000 });
// wait for base image to load
await p.evaluate(async () => {
  const imgs = [...document.querySelectorAll('.body-map img')];
  await Promise.all(imgs.map((img) => img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; })));
});
await p.waitForTimeout(800);

{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: Math.max(844, Math.min(h, 1600)) });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '90-summary-photo-A.png' });
  console.log('saved 90-summary-photo-A.png');
  // also crop body map
  await p.locator('.body-map').first().screenshot({ path: OUT + '90b-body-map-A.png' }).catch(() => {});
  await p.setViewportSize({ width: 390, height: 844 });
}

// Capture share card blob
await p.evaluate(() => { try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch {} navigator.share = undefined; });
const b64 = await p.evaluate(async () => {
  let captured = null;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    if (blob && blob.type && blob.type.includes('png') && blob.size > 50000) captured = blob;
    else if (blob && blob.size > 50000) captured = blob;
    return orig(blob);
  };
  const btn = [...document.querySelectorAll('button')].find((el) => /^Share$/i.test((el.textContent || '').trim()));
  if (!btn) return { err: 'no share btn' };
  btn.click();
  for (let i = 0; i < 60; i++) {
    if (captured) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  // also try preview img
  const prev = document.querySelector('img[alt="Share card preview"]');
  if (prev && prev.src && prev.src.startsWith('blob:')) {
    const res = await fetch(prev.src);
    const blob = await res.blob();
    captured = blob;
  }
  if (!captured) return { err: 'no blob', hasPrev: !!prev };
  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve({ b64: fr.result, size: captured.size });
    fr.readAsDataURL(captured);
  });
});
console.log('share result keys', b64 && Object.keys(b64), b64?.err, b64?.size);
if (b64?.b64) {
  writeFileSync(OUT + '91-share-photo-C.png', Buffer.from(b64.b64.split(',')[1], 'base64'));
  console.log('saved 91-share-photo-C.png');
} else {
  // wait for preview section then screenshot it
  await p.waitForSelector('img[alt="Share card preview"]', { timeout: 20000 });
  await p.locator('img[alt="Share card preview"]').screenshot({ path: OUT + '91-share-photo-C.png' });
  console.log('saved 91 via preview screenshot');
}

console.log('ERRORS', JSON.stringify(errors));
await b.close();
