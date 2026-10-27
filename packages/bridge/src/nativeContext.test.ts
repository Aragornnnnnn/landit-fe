// 네이티브 컨텍스트 스키마·주입 스크립트·리더 검증 — 셸→웹 단방향 전달의 계약
import { describe, expect, it } from 'vitest';

import {
  buildNativeContextScript,
  NATIVE_CONTEXT_GLOBAL,
  readNativeContext,
} from './nativeContext';

const valid = {
  platform: 'ios',
  appVersion: '1.0.0',
  buildNumber: '42',
  bridgeVersion: 1,
} as const;

describe('readNativeContext', () => {
  it('유효한 컨텍스트 객체를 그대로 통과시킨다', () => {
    expect(readNativeContext(valid)).toEqual(valid);
  });

  it('buildNativeContextScript로 주입한 값을 되읽는다 (round-trip)', () => {
    const script = buildNativeContextScript(valid);
    // window 대역 객체에 대해 주입 스크립트를 실행한다
    const fakeWindow: Record<string, unknown> = {};
    new Function('window', script)(fakeWindow);

    expect(readNativeContext(fakeWindow[NATIVE_CONTEXT_GLOBAL])).toEqual(valid);
  });

  it('브라우저(주입값 없음)면 null을 돌려준다', () => {
    expect(readNativeContext(undefined)).toBeNull();
    expect(readNativeContext(null)).toBeNull();
  });

  it('buildNumber는 null을 허용한다 (스토어 빌드 번호 없을 때)', () => {
    expect(readNativeContext({ ...valid, buildNumber: null })).toEqual({
      ...valid,
      buildNumber: null,
    });
  });

  it('기기 글자 배율(fontScale)을 함께 읽는다', () => {
    expect(readNativeContext({ ...valid, fontScale: 1.3 })).toEqual({
      ...valid,
      fontScale: 1.3,
    });
  });

  it('fontScale이 없는 구 셸 컨텍스트도 읽는다', () => {
    expect(readNativeContext(valid)).toEqual(valid);
  });

  it('fontScale이 0 이하면 null을 돌려준다', () => {
    expect(readNativeContext({ ...valid, fontScale: 0 })).toBeNull();
  });

  it('기기 ID(deviceId)를 함께 읽는다', () => {
    expect(readNativeContext({ ...valid, deviceId: 'abc-123' })).toEqual({
      ...valid,
      deviceId: 'abc-123',
    });
  });

  it('deviceId가 빈 문자열이면 null을 돌려준다', () => {
    expect(readNativeContext({ ...valid, deviceId: '' })).toBeNull();
  });

  it('기기 선호 언어 목록(languages)을 순서 그대로 읽는다', () => {
    expect(
      readNativeContext({ ...valid, languages: ['en-US', 'ja-JP', 'ko-KR'] }),
    ).toEqual({ ...valid, languages: ['en-US', 'ja-JP', 'ko-KR'] });
  });

  it('목록을 보내지 않는 구 셸이면 languages 없이 읽는다', () => {
    expect(readNativeContext(valid)?.languages).toBeUndefined();
  });

  it('목록에 문자열이 아닌 값이 섞여도 컨텍스트 전체를 버리지 않고 목록만 뺀다', () => {
    expect(readNativeContext({ ...valid, languages: ['ja-JP', 3] })).toEqual(
      valid,
    );
  });

  it('규격 밖이면 null을 돌려준다', () => {
    // 알 수 없는 platform
    expect(readNativeContext({ ...valid, platform: 'web' })).toBeNull();
    // 필수 필드 누락
    expect(
      readNativeContext({ platform: 'ios', appVersion: '1.0.0' }),
    ).toBeNull();
    // 빈 appVersion
    expect(readNativeContext({ ...valid, appVersion: '' })).toBeNull();
  });
});

describe('buildNativeContextScript', () => {
  it('전역 대입으로 시작해 true;로 끝난다 — iOS injectedJS 경고 방지', () => {
    const script = buildNativeContextScript(valid);

    expect(script.startsWith(`window.${NATIVE_CONTEXT_GLOBAL} =`)).toBe(true);
    expect(script.trimEnd().endsWith('true;')).toBe(true);
  });
});
