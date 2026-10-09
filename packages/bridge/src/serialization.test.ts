// 브릿지 메시지 파싱·직렬화 검증 — 특히 optional 필드는 구버전 앱 셸과의 하위호환 약속이다
import { describe, expect, it } from 'vitest';

import type { NativeToWebMessage, WebToNativeMessage } from './messages';
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

  it('공유 요청을 그대로 되돌린다 (round-trip)', () => {
    const message: WebToNativeMessage = {
      type: 'SHARE',
      message: '같이 해요\nhttps://example.com/download',
    };
    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('공유 문구가 비어 있으면 거른다 — 빈 공유 시트가 뜨지 않게', () => {
    expect(
      parseWebToNativeMessage(JSON.stringify({ type: 'SHARE', message: '' })),
    ).toBeNull();
  });

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
  it('위젯 핀 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'REQUEST_WIDGET_PIN' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('홈 화면으로 내리기 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'GO_HOME' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('위젯 데이터 동기화 요청을 그대로 되돌린다 (round-trip)', () => {
    const message: WebToNativeMessage = {
      type: 'SYNC_WIDGET_DATA',
      data: {
        streak: 5,
        todayDone: false,
        lastCompletedDate: '2026-08-24',
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

describe('위젯 설치·삭제 메시지', () => {
  it('웹의 위젯 변경 요청은 페이로드 없이 오간다 (round-trip)', () => {
    const message = { type: 'REQUEST_WIDGET_CHANGES' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('위젯 변경 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'WIDGET_CHANGED',
      change: 'added',
      family: 'small',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('규격 밖 변경 종류나 크기면 버린다', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'WIDGET_CHANGED',
          change: 'resized',
          family: 'small',
        }),
      ),
    ).toBeNull();
    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'WIDGET_CHANGED',
          change: 'added',
          family: 'xl',
        }),
      ),
    ).toBeNull();
  });
});

describe('parseWebToNativeMessage — 결제', () => {
  it('로그인 사용자 식별 요청을 그대로 되돌린다 (round-trip)', () => {
    const message = { type: 'IDENTIFY', userId: '42' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('로그아웃은 userId null로 보낸다 — 셸이 익명으로 되돌린다', () => {
    const message = { type: 'IDENTIFY', userId: null } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('userId가 문자열이 아니면 버린다 — RevenueCat app_user_id는 문자열이다', () => {
    expect(
      parseWebToNativeMessage(JSON.stringify({ type: 'IDENTIFY', userId: 42 })),
    ).toBeNull();
  });

  it('오퍼링 조회와 구매 복원 요청을 그대로 되돌린다 (round-trip)', () => {
    for (const message of [
      { type: 'GET_OFFERINGS' },
      { type: 'RESTORE_PURCHASES' },
    ] as const) {
      expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
        message,
      );
    }
  });

  it('결제 요청은 패키지 id를 싣는다 (round-trip)', () => {
    const message = { type: 'PURCHASE', packageId: '$rc_annual' } as const;

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('패키지 id가 비면 버린다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'PURCHASE', packageId: '' }),
      ),
    ).toBeNull();
  });
});

describe('parseNativeToWebMessage — 결제', () => {
  it('오퍼링 응답을 그대로 되돌린다 (round-trip)', () => {
    const message: NativeToWebMessage = {
      type: 'OFFERINGS',
      packages: [
        {
          id: '$rc_monthly',
          plan: 'monthly',
          price: 9900,
          currency: 'KRW',
          period: 'P1M',
        },
        {
          id: 'annual_discount',
          plan: null,
          price: 58500,
          currency: 'KRW',
          period: 'P1Y',
        },
      ],
    };

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('period를 보내지 않는 구버전 셸의 응답은 period를 null로 채워 받는다', () => {
    const legacy = JSON.stringify({
      type: 'OFFERINGS',
      packages: [
        { id: '$rc_annual', plan: 'yearly', price: 59900, currency: 'KRW' },
      ],
    });

    expect(parseNativeToWebMessage(legacy)).toEqual({
      type: 'OFFERINGS',
      packages: [
        {
          id: '$rc_annual',
          plan: 'yearly',
          price: 59900,
          currency: 'KRW',
          period: null,
        },
      ],
    });
  });

  it('패키지의 plan이 월간·연간 밖이거나 가격이 음수면 버린다', () => {
    const base = { id: '$rc_weekly', price: 1000, currency: 'KRW' };

    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'OFFERINGS',
          packages: [{ ...base, plan: 'weekly' }],
        }),
      ),
    ).toBeNull();
    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'OFFERINGS',
          packages: [{ ...base, plan: 'monthly', price: -1 }],
        }),
      ),
    ).toBeNull();
  });

  it('결제 결과는 성공·취소·실패 세 가지이고 실패엔 사유가 붙을 수 있다 (round-trip)', () => {
    for (const message of [
      { type: 'PURCHASE_RESULT', status: 'success' },
      { type: 'PURCHASE_RESULT', status: 'cancelled' },
      { type: 'PURCHASE_RESULT', status: 'error', message: '스토어 연결 실패' },
    ] as const) {
      expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
        message,
      );
    }
  });

  it('규격 밖 결제 상태는 버린다', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'PURCHASE_RESULT', status: 'pending' }),
      ),
    ).toBeNull();
  });

  it('복원 결과는 성공·실패뿐이다 — 복원엔 취소가 없다', () => {
    const message = { type: 'RESTORE_RESULT', status: 'success' } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'RESTORE_RESULT', status: 'cancelled' }),
      ),
    ).toBeNull();
  });
});

