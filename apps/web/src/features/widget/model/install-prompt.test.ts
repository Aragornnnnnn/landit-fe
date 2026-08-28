// install-prompt — 위젯 설치 안내를 누구에게, 언제, 몇 번 보여줄지의 계약 검증
import type { NativeContext } from '@landit/bridge';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  markTalkCompletedForWidget,
  recordInstallAccepted,
  recordInstallInvited,
  recordReinviteAnswer,
  shouldInviteInstall,
  shouldReinvite,
  supportsWidgetInstall,
} from './install-prompt';

const contextOf = (over: Partial<NativeContext> = {}): NativeContext => ({
  platform: 'ios',
  appVersion: '1.2.0',
  buildNumber: '1',
  bridgeVersion: 2,
  ...over,
});

beforeEach(() => localStorage.clear());

describe('supportsWidgetInstall — 위젯이 있는 앱에서만 안내한다', () => {
  it('브라우저(셸 밖)에서는 안내하지 않는다', () => {
    expect(supportsWidgetInstall(null)).toBe(false);
  });

  it('위젯이 실린 1.2.0부터 안내한다', () => {
    expect(supportsWidgetInstall(contextOf({ appVersion: '1.2.0' }))).toBe(
      true,
    );
    expect(supportsWidgetInstall(contextOf({ appVersion: '1.3.5' }))).toBe(
      true,
    );
    expect(supportsWidgetInstall(contextOf({ appVersion: '2.0.0' }))).toBe(
      true,
    );
  });

  it('위젯이 없는 구버전 앱에서는 안내하지 않는다', () => {
    expect(supportsWidgetInstall(contextOf({ appVersion: '1.1.9' }))).toBe(
      false,
    );
    expect(supportsWidgetInstall(contextOf({ appVersion: '1.0.0' }))).toBe(
      false,
    );
  });

  it('버전 형식이 어긋나면 안내하지 않는다 — 확신 없이 화면을 띄우지 않는다', () => {
    expect(supportsWidgetInstall(contextOf({ appVersion: 'dev' }))).toBe(false);
  });
});

describe('shouldInviteInstall — 온보딩 끝 설치 유도는 한 번만', () => {
  it('보여준 적 없으면 보여준다', () => {
    expect(shouldInviteInstall()).toBe(true);
  });

  it('한 번 보여줬으면 다시 보여주지 않는다', () => {
    recordInstallInvited();

    expect(shouldInviteInstall()).toBe(false);
  });
});

describe('shouldReinvite — 재유도 시트는 설치로 답한 적 없는 사람에게 대화 직후 한 번만', () => {
  it('아무 기록 없는 기존 유저도 대화를 막 마쳤으면 묻는다 — 온보딩을 다시 볼 일이 없어서다', () => {
    markTalkCompletedForWidget();

    expect(shouldReinvite()).toBe(true);
  });

  it('설치 유도를 미룬 사람도 대화를 마쳤으면 묻는다', () => {
    recordInstallInvited();
    markTalkCompletedForWidget();

    expect(shouldReinvite()).toBe(true);
  });

  it('설치 유도에서 위젯 추가하기를 누른 사람에게는 묻지 않는다 — 설치 길은 이미 안내했다', () => {
    recordInstallInvited();
    recordInstallAccepted();
    markTalkCompletedForWidget();

    expect(shouldReinvite()).toBe(false);
  });

  it('대화를 막 마친 게 아니면 묻지 않는다 — 홈에 그냥 들어온 사람을 붙잡지 않는다', () => {
    recordInstallInvited();

    expect(shouldReinvite()).toBe(false);
  });

  it.each([['install'], ['dismiss']] as const)(
    '재유도에 한 번 답했으면(%s) 다음 대화를 마쳐도 다시 묻지 않는다',
    (answer) => {
      markTalkCompletedForWidget();
      recordReinviteAnswer(answer);

      markTalkCompletedForWidget();

      expect(shouldReinvite()).toBe(false);
    },
  );
});
