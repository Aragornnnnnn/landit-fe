import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 2 });
await page.goto('file://' + process.cwd() + '/split.html');
await page.waitForTimeout(300);
for (const id of ['s1', 's2', 's3']) await page.locator('#' + id).screenshot({ path: `lan890-${id}.png` });
await browser.close();
