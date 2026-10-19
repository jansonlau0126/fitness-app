import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
const TARGET = '2026-10-17';
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
await p.waitForTimeout(400);
await p.evaluate(async () => {
  if (window.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  localStorage.clear();
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(600);

const tab = async (i) => { await p.locator('.tabbar button').nth(i).click(); await p.waitForTimeout(400); };

await tab(4);
await p.locator('button').filter({ hasText: /Load demo data/ }).click();
await p.locator('.dialog button').filter({ hasText: /Load demo/ }).click();
await p.waitForTimeout(2500);
await p.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
  d.settings.locale = 'en';
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(700);

await tab(1);
const setKey = await p.evaluate((key) => {
  const input = document.querySelector('.datebar-mid input[type="date"]');
  if (input) {
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    native.set.call(input, key);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return key;
}, TARGET);
console.log('set date', setKey);
await p.waitForTimeout(800);

for (let i = 0; i < 14; i++) {
  const hasShare = await p.locator('button').filter({ hasText: /Share today/i }).count();
  const hasMap = await p.locator('.body-map').count();
  const label = await p.locator('.datebar-label').textContent().catch(() => '');
  const val = await p.locator('.datebar-mid input[type="date"]').inputValue().catch(() => '');
  console.log('day try', i, 'share', hasShare, 'map', hasMap, 'label', label, 'val', val);
  if (hasShare && hasMap) break;
  await p.locator('button[aria-label="Previous day"]').click();
  await p.waitForTimeout(450);
}

await p.waitForSelector('.body-map', { timeout: 15000 });
await p.waitForTimeout(1000);

{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: Math.max(844, Math.min(h, 1600)) });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '94-summary-option3.png', fullPage: true });
  console.log('saved 94-summary-option3.png');
  await p.locator('.body-map').first().screenshot({ path: OUT + '94b-body-map-option3.png' }).catch(() => {});
  await p.setViewportSize({ width: 390, height: 844 });
}

await p.evaluate(() => { try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch {} });
const b64 = await p.evaluate(async () => {
  let captured = null;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    if (blob && blob.size > 50000) captured = blob;
    return orig(blob);
  };
  const btn = [...document.querySelectorAll('button')].find((el) => /Share today/i.test((el.textContent || '').trim()));
  if (!btn) return { err: 'no share btn' };
  btn.click();
  for (let i = 0; i < 80; i++) {
    if (captured) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  const prev = document.querySelector('img[alt="Share card preview"]');
  if (prev && prev.src && prev.src.startsWith('blob:')) {
    const res = await fetch(prev.src);
    captured = await res.blob();
  }
  if (!captured) return { err: 'no blob', hasPrev: !!prev };
  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve({ b64: fr.result, size: captured.size });
    fr.readAsDataURL(captured);
  });
});
console.log('share', b64 && Object.keys(b64), b64?.err, b64?.size);
if (b64?.b64) {
  writeFileSync(OUT + '95-share-option3.png', Buffer.from(b64.b64.split(',')[1], 'base64'));
  console.log('saved 95-share-option3.png');
} else {
  await p.waitForSelector('img[alt="Share card preview"]', { timeout: 20000 });
  await p.locator('img[alt="Share card preview"]').screenshot({ path: OUT + '95-share-option3.png' });
  console.log('saved 95 via preview');
}

console.log('ERRORS', JSON.stringify(errors));
console.log('build', await p.evaluate(() => document.querySelector('meta[name="gym-build"]')?.content));
await b.close();
