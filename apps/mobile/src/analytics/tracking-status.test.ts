// ATT 결과 보관소의 계약 — 결정 전엔 기다렸다 답하고, 권한창을 띄운 사실은 실행당 한 번만 알린다
import { createTrackingStatus } from './tracking-status';

describe('createTrackingStatus', () => {
  it('결정되기 전에 물으면 결정될 때까지 기다렸다 답한다', async () => {
    const tracking = createTrackingStatus();
    let answer: unknown = 'pending';

    const reading = tracking.read().then((value) => {
      answer = value;
    });
    await Promise.resolve();
    expect(answer).toBe('pending');

    tracking.settle({ status: 'granted', prompted: true });
    await reading;
    expect(answer).toEqual({ status: 'granted', prompted: true });
  });

  it('권한창을 띄운 사실은 처음 물었을 때만 알리고 이후엔 상태만 답한다', async () => {
    const tracking = createTrackingStatus();
    tracking.settle({ status: 'denied', prompted: true });
    await tracking.read();

    const second = await tracking.read();

    expect(second).toEqual({ status: 'denied', prompted: false });
  });

  it('결과를 못 얻었으면(Android·실패) null로 답한다', async () => {
    const tracking = createTrackingStatus();

    tracking.settle(null);

    await expect(tracking.read()).resolves.toBeNull();
  });

  it('한 번 정해진 결과는 다시 정해도 바뀌지 않는다', async () => {
    const tracking = createTrackingStatus();
    tracking.settle({ status: 'granted', prompted: false });

    tracking.settle(null);

    await expect(tracking.read()).resolves.toEqual({
      status: 'granted',
      prompted: false,
    });
  });
});
