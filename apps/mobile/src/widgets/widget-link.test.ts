// 위젯 탭 딥링크 판별 검증 — 라우터가 위젯 링크로 화면 전환(Unmatched Route)하지 않게 하는 근거
import { redirectSystemPath } from '../app/+native-intent';
import { isWidgetEntryUrl } from './widget-link';

describe('isWidgetEntryUrl', () => {
  it('위젯 딥링크를 위젯 진입으로 판별한다', () => {
    expect(isWidgetEntryUrl('landit://widget')).toBe(true);
    expect(isWidgetEntryUrl('landit:/widget')).toBe(true);
  });

  it('다른 딥링크는 위젯 진입이 아니다', () => {
    expect(isWidgetEntryUrl('landit://')).toBe(false);
    expect(isWidgetEntryUrl('landit://home')).toBe(false);
    expect(isWidgetEntryUrl('landit://oauthredirect?state=abc')).toBe(false);
  });
});

describe('redirectSystemPath — 위젯 진입', () => {
  it('위젯 딥링크면 null을 돌려줘 라우터 전환 없이 앱만 연다', () => {
    expect(
      redirectSystemPath({ path: 'landit://widget', initial: false }),
    ).toBeNull();
  });
});
