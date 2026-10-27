// 셸 문구 언어 — 웹이 알려 준 화면 언어가 먼저, 없으면 기기 언어, 그것도 아니면 한국어인지 검증한다
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));
const getLocalesMock = jest.mocked(getLocales);

const deviceIs = (...languageTags: string[]) =>
  getLocalesMock.mockReturnValue(
    languageTags.map((languageTag) => ({
      languageTag,
      languageCode: languageTag.split('-')[0],
    })) as ReturnType<typeof getLocales>,
  );

// 모듈 안 캐시를 테스트마다 비운다
const load = () => {
  let mod!: typeof import('./shell-locale');
  jest.isolateModules(() => {
    mod = require('./shell-locale');
  });
  return mod;
};

beforeEach(() => {
  void AsyncStorage.clear();
  deviceIs('ko-KR');
});

describe('shellLocale', () => {
  it('웹이 알려 주기 전엔 기기 언어 목록에서 처음 나오는 한국어·일본어를 쓴다', () => {
    deviceIs('en-US', 'ja-JP', 'ko-KR');

    expect(load().shellLocale()).toBe('ja');
  });

  it('기기에 한국어·일본어가 없으면 한국어다', () => {
    deviceIs('en-US', 'fr-FR');

    expect(load().shellLocale()).toBe('ko');
  });

  it('웹이 알려 준 화면 언어는 기기 언어보다 먼저다', async () => {
    deviceIs('ko-KR');
    const { saveShellLocale, shellLocale } = load();

    await saveShellLocale('ja');

    expect(shellLocale()).toBe('ja');
  });

  it('다음 실행에서도 저장해 둔 화면 언어를 읽는다', async () => {
    await load().saveShellLocale('ja');
    deviceIs('ko-KR');

    const next = load();
    await next.loadShellLocale();

    expect(next.shellLocale()).toBe('ja');
  });

  it('저장값이 깨졌으면 기기 언어로 돌아간다', async () => {
    await AsyncStorage.setItem('landit.shell.locale', 'en');
    deviceIs('ja-JP');

    const next = load();
    await next.loadShellLocale();

    expect(next.shellLocale()).toBe('ja');
  });
});

describe('deviceLanguageTags', () => {
  it('기기 선호 언어를 우선순위 그대로 돌려준다', () => {
    deviceIs('en-US', 'ja-JP');

    expect(load().deviceLanguageTags()).toEqual(['en-US', 'ja-JP']);
  });
});
