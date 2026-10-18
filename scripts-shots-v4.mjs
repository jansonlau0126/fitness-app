import { chromium } from 'playwright-core';
import { mkdirSync, copyFileSync, writeFileSync } from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4180/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', hasTouch: true, isMobile: true, locale: 'en-US', acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
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
const tab = async (i) => { await p.locator('.tabbar button').nth(i).click(); await p.waitForTimeout(400); };

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });
await shot('30-home-rebrand.png');
copyFileSync(new URL('./public/icon-512.png', import.meta.url).pathname, OUT + '31-icon.png');
console.log('saved 31-icon.png');

await tab(4);
await p.locator('button').filter({ hasText: /Load demo|載入示範|demo/i }).first().click();
await p.locator('.dialog button').filter({ hasText: /Load demo|載入示範/i }).first().click();
await p.waitForTimeout(2800);

// Jump to a recent training day with entries
await p.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
  const dates = [...new Set(d.entries.map((e) => e.date))].sort();
  const last = dates[dates.length - 1];
  // store intended date in session via hash — DayPage uses React state; instead inject a today entry by copying last day to today
  const today = new Date();
  const key = today.toISOString().slice(0, 10);
  const sample = d.entries.filter((e) => e.date === last).map((e, i) => ({
    ...e, id: 'shot' + i, date: key, t: Date.now() + i,
  }));
  d.entries.push(...sample);
  d.profile.age = 50; d.profile.weightKg = 75;
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(500);

await tab(1);
await p.waitForTimeout(600);
await shot('32-muscle-realistic.png', true);

// Force download by disabling share
const b64 = await p.evaluate(async () => {
  const origShare = navigator.share;
  // @ts-ignore
  navigator.share = undefined;
  const orig = URL.createObjectURL.bind(URL);
  let captured = null;
  URL.createObjectURL = (blob) => {
    const fr = new FileReader();
    fr.readAsDataURL(blob);
    // sync wait via promise chain outside
    captured = blob;
    return orig(blob);
  };
  const btn = [...document.querySelectorAll('button')].find((b) => /Share|分享/i.test(b.textContent || ''));
  btn?.click();
  await new Promise((r) => setTimeout(r, 1500));
  if (!captured) return null;
  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(captured);
  });
});
if (b64 && typeof b64 === 'string') {
  writeFileSync(OUT + '33-share-large.png', Buffer.from(b64.split(',')[1], 'base64'));
  console.log('saved 33-share-large.png', b64.length);
} else console.log('FAILED share capture');
await shot('33b-share-ui.png');

await tab(4);
await p.locator('button').filter({ hasText: /繁體中文/ }).click();
await p.waitForTimeout(500);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(300);
await shot('34-zh-gaps.png', true);

await p.evaluate(() => document.querySelector('#sync')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(300);
await p.locator('#sync').screenshot({ path: OUT + '35-sync-profile.png' });
console.log('saved 35');

console.log('ERRORS', errors);
await b.close();
