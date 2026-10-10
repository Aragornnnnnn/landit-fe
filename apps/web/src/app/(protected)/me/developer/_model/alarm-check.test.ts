// 알람 점검 화면 — 테스트 알람이 실제로 울릴 시각과 걸린 알람의 다음 울림을 사람 말로 옮긴다
import { describe, expect, it } from 'vitest';

import { describeNextRing, testAlarmChoices } from './alarm-check';

const at = (time: string) => new Date(`2026-10-07T${time}`);

describe('testAlarmChoices', () => {
  it('다음 정각 분부터 1·2·3분째 정각에 울린다 — iOS는 분 단위로만 걸려 초를 맞출 수 없다', () => {
    const choices = testAlarmChoices(at('23:40:05'));

    expect(choices.map((choice) => choice.at)).toEqual([
      at('23:41:00'),
      at('23:42:00'),
      at('23:43:00'),
    ]);
    expect(choices[0].delaySeconds).toBe(55);
  });

  it('다음 정각 분까지 20초도 안 남았으면 그다음 분부터 — 누르고 화면을 잠글 틈을 둔다', () => {
    expect(testAlarmChoices(at('23:40:45'))[0].at).toEqual(at('23:42:00'));
  });
});

describe('describeNextRing', () => {
  const now = at('10:00:00');

  it.each([
    [at('19:30:00').getTime(), '오늘 오후 7:30에 울려요'],
    [new Date('2026-10-08T07:05:00').getTime(), '내일 오전 7:05에 울려요'],
    [
      new Date('2026-10-10T19:30:00').getTime(),
      '10월 10일(토) 오후 7:30에 울려요',
    ],
    [null, '이미 울렸어요'],
  ])('%s → %s', (nextAt, text) => {
    expect(describeNextRing(nextAt, now)).toBe(text);
  });
});
