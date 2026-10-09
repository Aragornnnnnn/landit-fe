// 앱이 열릴 때 알람 정리 — 버튼으로 연 알람을 찾는 일을 지난 건너뛰기 되돌리기보다 먼저 끝낸다
import { reportWarning } from '@/monitoring/report';

import { alarmEntryOf, restoreSkippedDay } from './alarm';
import { stopRingingIfOpenedByAlarm } from './stop-ringing';
import { tidyUpOnOpen } from './useAlarmOpen';

jest.mock('./alarm', () => ({
  alarmEntryOf: jest.fn(),
  restoreSkippedDay: jest.fn(),
}));
jest.mock('./stop-ringing', () => ({
  stopRingingIfOpenedByAlarm: jest.fn(),
  onAlarmButtonPressed: jest.fn(),
}));
jest.mock('@/monitoring/report', () => ({ reportWarning: jest.fn() }));

const entryOf = jest.mocked(alarmEntryOf);
const restore = jest.mocked(restoreSkippedDay);
const stopRinging = jest.mocked(stopRingingIfOpenedByAlarm);

const ENTRY = { alarmType: 'scenario' as const, path: '/scenario' };

beforeEach(() => {
  jest.resetAllMocks();
  restore.mockResolvedValue(undefined);
});

describe('tidyUpOnOpen', () => {
  it('버튼으로 연 알람의 갈 화면을 찾은 뒤에 되돌린다 — 되돌리기가 다시 걸면 알람 id가 바뀌어 못 찾는다', async () => {
    stopRinging.mockResolvedValue('d');
    entryOf.mockResolvedValue(ENTRY);

    expect(await tidyUpOnOpen()).toEqual(ENTRY);
    expect(entryOf).toHaveBeenCalledWith('d');
    expect(entryOf.mock.invocationCallOrder[0]).toBeLessThan(
      restore.mock.invocationCallOrder[0],
    );
  });

  it('버튼으로 연 게 아니면 찾지 않고 되돌리기만 한다', async () => {
    stopRinging.mockResolvedValue(null);

    expect(await tidyUpOnOpen()).toBeNull();
    expect(entryOf).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalled();
  });

  it('되돌리기가 실패해도 갈 화면은 돌려주고 warning으로 남긴다', async () => {
    stopRinging.mockResolvedValue('d');
    entryOf.mockResolvedValue(ENTRY);
    restore.mockRejectedValue(new Error('denied'));

    expect(await tidyUpOnOpen()).toEqual(ENTRY);
    expect(reportWarning).toHaveBeenCalled();
  });

  it('울림 끄기가 실패해도 되돌리기는 한다', async () => {
    stopRinging.mockRejectedValue(new Error('gone'));

    await expect(tidyUpOnOpen()).rejects.toThrow('gone');
    expect(restore).toHaveBeenCalled();
  });
});
