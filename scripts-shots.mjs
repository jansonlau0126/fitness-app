// Takes phone-size screenshots of the built app (run: node scripts-shots.mjs [baseUrl])
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:4173/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', hasTouch: true, isMobile: true });
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(String(e)));
const shot = async (name, full = false) => {
  await p.waitForTimeout(450);
  if (full) {
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: 390, height: Math.max(844, h) });
    await p.waitForTimeout(250);
  }
  await p.screenshot({ path: OUT + name });
  if (full) await p.setViewportSize({ width: 390, height: 844 });
  console.log('saved', OUT + name);
};
const tab = async (label) => { await p.click(`.tabbar button:has-text("${label}")`); await p.waitForTimeout(300); };

await p.goto(BASE + '#/log');
await shot('00-empty-start.png');

// load demo data
await tab('Profile');
await p.click('button:has-text("Load demo data")');
await p.click('.dialog button:has-text("Load demo")');
await p.waitForTimeout(2900); // let the toast go away

// add a few entries today through the UI
async function addEntry(part, exName, sets) {
  await tab('Log');
  await p.click('button:has-text("Add exercise")');
  await p.selectOption('.sheet select >> nth=0', { label: part });
  await p.selectOption('.sheet select >> nth=1', { label: exName });
  for (let i = 0; i < sets.length; i++) {
    const rows = await p.locator('.sheet .set-row:not(.head)').count();
    if (i >= rows) await p.click('.sheet button:has-text("Add set")');
    const row = p.locator('.sheet .set-row:not(.head)').nth(i);
    await row.locator('input').nth(0).fill(String(sets[i][0]));
    await row.locator('input').nth(1).fill(String(sets[i][1]));
  }
  const rows = await p.locator('.sheet .set-row:not(.head)').count();
  for (let i = rows - 1; i >= sets.length; i--) await p.locator('.sheet .set-row:not(.head)').nth(i).locator('button').click();
  return async () => { await p.click('.sheet-foot button:has-text("Add to log")'); await p.waitForTimeout(300); };
}
let save = await addEntry('Chest', 'Bench Press', [[70, 5], [75, 5], [77.5, 4]]);
await shot('01-add-exercise-sheet.png');
await save();
await p.waitForTimeout(2700);
save = await addEntry('Back', 'Pull-up', [[0, 10], [0, 9], [0, 8]]); await save();
save = await addEntry('Shoulders', 'Lateral Raise', [[10, 12], [10, 12], [10, 11]]); await save();
save = await addEntry('Triceps', 'Rope Pushdown', [[25, 12], [27.5, 10]]); await save();
await p.waitForTimeout(2800); // let toast go
await shot('02-today-log.png', true);

await tab('Summary');
await shot('03-day-summary.png', true);
await shot('03a-day-summary-phone.png');
await p.locator('.body-map').first().screenshot({ path: OUT + '03b-body-diagram.png' });

await tab('Profile');
await shot('04a-profile-top.png');
await p.locator('#standards .lvl').first().click();
{
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: 390, height: h }); await p.waitForTimeout(300);
  await p.locator('#standards').screenshot({ path: OUT + '04-strength-standards.png' }); console.log('saved 04');
  await p.setViewportSize({ width: 390, height: 844 });
}
await p.evaluate(() => document.querySelector('#standards').scrollIntoView());
await shot('04b-strength-standards-phone.png');

await tab('Month');
await p.waitForTimeout(800);
await shot('05-month-summary.png', true);
await p.click('button[aria-label="Previous month"]');
await shot('05b-month-previous.png', true);

await tab('Library');
await p.click('.ex-head >> nth=0');
await shot('06-library.png');
await p.click('.seg button:has-text("Equipment")');
await shot('07-equipment.png');

// light theme check
await tab('Profile');
await p.click('.seg button:has-text("Light")');
await tab('Summary');
await shot('08-day-summary-light.png');
await tab('Profile');
await p.click('.seg button:has-text("Auto")');

console.log('ERRORS:', JSON.stringify(errors));
await b.close();
