// 포그라운드 표시 정책 검증 — 우리 리마인더는 배너만 가리고 알림 센터에는 남기는 분기
import { resolveForegroundBehavior } from './setup';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));

describe('resolveForegroundBehavior', () => {
  it('우리 리마인더면 배너는 가리되 알림 센터에는 남긴다', () => {
    const behavior = resolveForegroundBehavior({
      kind: 'daily-reminder',
      url: '/scenario',
    });

    expect(behavior.shouldShowBanner).toBe(false);
    expect(behavior.shouldShowList).toBe(true);
  });

  it('다른 종류의 알림이면 배너·목록을 그대로 보여준다', () => {
    const behavior = resolveForegroundBehavior({ kind: 'marketing' });

    expect(behavior.shouldShowBanner).toBe(true);
    expect(behavior.shouldShowList).toBe(true);
  });

  it('페이로드가 없거나 형태가 어긋나도 알림을 보여준다', () => {
    expect(resolveForegroundBehavior(null).shouldShowBanner).toBe(true);
    expect(resolveForegroundBehavior(undefined).shouldShowBanner).toBe(true);
    expect(resolveForegroundBehavior('daily-reminder').shouldShowBanner).toBe(
      true,
    );
  });

  it('소리·배지는 어떤 알림에도 켜지 않는다', () => {
    const ours = resolveForegroundBehavior({ kind: 'daily-reminder' });
    const others = resolveForegroundBehavior({ kind: 'marketing' });

    expect(ours.shouldPlaySound).toBe(false);
    expect(ours.shouldSetBadge).toBe(false);
    expect(others.shouldPlaySound).toBe(false);
    expect(others.shouldSetBadge).toBe(false);
  });
});
