// 화면이 안드로이드 뒤로가기를 직접 받는 등록 스택 — 뒤로 버튼·X가 있는 화면은 뒤로가기도 같은 동작을 하게 한다
type BackPressHandler = () => void;

const stack: BackPressHandler[] = [];

// 화면이 뜰 때 등록하고, 사라지면 해제한다
export const registerBackPress = (handler: BackPressHandler) => {
  stack.push(handler);
  return () => {
    const index = stack.indexOf(handler);
    if (index >= 0) stack.splice(index, 1);
  };
};

// 맨 나중에 등록한 화면 하나만 부르고 true. 등록한 화면이 없으면 false
export const runBackPress = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
};
