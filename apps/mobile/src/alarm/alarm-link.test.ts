// 알람 링크 — 알람 버튼으로 열린 링크만 알아보고 어느 알람인지 꺼낸다
import { redirectSystemPath } from '../app/+native-intent';
import { ALARM_LAUNCH_URI, alarmIdFromLink } from './alarm-link';

describe('alarmIdFromLink', () => {
  it('라이브러리가 id를 끼운 알람 링크에서 알람 id를 꺼낸다', () => {
    const url = ALARM_LAUNCH_URI.replace('{alarmId}', 'a1b2-c3');

    expect(alarmIdFromLink(url)).toBe('a1b2-c3');
  });

  it('스킴 뒤 슬래시가 하나여도 알아본다', () => {
    expect(alarmIdFromLink('landit:/alarm?alarmId=x')).toBe('x');
  });

  it.each([
    ['위젯 링크', 'landit://widget'],
    ['비슷한 이름의 경로', 'landit://alarms?alarmId=x'],
    ['알람 id가 없는 알람 링크', 'landit://alarm'],
    ['링크 없음', null],
  ])('%s면 null이다', (_, url) => {
    expect(alarmIdFromLink(url)).toBeNull();
  });
});

describe('redirectSystemPath', () => {
  it('알람 링크로는 라우터 화면을 바꾸지 않는다 — 셸이 받아 웹에 넘긴다', () => {
    expect(
      redirectSystemPath({ path: 'landit://alarm?alarmId=x', initial: true }),
    ).toBeNull();
  });
});
