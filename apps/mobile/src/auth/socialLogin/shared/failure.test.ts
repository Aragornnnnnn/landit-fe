// 소셜 로그인 실패를 웹 회신 모양으로 바꾸는 갈림길 — 취소는 보고하지 않고, 그 밖의 실패는 provider와 함께 보고한다
import { reportError } from '../../../monitoring/report';
import { SocialLoginError } from './errors';
import { toSocialLoginFailure } from './failure';

jest.mock('../../../monitoring/report', () => ({ reportError: jest.fn() }));

describe('toSocialLoginFailure', () => {
  it('사용자가 취소한 실패는 cancelled로 돌려주고 보고하지 않는다', () => {
    const failure = toSocialLoginFailure(
      new SocialLoginError('로그인이 취소됐어요.', true),
      'apple',
    );

    expect(failure).toEqual({
      message: '로그인이 취소됐어요.',
      cancelled: true,
    });
    expect(reportError).not.toHaveBeenCalled();
  });

  it('취소가 아닌 소셜 로그인 오류는 그 문구를 살리고 provider와 함께 보고한다', () => {
    const error = new SocialLoginError('id_token을 받지 못했어요.');

    const failure = toSocialLoginFailure(error, 'kakao');

    expect(failure).toEqual({
      message: 'id_token을 받지 못했어요.',
      cancelled: false,
    });
    expect(reportError).toHaveBeenCalledWith(error, { provider: 'kakao' });
  });

  it('알 수 없는 예외는 기본 문구로 바꾸고 보고한다', () => {
    const error = new Error('SDK crashed');

    const failure = toSocialLoginFailure(error, 'google');

    expect(failure).toEqual({
      message: '로그인 중 문제가 생겼어요.',
      cancelled: false,
    });
    expect(reportError).toHaveBeenCalledWith(error, { provider: 'google' });
  });
});
