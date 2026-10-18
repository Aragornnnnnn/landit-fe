// 열려 있는 바텀시트·모달의 닫기 콜백 스택 — 네이티브 뒤로가기와 Escape가 화면 이동 대신 최상단 하나만 닫게 한다
type CloseSheet = () => void;

interface OpenLayer {
  close: CloseSheet;
  // false면 닫을 수 없는 층(강제 업데이트 모달) — Escape를 아래로 넘기지 않는다
  dismissible: boolean;
}

const stack: OpenLayer[] = [];

// 한글 조합 중의 Escape는 조합 취소다 — 시트까지 닫지 않는다.
// 누르고 있어 오는 반복 입력은 무시한다 — 겹친 층이 연달아 닫히지 않게
const closeTopOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.isComposing || event.repeat) return;
  if (stack[stack.length - 1]?.dismissible === false) return;
  closeTopSheet();
};

// 시트가 열릴 때 등록하고, 닫히거나 언마운트되면 해제한다. 열린 게 하나라도 있는 동안만 Escape를 듣는다
export const registerOpenSheet = (
  close: CloseSheet,
  { dismissible = true }: { dismissible?: boolean } = {},
) => {
  const layer: OpenLayer = { close, dismissible };
  if (stack.length === 0) window.addEventListener('keydown', closeTopOnEscape);
  stack.push(layer);
  return () => {
    const index = stack.indexOf(layer);
    if (index >= 0) stack.splice(index, 1);
    if (stack.length === 0)
      window.removeEventListener('keydown', closeTopOnEscape);
  };
};

// 닫을 수 있는 층 중 최상단을 닫고 true — 뒤로가기를 여기서 소비한다.
// 닫을 수 없는 층은 건너뛴다 — 뒤로가기는 그 층이 생기기 전과 같게 동작한다
export const closeTopSheet = (): boolean => {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (!stack[i].dismissible) continue;
    stack[i].close();
    return true;
  }
  return false;
};
