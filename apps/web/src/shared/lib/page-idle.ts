// 첫 화면을 다 받은 뒤 쉬는 틈에 할 일을 미룬다 — 첫 화면에 꼭 필요 없는 SDK(계측·에러 수집)가 그림과 대역을 다투지 않게

// 바쁜 화면·일부 웹뷰에선 쉬는 틈이 계속 안 와서, 이만큼 지나면 쉬는 틈을 기다리지 않고 부른다
const IDLE_TIMEOUT_MS = 2000;

/**
 * load가 끝난 뒤(이미 끝났으면 바로) 다음 쉬는 틈에 한 번 부른다. 사파리는 requestIdleCallback이 없어 setTimeout으로 대신한다.
 * 돌려준 함수로 취소하면 아직 안 불렀을 때 부르지 않는다
 */
export const afterPageLoadIdle = (callback: () => void) => {
  let cancelled = false;
  const run = () => {
    if (!cancelled) callback();
  };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function')
      window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    else setTimeout(run, 1);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener('load', whenIdle);
  };
};
