// monitoring — 보고 통로가 레벨을 붙여 Sentry로 넘기고, 사용자 식별을 해제까지 다루는지 검증
import * as Sentry from '@sentry/react-native';

import { reportWarning, setMonitoringUser } from './report';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
}));

const sentryMock = Sentry as jest.Mocked<typeof Sentry>;

describe('reportWarning', () => {
  it('예외를 주면 warning 레벨로 예외를 보고한다', () => {
    const error = new Error('offline');

    reportWarning(error, { packageId: '$rc_annual' });

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
      extra: { packageId: '$rc_annual' },
    });
  });

  it('설명 문자열을 주면 warning 레벨 메시지로 보고한다 — 예외가 없는 상황용', () => {
    reportWarning('웹뷰 콘텐츠 프로세스 종료');

    expect(sentryMock.captureMessage).toHaveBeenCalledWith(
      '웹뷰 콘텐츠 프로세스 종료',
      { level: 'warning', extra: undefined },
    );
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });
});

describe('setMonitoringUser', () => {
  it('userId가 있으면 그 id로 사용자를 묶는다 — RevenueCat app_user_id와 같은 값', () => {
    setMonitoringUser('42');

    expect(sentryMock.setUser).toHaveBeenCalledWith({ id: '42' });
  });

  it('null이면 사용자를 푼다 — 로그아웃 뒤 이슈가 이전 사용자에게 붙지 않게', () => {
    setMonitoringUser(null);

    expect(sentryMock.setUser).toHaveBeenCalledWith(null);
  });
});
