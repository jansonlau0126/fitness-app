import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4178/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
  hasTouch: true,
  isMobile: true,
  locale: 'en-US',
  acceptDownloads: true,
});
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(String(e)));
const shot = async (name, full = false) => {
  await p.waitForTimeout(350);
  if (full) {
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: 390, height: Math.max(844, h) });
    await p.waitForTimeout(200);
  }
  await p.screenshot({ path: OUT + name });
  if (full) await p.setViewportSize({ width: 390, height: 844 });
  console.log('saved', name);
};
const tab = async (i) => { await p.locator('.tabbar button').nth(i).click(); await p.waitForTimeout(350); };
// tabs: 0 Log, 1 Summary, 2 Month, 3 Library, 4 Profile

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(400);

await tab(4); // Profile
await p.locator('button').filter({ hasText: /Load demo data/ }).click();
await p.locator('.dialog button').filter({ hasText: /Load demo/ }).click();
await p.waitForTimeout(2800);

await p.evaluate(() => {
  const raw = localStorage.getItem('janson-fit-v1');
  if (!raw) return;
  const d = JSON.parse(raw);
  d.profile.age = 50;
  d.profile.weightKg = 75;
  // ensure locale en
  d.settings = d.settings || {};
  d.settings.locale = 'en';
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(500);

// 20 last-time
await tab(0);
await p.click('button:has-text("Add exercise")');
await p.waitForTimeout(250);
await p.selectOption('.sheet select', 'Chest');
await p.locator('.sheet .ex-opt', { has: p.locator('.ex-opt-name', { hasText: /^Bench Press$/ }) }).click();
await p.locator('.last-card').waitFor({ timeout: 5000 });
await shot('20-last-time.png');
// fill reps on first set and save
await p.locator('.sheet .set-row:not(.head)').first().locator('input').nth(1).fill('5');
await p.click('.sheet-foot button:has-text("Add to log")');
await p.waitForTimeout(2700);

// 23 timed plank
await p.click('button:has-text("Add exercise")');
await p.waitForTimeout(250);
await p.selectOption('.sheet select', 'Abs');
await p.locator('.sheet .ex-opt', { has: p.locator('.ex-opt-name', { hasText: /^Plank$/ }) }).click();
await p.waitForTimeout(400);
{
  const row = p.locator('.sheet .set-row:not(.head)').first();
  const inputs = row.locator('input');
  const n = await inputs.count();
  console.log('plank inputs', n);
  // duration: kg optional + sec, or just sec
  if (n >= 2) { await inputs.nth(0).fill('0'); await inputs.nth(1).fill('60'); }
  else { await inputs.nth(0).fill('60'); }
  const rows = await p.locator('.sheet .set-row:not(.head)').count();
  for (let i = rows - 1; i >= 1; i--) await p.locator('.sheet .set-row:not(.head)').nth(i).locator('button').last().click();
}
await shot('23-timed-plank.png');
await p.click('.sheet-foot button:has-text("Add to log")');
await p.waitForTimeout(2700);

// 21 body tap
await tab(1);
await p.waitForTimeout(400);
// inspect body map
const musInfo = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.body-map [data-muscle], .body-map .mus, .body-map path')];
  return els.slice(0, 15).map((e) => ({ tag: e.tagName, cls: e.className?.baseVal || e.className, ds: { ...e.dataset }, id: e.id }));
});
console.log('mus', JSON.stringify(musInfo));
const chip = p.locator('.chip').filter({ hasText: /chest/i }).first();
if (await chip.count()) await chip.click();
else {
  await p.locator('.body-map path, .body-map .mus').first().click({ force: true });
}
await p.waitForTimeout(800);
await shot('21-body-tap.png', true);

// 24 share — generate blob via page evaluate using same flow as button
await tab(1);
const shareBtn = p.locator('button').filter({ hasText: /Share/i }).first();
await shareBtn.scrollIntoViewIfNeeded();
// Prefer download path
let gotImage = false;
try {
  const [download] = await Promise.all([
    p.waitForEvent('download', { timeout: 6000 }),
    shareBtn.click(),
  ]);
  await download.saveAs(OUT + '24-share-card-image.png');
  gotImage = true;
  console.log('saved 24-share-card-image.png via download');
} catch (e) {
  console.log('download path failed', String(e).slice(0, 120));
}
await p.waitForTimeout(600);
await shot('24-share-card.png', true);

if (!gotImage) {
  // Try to pull last object URL or regenerate canvas by reading shareCard module — inject canvas render
  const b64 = await p.evaluate(async () => {
    // click again and watch for <a download>
    return new Promise((resolve) => {
      const obs = new MutationObserver(() => {});
      // hijack URL.createObjectURL
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(blob);
        return orig(blob);
      };
      const btn = [...document.querySelectorAll('button')].find((b) => /Share/i.test(b.textContent || ''));
      btn?.click();
      setTimeout(() => resolve(null), 2500);
    });
  });
  if (b64 && typeof b64 === 'string' && b64.startsWith('data:')) {
    writeFileSync(OUT + '24-share-card-image.png', Buffer.from(b64.split(',')[1], 'base64'));
    console.log('saved 24-share-card-image.png via hijack');
  } else console.log('could not capture share image blob');
}

// 22 age standards
await tab(4);
await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('#standards')?.scrollIntoView({ block: 'start' }));
await p.waitForTimeout(250);
await p.locator('#standards').screenshot({ path: OUT + '22-age-standards.png' });
console.log('saved 22-age-standards.png');

// 25 zh-TW
await p.locator('button').filter({ hasText: /繁體中文/ }).click();
await p.waitForTimeout(500);
await tab(0);
await shot('25-zh-tw.png');
await tab(4);
await p.screenshot({ path: OUT + '25b-zh-tw-profile.png' });
console.log('saved 25b');

console.log('ERRORS:', JSON.stringify(errors.slice(0, 30)));
await b.close();
