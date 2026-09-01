// "이 기기에서 본 적 있는가"를 localStorage 키 하나로 기록한다 — 첫 안내·코치마크처럼 한 번만 보여줄 것들이 쓴다.
// 저장소를 못 쓰면(비공개 모드 등) 안 본 것으로 물러선다 — 안내가 한 번 더 보일 뿐 막히진 않는다
export const seenFlag = (key: string) => {
  // 한 화면이 기록한 걸 다른 화면이 바로 알아야 할 때가 있다 (스몰톡에서 인사를 들으면 탭 칩의 점이 사라진다).
  // localStorage는 같은 문서 안에서 바뀐 걸 알려 주지 않으므로 mark()가 직접 알린다
  const watchers = new Set<() => void>();

  return {
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
      watchers.forEach((notify) => notify());
    },
    subscribe: (onChange: () => void) => {
      watchers.add(onChange);
      return () => {
        watchers.delete(onChange);
      };
    },
  };
};

export type SeenFlag = ReturnType<typeof seenFlag>;
