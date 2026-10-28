// 셸 언어에 맞는 위젯 아트 묶음 — 일본어는 글자가 든 그림만 바꾸고, 없는 키(열매)는 한국어 그림을 같이 쓴다
import type { ShellLocale } from '../../i18n/shell-locale';
import { WIDGET_ART, WIDGET_ART_JA } from './widget-art';

const ART_JA = { ...WIDGET_ART, ...WIDGET_ART_JA };

export const widgetArtFor = (locale: ShellLocale): Record<string, number> =>
  locale === 'ja' ? ART_JA : WIDGET_ART;

/** iOS 공유 폴더에서 언어별 아트 파일을 가르는 접두어 — 두 언어 아트를 한 폴더에 같이 둔다 */
export const artFilePrefixOf = (locale: ShellLocale) =>
  locale === 'ja' ? 'ja-' : '';
