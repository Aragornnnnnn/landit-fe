// 공유 시트 열기 — 시트가 뜨는 사이 같은 요청이 또 와도 한 번만 연다
import { Share } from 'react-native';

import { openShareSheet } from './share';

describe('openShareSheet', () => {
  it('시트가 닫히기 전에 다시 요청하면 한 번만 연다', async () => {
    let close = () => {};
    const shareSpy = jest.spyOn(Share, 'share').mockReturnValue(
      new Promise((resolve) => {
        close = () => resolve({ action: Share.dismissedAction });
      }),
    );

    const first = openShareSheet('같이 해요');
    await openShareSheet('같이 해요');
    close();
    await first;

    expect(shareSpy).toHaveBeenCalledTimes(1);
  });

  it('시트가 닫힌 뒤에는 다시 열 수 있다', async () => {
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });

    await openShareSheet('같이 해요');
    await openShareSheet('같이 해요');

    expect(shareSpy).toHaveBeenCalledTimes(2);
  });

  it('시트 열기가 실패해도 다음 요청은 연다', async () => {
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockRejectedValueOnce(new Error('present 실패'))
      .mockResolvedValue({ action: Share.dismissedAction });

    await expect(openShareSheet('같이 해요')).rejects.toThrow('present 실패');
    await openShareSheet('같이 해요');

    expect(shareSpy).toHaveBeenCalledTimes(2);
  });
});
