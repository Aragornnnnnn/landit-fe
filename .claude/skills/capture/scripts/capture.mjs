// landit 웹 화면을 헤드리스 크롬으로 파일에 찍는다 — 가짜 세션 주입·API 목·dev 오버레이 숨김·폰 프리셋을 한 번에 처리
//
// 사용법:
//   node capture.mjs --url http://localhost:3000/home --out ./home.png [옵션]
//
// 옵션:
//   --preset pr|figma     pr = 375×812 @2 (기본), figma = 390×832 @3 (피그마 폰 SCREEN 958×2044 비율, 상단 58px 스테이터스 여백)
//   --auth                localStorage에 가짜 세션(landit-auth)과 온보딩 완료 플래그를 넣는다
//   --wait "<selector>"   이 셀렉터가 나타날 때까지 기다린다 (text=..., css 모두 가능)
//   --delay <ms>          기다린 뒤 추가로 쉬는 시간 (애니메이션 끝나기용, 기본 1500)
//   --steps <file.mjs>    export default async ({ page, ctx, shot }) => {...} — 목 라우트 등록·클릭 흐름·여러 장 촬영을 여기서
//   --mic                 가짜 마이크 장치로 띄운다 (녹음 화면)
//   --full                뷰포트가 아니라 문서 전체 높이로 찍는다
//
// playwright-core는 스크래치패드에 `npm i playwright-core`로 깔거나, 없으면 npx 캐시에서 찾는다.
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--')
    ? args[i + 1]
    : fallback;
};

const url = opt('url');
const out = opt('out');
if (!url || !out) {
  console.error('필수: --url <주소> --out <파일.png>');
  process.exit(1);
}

const PRESETS = {
  pr: {
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    statusInset: 0,
  },
  figma: {
    viewport: { width: 390, height: 832 },
    deviceScaleFactor: 3,
    statusInset: 58,
  },
};
const preset = PRESETS[opt('preset', 'pr')] ?? PRESETS.pr;

const findPlaywright = () => {
  const local = resolve(process.cwd(), 'node_modules/playwright-core');
  if (existsSync(local)) return resolve(process.cwd(), 'node_modules/');
  const cache = join(homedir(), '.npm/_npx');
  const cached = existsSync(cache) ? readdirSync(cache) : [];
  for (const dir of cached) {
    const candidate = join(cache, dir, 'node_modules/playwright-core');
    if (existsSync(candidate)) return join(cache, dir, 'node_modules/');
  }
  throw new Error(
    'playwright-core를 못 찾았다. 스크래치패드에서 `npm i playwright-core` 후 그 폴더에서 실행할 것',
  );
};
const { chromium } = createRequire(findPlaywright())('playwright-core');

const chromeArgs = ['--autoplay-policy=no-user-gesture-required'];
if (flag('mic'))
  chromeArgs.push(
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  );

const browser = await chromium.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: chromeArgs,
});
const ctx = await browser.newContext({
  viewport: preset.viewport,
  deviceScaleFactor: preset.deviceScaleFactor,
  permissions: flag('mic') ? ['microphone'] : [],
});

// dev 오버레이·프리뷰 전용 토글은 숨기고, 피그마 프리셋이면 아이폰 스테이터스바 높이만큼 safe-area 상단을 비운다
await ctx.addInitScript((statusInset) => {
  const style = document.createElement('style');
  style.textContent =
    'nextjs-portal{display:none!important} [data-preview-only]{display:none!important}' +
    (statusInset
      ? ` [style*="safe-area-inset-top"]{padding-top:${statusInset}px!important}`
      : '');
  document.addEventListener('DOMContentLoaded', () =>
    document.head.appendChild(style),
  );
}, preset.statusInset);

if (flag('auth')) {
  // 로그인 벽 통과용 가짜 세션. member.provider는 필수 — 없으면 프로필 게이트가 다시 묻는다
  await ctx.addInitScript(() => {
    localStorage.setItem(
      'landit-auth',
      JSON.stringify({
        state: {
          refreshToken: 'capture-fake-session',
          member: {
            userId: 1,
            provider: 'KAKAO',
            email: 'capture@landit.im',
            nickname: '캡처',
          },
        },
        version: 0,
      }),
    );
    localStorage.setItem('landit-onboarding-seen', '1');
  });
}

const page = await ctx.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error')
    console.log('[console]', msg.text().slice(0, 160));
});

const shot = async (path = out) => {
  await page.screenshot({ path, scale: 'device', fullPage: flag('full') });
  console.log('saved', path);
};

const stepsFile = opt('steps');
const steps = stepsFile
  ? (await import(pathToFileURL(resolve(stepsFile)).href)).default
  : null;

// Next dev는 HMR 소켓 때문에 networkidle이 안 온다 — load까지만 기다리고 나머지는 셀렉터·딜레이로
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
const wait = opt('wait');
if (wait) await page.waitForSelector(wait, { timeout: 60000 });
await page.waitForTimeout(Number(opt('delay', 1500)));

if (steps) await steps({ page, ctx, shot });
else await shot();

await browser.close();
