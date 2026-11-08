// 랜딩 폰 화면 캡처 — 언어별 그림 주소와, 화면에 그릴 때 받는 크기·화질
import type { Locale } from '@/shared/i18n/locale';

/** 캡처를 다시 찍으면 올린다 — 같은 주소의 옛 그림이 브라우저에 하루 동안 남기 때문이다 */
const SCREENS_VERSION = 10;

/** 폰 화면 캡처 경로 — 일본어 화면은 일본어로 다시 찍은 캡처를 쓴다 */
export const screenPath = (locale: Locale, shot: string) =>
  `/images/landing/screens/${locale === 'ja' ? 'ja/' : ''}${shot}.webp?v=${SCREENS_VERSION}`;

/** 폰 화면 캡처를 화면에 그릴 때의 크기·화질 — 폰 폭(휴대폰 322px·그 이상 366px)의 화면 자리(90%)만큼만 받는다. 작은 글자가 흐려지지 않게 화질은 90 */
export const SCREEN_IMAGE = {
  width: 780,
  height: 1688,
  sizes: '(min-width: 640px) 330px, 290px',
  quality: 90,
} as const;
