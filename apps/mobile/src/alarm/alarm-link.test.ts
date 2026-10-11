// 알람 링크 — 알람 버튼으로 열린 링크만 알아보고, 링크에 실린 알람 종류와 갈 화면을 꺼낸다
import { redirectSystemPath } from '../app/+native-intent';
import { alarmEntryFromLink, alarmLaunchUri } from './alarm-link';

describe('alarmEntryFromLink', () => {
  it('알람을 걸 때 만든 링크에서 종류와 갈 화면을 꺼낸다 — 라이브러리가 뒤에 붙이는 alarmId는 무시한다', () => {
    const url = `${alarmLaunchUri('scenario', '/scenario?tab=today')}&alarmId=a1`;

    expect(alarmEntryFromLink(url)).toEqual({
      alarmType: 'scenario',
      path: '/scenario?tab=today',
    });
  });

  it('스킴 뒤 슬래시가 하나여도 알아본다', () => {
    expect(
      alarmEntryFromLink('landit:/alarm?type=scenario&path=%2Fscenario'),
    ).toEqual({ alarmType: 'scenario', path: '/scenario' });
  });

  it.each([
    ['위젯 링크', 'landit://widget'],
    ['비슷한 이름의 경로', 'landit://alarms?type=scenario&path=%2Fscenario'],
    ['모르는 알람 종류', 'landit://alarm?type=review&path=%2Fscenario'],
    ['갈 화면이 없는 링크', 'landit://alarm?type=scenario'],
    ['앱 밖 주소', 'landit://alarm?type=scenario&path=%2F%2Fexample.com'],
    // 풀 수 없는 글자 — 그냥 두면 에러가 이벤트 밖으로 새어 앱이 꺼진다
    ['깨진 글자', 'landit://alarm?type=scenario&path=%E0'],
    ['링크 없음', null],
  ])('%s면 null이다', (_, url) => {
    expect(alarmEntryFromLink(url)).toBeNull();
  });
});

describe('redirectSystemPath', () => {
  it('알람 링크로는 라우터 화면을 바꾸지 않는다 — 셸이 받아 웹에 넘긴다', () => {
    expect(
      redirectSystemPath({
        path: 'landit://alarm?type=scenario&path=%2Fscenario',
        initial: true,
      }),
    ).toBeNull();
  });
});
