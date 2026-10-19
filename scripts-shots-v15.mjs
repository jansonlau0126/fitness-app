import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = process.argv[2] || 'https://jansonlau0126.github.io/fitness-app/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
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

async function clearAndReload() {
  await p.evaluate(async () => {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    localStorage.clear();
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map((r) => r.unregister()));
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
}

await p.goto(BASE + '?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 90000 });
await p.waitForTimeout(500);
await clearAndReload();

const build = await p.evaluate(() => document.querySelector('meta[name="gym-build"]')?.content);
const swCaches = await p.evaluate(async () => (window.caches ? await caches.keys() : []));
console.log('build', build, 'caches', swCaches);

const tab = async (i) => { await p.locator('.tabbar button').nth(i).click(); await p.waitForTimeout(450); };

await tab(4);
await p.locator('button').filter({ hasText: /Load demo data/ }).click();
await p.locator('.dialog button').filter({ hasText: /Load demo/ }).click();
await p.waitForTimeout(2800);
await p.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
  d.settings.locale = 'en';
  d.settings.shareStyle = 'neon';
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(700);

// --- 100 Log: rest timer + plan hint ---
await tab(0);
await p.evaluate((key) => {
  const input = document.querySelector('.datebar-mid input[type="date"]');
  if (input) {
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    native.set.call(input, key);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}, TARGET);
await p.waitForTimeout(600);

// Start rest timer if button exists
const startRest = p.locator('button').filter({ hasText: /Start rest|開始休息|Rest/i }).first();
if (await startRest.count()) {
  await startRest.click().catch(() => {});
  await p.waitForTimeout(400);
}
{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: Math.max(844, Math.min(h, 1600)) });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '100-log-rest-plan.png', fullPage: true });
  console.log('saved 100-log-rest-plan.png');
  await p.setViewportSize({ width: 390, height: 844 });
}

// --- 101 Month heat + PRs ---
await tab(2);
await p.waitForTimeout(600);
{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: Math.max(844, Math.min(h, 2200)) });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '101-month-heat-prs.png', fullPage: true });
  console.log('saved 101-month-heat-prs.png');
  await p.setViewportSize({ width: 390, height: 844 });
}

// --- Summary headed body + share styles ---
await tab(1);
for (let i = 0; i < 14; i++) {
  const hasShare = await p.locator('button').filter({ hasText: /Share today/i }).count();
  const hasMap = await p.locator('.body-map').count();
  if (hasShare && hasMap) break;
  await p.locator('button[aria-label="Previous day"]').click();
  await p.waitForTimeout(400);
}
await p.waitForSelector('.body-map', { timeout: 15000 });
await p.waitForTimeout(800);
{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: Math.max(844, Math.min(h, 1800)) });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '103-summary-heads-v15.png', fullPage: true });
  console.log('saved 103-summary-heads-v15.png');
  await p.locator('.body-map').first().screenshot({ path: OUT + '103b-body-map-heads-v15.png' }).catch(() => {});
  await p.setViewportSize({ width: 390, height: 844 });
}

await p.evaluate(() => { try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch {} });

async function captureShare(styleLabel, outName) {
  // pick style via ShareStyleBar segmented
  const styleBtn = p.locator('.segmented button, .seg button, button').filter({ hasText: new RegExp('^' + styleLabel + '$', 'i') }).first();
  if (await styleBtn.count()) {
    await styleBtn.click();
    await p.waitForTimeout(300);
  } else {
    // fallback via store
    await p.evaluate((s) => {
      const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
      d.settings.shareStyle = s;
      localStorage.setItem('janson-fit-v1', JSON.stringify(d));
    }, styleLabel.toLowerCase());
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    await tab(1);
    for (let i = 0; i < 10; i++) {
      if (await p.locator('button').filter({ hasText: /Share today/i }).count()) break;
      await p.locator('button[aria-label="Previous day"]').click();
      await p.waitForTimeout(300);
    }
  }

  const b64 = await p.evaluate(async () => {
    let captured = null;
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      if (blob && blob.size > 20000) captured = blob;
      return orig(blob);
    };
    const btn = [...document.querySelectorAll('button')].find((el) => /Share today/i.test((el.textContent || '').trim()));
    if (!btn) return { err: 'no share btn' };
    btn.click();
    for (let i = 0; i < 100; i++) {
      if (captured) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    const prev = document.querySelector('img[alt="Share card preview"]');
    if (!captured && prev?.src?.startsWith('blob:')) {
      captured = await (await fetch(prev.src)).blob();
    }
    // close dialog if open
    const close = [...document.querySelectorAll('button')].find((el) => /Close|關閉|Done/i.test((el.textContent || '').trim()));
    close?.click();
    if (!captured) return { err: 'no blob', hasPrev: !!prev };
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve({ b64: fr.result, size: captured.size });
      fr.readAsDataURL(captured);
    });
  });
  console.log('share', styleLabel, b64?.err || b64?.size);
  if (b64?.b64) {
    writeFileSync(OUT + outName, Buffer.from(b64.b64.split(',')[1], 'base64'));
    console.log('saved', outName);
    return true;
  }
  return false;
}

const neonOk = await captureShare('Neon', '102-share-styles.png');
await captureShare('Poster', '102b-share-poster.png');
await captureShare('Grid', '102c-share-grid.png');
if (!neonOk) {
  // last resort: screenshot preview area
  await p.locator('button').filter({ hasText: /Share today/i }).click().catch(() => {});
  await p.waitForTimeout(2000);
  await p.screenshot({ path: OUT + '102-share-styles.png', fullPage: false });
}

const finalBuild = await p.evaluate(() => document.querySelector('meta[name="gym-build"]')?.content);
const hasHeads = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('.body-map img, .body-map picture source, img')];
  return imgs.some((im) => (im.currentSrc || im.src || '').includes('a-front') || (im.getAttribute('srcset') || '').includes('a-front'));
});
console.log('FINAL', { build: finalBuild, hasHeads, errors, neonOk });
await b.close();
if (finalBuild !== 'v15-rhythm-progress-share') {
  console.error('LIVE NOT V15 YET:', finalBuild);
  process.exitCode = 2;
}
