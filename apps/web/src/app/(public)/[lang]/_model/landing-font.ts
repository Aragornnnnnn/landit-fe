// 랜딩 전용 폰트에 담을 글자·굵기를 고른다 — 랜딩은 Pretendard 조각 수십 개(약 400KB) 대신 화면에 쓰는 글자만 담은 한 파일을 받는다. 생성기와 누락 감시 테스트가 같이 쓴다
import type { Locale } from '@/shared/i18n/locale';

// 남의 언어 글자는 시스템 글꼴로 그린다 — 한국어 화면의 "日本語" 링크 한 줄 때문에 폰트를 키우지 않는다
const OTHER_SCRIPT: Record<Locale, RegExp> = {
  ko: /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u,
  ja: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u,
};

// 배지 숫자·짧은 영어 문구는 자주 바뀌어서 출력 가능한 ASCII는 통째로 담는다
const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, i) =>
  String.fromCharCode(0x20 + i),
).join('');

/** 소스의 주석 글을 지운다 — 주석의 한글까지 폰트에 담지 않게. 주소의 `//`는 남긴다 */
export const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** 화면 글에서 그 언어 폰트에 담을 글자를 한 번씩, 정렬해서 모은다 */
export const landingGlyphs = (locale: Locale, texts: string[]) => {
  const glyphs = new Set(ASCII);
  for (const char of texts.join('')) {
    if (char < ' ' || OTHER_SCRIPT[locale].test(char)) continue;
    glyphs.add(char);
  }
  return [...glyphs].sort().join('');
};

/** 랜딩 폰트에 담는 굵기 축 범위 — 랜딩은 400~700만 써서 축을 좁혀 폰트를 30%쯤 줄인다. landing.module.css의 font-weight와 같아야 한다 */
export const LANDING_FONT_WEIGHT = { min: 400, max: 700 } as const;

const TAILWIND_WEIGHT: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

/** 소스가 쓰는 굵기를 Tailwind 굵기 클래스(font-bold)와 임의 값(font-[650])에서 읽는다 */
export const fontWeightsIn = (source: string) =>
  [...source.matchAll(/\bfont-(\[(\d+)\]|[a-z]+)/g)].flatMap(
    ([, name, arbitrary]) => {
      const weight = arbitrary ? Number(arbitrary) : TAILWIND_WEIGHT[name];
      return weight === undefined ? [] : [weight];
    },
  );
