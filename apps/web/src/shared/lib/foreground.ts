// 앱이 다시 앞으로 왔을 때를 듣는다 — 설정 화면에 다녀온 뒤 상태를 다시 물을 때 쓴다

/** 화면이 다시 보일 때마다 부른다. 돌려준 함수를 부르면 듣기를 멈춘다 */
export const listenForeground = (onForeground: () => void) => {
  const notify = () => {
    if (document.visibilityState === 'visible') onForeground();
  };
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
};
