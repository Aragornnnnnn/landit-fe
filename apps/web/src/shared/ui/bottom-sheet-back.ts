// 열려 있는 바텀시트의 닫기 콜백 스택 — 네이티브 뒤로가기가 화면 이동 대신 최상단 시트를 닫게 한다
type CloseSheet = () => void;

const stack: CloseSheet[] = [];

// 시트가 열릴 때 등록하고, 닫히거나 언마운트되면 해제한다
export const registerOpenSheet = (close: CloseSheet) => {
  stack.push(close);
  return () => {
    const index = stack.indexOf(close);
    if (index >= 0) stack.splice(index, 1);
  };
};

// 열린 시트가 있으면 최상단을 닫고 true — 뒤로가기를 여기서 소비한다
export const closeTopSheet = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
};
