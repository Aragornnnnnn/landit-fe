// expo 권한 응답 → 브릿지 세 상태 매핑 검증 — canAskAgain에 따른 denied 해석이 핵심
import { toPermissionStatus } from './permission';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

describe('toPermissionStatus', () => {
  it('granted면 granted를 돌려준다', () => {
    expect(toPermissionStatus({ status: 'granted', canAskAgain: true })).toBe(
      'granted',
    );
  });

  it('undetermined면 undetermined를 돌려준다', () => {
    expect(
      toPermissionStatus({ status: 'undetermined', canAskAgain: true }),
    ).toBe('undetermined');
  });

  it('denied라도 다시 물을 수 있으면 undetermined로 본다', () => {
    // 웹 입장에선 "요청하면 권한창이 뜰 수 있는 상태"라 미결정과 같다
    expect(toPermissionStatus({ status: 'denied', canAskAgain: true })).toBe(
      'undetermined',
    );
  });

  it('denied이고 다시 물을 수도 없으면 denied를 돌려준다', () => {
    expect(toPermissionStatus({ status: 'denied', canAskAgain: false })).toBe(
      'denied',
    );
  });
});
