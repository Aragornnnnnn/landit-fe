// "이 기기에서 본 적 있는가"를 localStorage 키 하나로 기록한다 — 첫 안내·코치마크처럼 한 번만 보여줄 것들이 쓴다.
// 저장소를 못 쓰면(비공개 모드 등) 안 본 것으로 물러선다 — 안내가 한 번 더 보일 뿐 막히진 않는다
export const seenFlag = (key: string) => ({
  has: () => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
  mark: () => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      // 저장 실패는 무시한다 — 다음에 한 번 더 보이는 게 전부다
    }
  },
});
