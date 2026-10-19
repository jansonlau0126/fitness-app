import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
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
// Jump to last Saturday (push/upper day with chest/lats/arms)
await p.evaluate(() => {
  const d = new Date();
  // go back to most recent Saturday
  const day = d.getDay();
  const back = day === 0 ? 1 : day + 1; // Sat=6 → back 0? wait: if Mon(1) back=2 to Sat
  // Actually: Sat=6. Days since Sat = (day + 1) % 7 ... Mon=1 → 2 days back
  const sinceSat = (day + 1) % 7;
  d.setDate(d.getDate() - (sinceSat === 0 ? 7 : sinceSat));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const key = `${y}-${m}-${dd}`;
  const input = document.querySelector('.datebar-mid input[type="date"]');
  if (input) {
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    native.set.call(input, key);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return key;
}).then((k) => console.log('set date', k));
await p.waitForTimeout(800);

// Fallback: click prev until Share today + body-map
for (let i = 0; i < 10; i++) {
  const hasShare = await p.locator('button').filter({ hasText: /Share today/i }).count();
  const hasMap = await p.locator('.body-map').count();
  const label = await p.locator('.datebar-label').textContent().catch(() => '');
  console.log('day try', i, 'share', hasShare, 'map', hasMap, 'label', label);
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
  await p.screenshot({ path: OUT + '92-summary-paths-aligned.png', fullPage: true });
  console.log('saved 92-summary-paths-aligned.png');
  await p.locator('.body-map').first().screenshot({ path: OUT + '92b-body-map-aligned.png' }).catch(() => {});
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
  writeFileSync(OUT + '93-share-paths-aligned.png', Buffer.from(b64.b64.split(',')[1], 'base64'));
  console.log('saved 93-share-paths-aligned.png');
} else {
  await p.waitForSelector('img[alt="Share card preview"]', { timeout: 20000 });
  await p.locator('img[alt="Share card preview"]').screenshot({ path: OUT + '93-share-paths-aligned.png' });
  console.log('saved 93 via preview');
}

console.log('ERRORS', JSON.stringify(errors));
console.log('build', await p.evaluate(() => document.querySelector('meta[name="gym-build"]')?.content));
await b.close();
