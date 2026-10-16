// 열려 있는 바텀시트·모달의 닫기 콜백 스택 — 네이티브 뒤로가기와 Escape가 화면 이동 대신 최상단 하나만 닫게 한다
type CloseSheet = () => void;

const stack: CloseSheet[] = [];

// 한글 조합 중의 Escape는 조합 취소다 — 시트까지 닫지 않는다
const closeTopOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !event.isComposing) closeTopSheet();
};

// 시트가 열릴 때 등록하고, 닫히거나 언마운트되면 해제한다. 열린 게 하나라도 있는 동안만 Escape를 듣는다
export const registerOpenSheet = (close: CloseSheet) => {
  if (stack.length === 0) window.addEventListener('keydown', closeTopOnEscape);
  stack.push(close);
  return () => {
    const index = stack.indexOf(close);
    if (index >= 0) stack.splice(index, 1);
    if (stack.length === 0)
      window.removeEventListener('keydown', closeTopOnEscape);
  };
};

// 열린 시트가 있으면 최상단을 닫고 true — 뒤로가기를 여기서 소비한다
export const closeTopSheet = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
};
