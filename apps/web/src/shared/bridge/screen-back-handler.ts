// 화면이 맡은 네이티브 뒤로가기 처리 스택 — 나가기 전에 정리할 것이 있는 화면(대화 등)이 히스토리 이동 대신 자기 처리를 걸어 둔다
type HandleBack = () => void;

const stack: HandleBack[] = [];

// 화면이 뜰 때 등록하고, 떠나면 해제한다
export const registerScreenBack = (handle: HandleBack) => {
  stack.push(handle);
  return () => {
    const index = stack.indexOf(handle);
    if (index >= 0) stack.splice(index, 1);
  };
};

// 맡은 화면이 있으면 최상단의 처리를 부르고 true — 뒤로가기를 여기서 소비한다
export const runScreenBack = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
};
