// 셸 문구 언어 — 웹이 알려 준 화면 언어(저장)가 먼저, 없으면 기기 언어, 그것도 아니면 한국어
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { reportWarning } from '../monitoring/report';

export type ShellLocale = 'ko' | 'ja';

const STORAGE_KEY = 'landit.shell.locale';

const isShellLocale = (value: unknown): value is ShellLocale =>
  value === 'ko' || value === 'ja';

// 웹이 알려 준 화면 언어 — 앱을 켤 때 저장소에서 한 번 읽어 둔다
let saved: ShellLocale | null = null;
// 저장소 읽기는 프로세스당 한 번 — 여러 곳(시작·알람·위젯)이 같이 기다린다
let loading: Promise<void> | null = null;

/** 기기 선호 언어를 우선순위 그대로 — 웹이 로그인 화면 언어 버튼과 가입 헤더에 쓴다 */
export const deviceLanguageTags = () =>
  getLocales().map(({ languageTag }) => languageTag);

// 웹이 알려 주기 전(첫 실행·웹 로드 실패)에 쓴다 — 웹의 화면 언어 규칙과 같다
const deviceLocale = (): ShellLocale =>
  getLocales()
    .map(({ languageCode }) => languageCode)
    .find(isShellLocale) ?? 'ko';

export const shellLocale = (): ShellLocale => saved ?? deviceLocale();

/** 저장해 둔 화면 언어를 읽어 둔다 — 깨졌거나 못 읽으면 기기 언어로 둔다. 셸 문구를 쓰기 전에 기다린다 */
export const loadShellLocale = async (): Promise<ShellLocale> => {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      // 읽는 사이 웹이 먼저 알려 줬으면 그 값이 최신이다 — 저장소의 옛 값으로 덮지 않는다
      if (saved === null && isShellLocale(raw)) saved = raw;
    })
    .catch(reportWarning);
  await loading;
  return shellLocale();
};

/** 웹이 알려 준 화면 언어를 기억한다 — 다음 실행의 오류 화면·위젯도 이 언어로 그린다 */
export const saveShellLocale = async (locale: ShellLocale) => {
  saved = locale;
  await AsyncStorage.setItem(STORAGE_KEY, locale);
};
