// 브릿지 메시지 파싱·직렬화 검증 — 특히 optional 필드는 구버전 앱 셸과의 하위호환 약속이다
import { describe, expect, it } from 'vitest';

import type { WebToNativeMessage } from './messages';
import {
  parseNativeToWebMessage,
  parseWebToNativeMessage,
  serializeBridgeMessage,
} from './serialization';

describe('parseNativeToWebMessage', () => {
  it('직렬화한 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'SOCIAL_LOGIN_SUCCESS',
      provider: 'apple',
      idToken: 'token',
      nonce: 'nonce',
      nickname: '김준서',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('구버전 셸 메시지도 허용한다 — nickname·cancelled 없는 메시지 (하위호환)', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'SOCIAL_LOGIN_SUCCESS',
          provider: 'kakao',
          idToken: 'token',
          nonce: 'nonce',
        }),
      ),
    ).not.toBeNull();

    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_ERROR', message: '실패' }),
      ),
    ).not.toBeNull();
  });

  it('규격 밖 메시지는 null을 돌려준다', () => {
    // 필수 필드 누락
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_SUCCESS', provider: 'apple' }),
      ),
    ).toBeNull();
    // 모르는 type
    expect(
      parseNativeToWebMessage(JSON.stringify({ type: 'UNKNOWN' })),
    ).toBeNull();
    // JSON이 아닌 문자열, 문자열이 아닌 값
    expect(parseNativeToWebMessage('not-json')).toBeNull();
    expect(parseNativeToWebMessage(123)).toBeNull();
  });
});

