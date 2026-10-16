import { chromium } from 'playwright-core';
const BASE = 'https://jansonlau0126.github.io/fitness-app/';
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
await p.waitForTimeout(800);

// clear SW caches to avoid stale
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
await p.waitForTimeout(2800);
await p.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('janson-fit-v1'));
  d.profile.age = 50; d.profile.weightKg = 75; d.settings.locale = 'en';
  localStorage.setItem('janson-fit-v1', JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(500);

const checks = {};

// last-time
await tab(0);
await p.click('button:has-text("Add exercise")');
await p.selectOption('.sheet select', 'Chest');
await p.locator('.sheet .ex-opt', { has: p.locator('.ex-opt-name', { hasText: /^Bench Press$/ }) }).click();
await p.waitForTimeout(400);
checks.lastCard = await p.locator('.last-card').count() > 0;
checks.lastText = await p.locator('.last-card').innerText().catch(() => '');
await p.locator('.sheet .set-row:not(.head)').first().locator('input').nth(1).fill('5');
await p.click('.sheet-foot button:has-text("Add to log")');
await p.waitForTimeout(2500);

// timed plank
await p.click('button:has-text("Add exercise")');
await p.selectOption('.sheet select', 'Abs');
await p.locator('.sheet .ex-opt', { has: p.locator('.ex-opt-name', { hasText: /^Plank$/ }) }).click();
await p.waitForTimeout(300);
const inputs = p.locator('.sheet .set-row:not(.head)').first().locator('input');
await inputs.nth(1).fill('55');
checks.durationHint = (await p.locator('.sheet').innerText()).includes('seconds') || (await p.locator('.sheet').innerText()).includes('Timed');
await p.click('.sheet-foot button:has-text("Add to log")');
await p.waitForTimeout(2500);

// body tap
await tab(1);
await p.locator('.chip').filter({ hasText: /chest/i }).first().click();
await p.waitForTimeout(500);
checks.filterBar = await p.locator('.filter-bar').count() > 0;
checks.shareBtn = await p.locator('button').filter({ hasText: /Share/ }).count() > 0;

// age standards
await tab(4);
const std = await p.locator('#standards').innerText();
checks.ageLine = /age 50/i.test(std);
checks.ageNote = /Age-adjusted|25–40|25-40/i.test(std);

// zh-TW
await p.locator('button').filter({ hasText: /繁體中文/ }).click();
await p.waitForTimeout(500);
await tab(0);
const logTitle = await p.locator('h1').first().innerText();
checks.zhTitle = /訓練|紀錄|记录/.test(logTitle);
const tabs = await p.locator('.tabbar button').allTextContents();
checks.zhTabs = tabs.join('|');

await p.screenshot({ path: OUT + 'live-site-v3.png', fullPage: false });
console.log('CHECKS', JSON.stringify(checks, null, 2));
console.log('ERRORS', errors);
await b.close();
