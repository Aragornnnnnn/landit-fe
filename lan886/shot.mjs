// lan886 도식을 .page 요소만 2배로 찍는다
import { chromium } from 'playwright-core';
const [src, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 820, height: 600 }, deviceScaleFactor: 2 });
await page.goto(src);
await page.waitForTimeout(800);
await page.locator('.page').screenshot({ path: out });
await browser.close();