describe('parseWebToNativeMessage', () => {
  it('지원하는 provider의 로그인 요청만 허용한다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'google' }),
      ),
    ).toEqual({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'google' });

    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'naver' }),
      ),
    ).toBeNull();
  });

  it('정의된 패턴의 햅틱 요청만 허용한다', () => {
    const message = { type: 'HAPTIC', pattern: 'success' } as const;
    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );

    // 규격 밖 패턴은 버린다
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'HAPTIC', pattern: 'explode' }),
      ),
    ).toBeNull();
  });

  it('설정 열기 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'OPEN_SETTINGS' } as const;
    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('리마인더 동기화 요청을 그대로 되돌린다 (round-trip)', () => {
    const message: WebToNativeMessage = {
      type: 'SYNC_REMINDERS',
      reminders: [
        {
          notifyAt: '2026-07-29T20:00:00+09:00',
          title: '오늘의 시나리오',
          body: '카페에서 주문하기가 기다리고 있어요',
          url: '/home',
        },
      ],
    };

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('리마인더가 하나도 없으면 빈 배열로 동기화한다 (전체 해제)', () => {
    const message: WebToNativeMessage = {
      type: 'SYNC_REMINDERS',
      reminders: [],
    };

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('notifyAt에 시간대 오프셋이 없으면 버린다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_REMINDERS',
          reminders: [
            {
              notifyAt: '2026-07-29T20:00:00',
              title: '오늘의 시나리오',
              body: '본문',
              url: '/home',
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it.each([['title'], ['body'], ['url']])(
    '리마인더의 %s가 빈 문자열이면 버린다',
    (field) => {
      const reminder = {
        notifyAt: '2026-07-29T20:00:00+09:00',
        title: '제목',
        body: '본문',
        url: '/home',
        [field]: '',
      };

      expect(
        parseWebToNativeMessage(
          JSON.stringify({ type: 'SYNC_REMINDERS', reminders: [reminder] }),
        ),
      ).toBeNull();
    },
  );

  it('알림 권한 조회 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'GET_NOTIFICATION_PERMISSION' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('알림 권한 능동 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'REQUEST_NOTIFICATION_PERMISSION' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });
});

describe('parseWebToNativeMessage — 위젯', () => {
  it('위젯 데이터 동기화 요청을 그대로 되돌린다 (round-trip)', () => {
    const message: WebToNativeMessage = {
      type: 'SYNC_WIDGET_DATA',
      data: {
        streak: 5,
        todayDone: false,
        lastCompletedDate: '2026-08-24',
        todayCardTitle: '룸메이트와 첫인사',
        weeklyDone: [true, true, false, true, true, true, false],
        capturedOn: '2026-08-25',
      },
    };

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('한 번도 완료한 적 없는 유저는 완료 날짜와 카드 제목이 null일 수 있다', () => {
    const message: WebToNativeMessage = {
      type: 'SYNC_WIDGET_DATA',
      data: {
        streak: 0,
        todayDone: false,
        lastCompletedDate: null,
        todayCardTitle: null,
        weeklyDone: [false, false, false, false, false, false, false],
        capturedOn: null,
      },
    };

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('주간 완료 배열이 7개가 아니면 버린다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_WIDGET_DATA',
          data: {
            streak: 5,
            todayDone: false,
            lastCompletedDate: '2026-08-24',
            todayCardTitle: '룸메이트와 첫인사',
            weeklyDone: [true, false],
            capturedOn: '2026-08-25',
          },
        }),
      ),
    ).toBeNull();
  });

  it('스트릭이 음수거나 정수가 아니면 버린다', () => {
    const base = {
      todayDone: false,
      lastCompletedDate: '2026-08-24',
      todayCardTitle: '룸메이트와 첫인사',
      weeklyDone: [true, true, false, true, true, true, false],
      capturedOn: '2026-08-25',
    };

    for (const streak of [-1, 1.5]) {
      expect(
        parseWebToNativeMessage(
          JSON.stringify({
            type: 'SYNC_WIDGET_DATA',
            data: { ...base, streak },
          }),
        ),
      ).toBeNull();
    }
  });

  it('완료 날짜가 yyyy-MM-dd 형식이 아니면 버린다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_WIDGET_DATA',
          data: {
            streak: 5,
            todayDone: false,
            lastCompletedDate: '2026-08-24T00:00:00+09:00',
            todayCardTitle: null,
            weeklyDone: [true, true, false, true, true, true, false],
            capturedOn: '2026-08-25',
          },
        }),
      ),
    ).toBeNull();
  });

  it('형식은 맞아도 달력에 없는 날짜면 버린다 — 경과 일수 계산이 어긋난다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_WIDGET_DATA',
          data: {
            streak: 5,
            todayDone: false,
            lastCompletedDate: '2026-02-31',
            todayCardTitle: null,
            weeklyDone: [true, true, false, true, true, true, false],
            capturedOn: '2026-08-25',
          },
        }),
      ),
    ).toBeNull();
  });

  it('기준 날짜가 달력에 없는 날이면 버린다 — 주간 창 경과 계산이 어긋난다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_WIDGET_DATA',
          data: {
            streak: 5,
            todayDone: false,
            lastCompletedDate: '2026-08-24',
            todayCardTitle: null,
            weeklyDone: [true, true, false, true, true, true, false],
            capturedOn: '2026-02-31',
          },
        }),
      ),
    ).toBeNull();
  });

  it('기준 날짜가 아예 없으면(구 페이로드) 버린다 — 낡음 판정이 불가능하다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({
          type: 'SYNC_WIDGET_DATA',
          data: {
            streak: 5,
            todayDone: false,
            lastCompletedDate: '2026-08-24',
            todayCardTitle: null,
            weeklyDone: [true, true, false, true, true, true, false],
          },
        }),
      ),
    ).toBeNull();
  });
});

describe('parseNativeToWebMessage — 알림', () => {
  it('알림 권한 상태 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'NOTIFICATION_PERMISSION',
      status: 'granted',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('규격 밖 권한 상태 값이면 버린다', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'NOTIFICATION_PERMISSION', status: 'blocked' }),
      ),
    ).toBeNull();
  });

  it('푸시 토큰 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'PUSH_TOKEN',
      token: 'ExponentPushToken[abc]',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('빈 토큰이면 버린다', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'PUSH_TOKEN', token: '' }),
      ),
    ).toBeNull();
  });

  it('이동 요청 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'NAVIGATE',
      url: '/expressions?from=push',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('이동 경로가 빈 문자열이면 버린다', () => {
    expect(
      parseNativeToWebMessage(JSON.stringify({ type: 'NAVIGATE', url: '' })),
    ).toBeNull();
  });
});