describe('사진 고르기 (PICK_PHOTOS ↔ PHOTOS_PICKED)', () => {
  it('한 번에 3장을 넘게 달라는 요청은 버린다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'PICK_PHOTOS', limit: 4 }),
      ),
    ).toBeNull();
  });

  it('3장을 넘게 실은 회신은 버린다', () => {
    const photo = { base64: 'AAAA', mimeType: 'image/jpeg' };

    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'PHOTOS_PICKED',
          status: 'success',
          photos: [photo, photo, photo, photo],
          failedCount: 0,
          overflowed: false,
        }),
      ),
    ).toBeNull();
  });
});

describe('알람 (SET_ALARM·SKIP_ALARM_TODAY·TEST_ALARM·OPEN_ALARM_SETTINGS ↔ ALARM_STATUS)', () => {
  const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];
  const alarm = {
    title: '오늘의 시나리오 할 시간!',
    schedules: [{ hour: 19, minute: 0, weekdays: EVERY_DAY }],
    path: '/scenario',
  };
  const status: Extract<NativeToWebMessage, { type: 'ALARM_STATUS' }> = {
    type: 'ALARM_STATUS',
    supported: true,
    permission: 'granted',
    exactAlarm: true,
    fullScreen: true,
    notifications: true,
    repeatingAlarms: [],
  };
  const parseSet = (body: object) =>
    parseWebToNativeMessage(JSON.stringify({ type: 'SET_ALARM', ...body }));

  it('요일마다 시각이 다른 알람 요청도 받는다 — 나중에 요일별 시각을 열어도 계약은 그대로', () => {
    const message: WebToNativeMessage = {
      type: 'SET_ALARM',
      alarmType: 'scenario',
      alarm: {
        ...alarm,
        schedules: [
          { hour: 7, minute: 0, weekdays: [1, 2, 3, 4, 5] },
          { hour: 10, minute: 30, weekdays: [6, 7] },
        ],
      },
    };

    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('alarm이 null이면 그 종류의 알람을 끄는 요청으로 받는다', () => {
    expect(parseSet({ alarmType: 'scenario', alarm: null })).toEqual({
      type: 'SET_ALARM',
      alarmType: 'scenario',
      alarm: null,
    });
  });

  it.each([
    [
      '시가 24',
      { ...alarm, schedules: [{ hour: 24, minute: 0, weekdays: EVERY_DAY }] },
    ],
    [
      '분이 60',
      { ...alarm, schedules: [{ hour: 7, minute: 60, weekdays: EVERY_DAY }] },
    ],
    [
      '요일이 0',
      { ...alarm, schedules: [{ hour: 7, minute: 0, weekdays: [0] }] },
    ],
    [
      '요일이 8',
      { ...alarm, schedules: [{ hour: 7, minute: 0, weekdays: [8] }] },
    ],
    [
      '한 스케줄 안에서 요일이 겹침',
      { ...alarm, schedules: [{ hour: 7, minute: 0, weekdays: [1, 1] }] },
    ],
    [
      '요일이 비어 있음',
      { ...alarm, schedules: [{ hour: 7, minute: 0, weekdays: [] }] },
    ],
    ['스케줄이 없음', { ...alarm, schedules: [] }],
    [
      '두 스케줄의 요일이 겹침',
      {
        ...alarm,
        schedules: [
          { hour: 7, minute: 0, weekdays: [1, 2] },
          { hour: 9, minute: 0, weekdays: [2, 3] },
        ],
      },
    ],
    ['제목이 빈 문자열', { ...alarm, title: '' }],
    ['열 화면이 없음', { ...alarm, path: undefined }],
    ['열 화면이 바깥 주소', { ...alarm, path: 'https://example.com' }],
    ['열 화면이 //로 시작', { ...alarm, path: '//example.com' }],
    ['열 화면이 /로 시작하지 않음', { ...alarm, path: 'scenario' }],
  ])('%s인 알람 요청은 버린다', (_, bad) => {
    expect(parseSet({ alarmType: 'scenario', alarm: bad })).toBeNull();
  });

  it('모르는 종류의 알람 요청은 버린다', () => {
    expect(parseSet({ alarmType: 'review', alarm })).toBeNull();
  });

  it('오늘 건너뛰기는 알람의 종류를 실어야 받는다', () => {
    const parse = (body: object) =>
      parseWebToNativeMessage(
        JSON.stringify({ type: 'SKIP_ALARM_TODAY', ...body }),
      );

    expect(parse({ alarmType: 'scenario' })).not.toBeNull();
    expect(parse({})).toBeNull();
  });

  it('테스트 알람은 5초~10분 뒤만 받는다', () => {
    const parse = (delaySeconds: number) =>
      parseWebToNativeMessage(
        JSON.stringify({ type: 'TEST_ALARM', delaySeconds, title: '테스트' }),
      );

    expect(parse(5)).not.toBeNull();
    expect(parse(600)).not.toBeNull();
    expect(parse(4)).toBeNull();
    expect(parse(601)).toBeNull();
  });

  it('설정 화면 바로 가기는 정확한 알람·전체 화면 알림 둘만 받는다', () => {
    const parse = (target: string) =>
      parseWebToNativeMessage(
        JSON.stringify({ type: 'OPEN_ALARM_SETTINGS', target }),
      );

    expect(parse('exactAlarm')).not.toBeNull();
    expect(parse('fullScreen')).not.toBeNull();
    expect(parse('battery')).toBeNull();
  });

  it('건너뛴 날짜가 YYYY-MM-DD 모양이 아니면 상태 회신을 버린다', () => {
    const withSkipDate = (skipDate: string) =>
      parseNativeToWebMessage(
        JSON.stringify({
          ...status,
          repeatingAlarms: [
            {
              alarmType: 'scenario',
              schedules: [{ hour: 7, minute: 30, weekdays: EVERY_DAY }],
              path: '/scenario',
              skipDate,
            },
          ],
        }),
      );

    expect(withSkipDate('2026-10-07')).not.toBeNull();
    expect(withSkipDate('invalid')).toBeNull();
    expect(withSkipDate('2026-10-7')).toBeNull();
  });

  it('알람 버튼으로 열렸다는 신호는 앱 안 경로만 받는다 — 웹이 지금 화면을 보고 이동할지 정한다', () => {
    const parse = (path: string) =>
      parseNativeToWebMessage(
        JSON.stringify({ type: 'ALARM_OPENED', alarmType: 'scenario', path }),
      );

    expect(parse('/scenario')).toEqual({
      type: 'ALARM_OPENED',
      alarmType: 'scenario',
      path: '/scenario',
    });
    expect(parse('https://example.com')).toBeNull();
    expect(parse('//example.com')).toBeNull();
  });
});

describe('알람 목록 (GET_ALARM_LIST ↔ ALARM_LIST)', () => {
  it('1회 알람은 요일 없이도 목록에 싣는다 — 반복 알람과 달리 빈 요일을 받는다', () => {
    const message: NativeToWebMessage = {
      type: 'ALARM_LIST',
      alarms: [
        {
          id: 'a',
          alarmType: 'scenario',
          hour: 7,
          minute: 30,
          weekdays: [1, 2, 4, 5, 6, 7],
          nextAt: 1791447000000,
          skipDate: '2026-10-07',
        },
        {
          id: 'b',
          alarmType: null,
          hour: 23,
          minute: 41,
          weekdays: [],
          nextAt: null,
          skipDate: null,
        },
      ],
    };

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });
});
