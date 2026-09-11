// "이 기기에서 본 적 있는가"를 localStorage 키 하나로 기록한다 — 첫 안내·코치마크처럼 한 번만 보여줄 것들이 쓴다.
// 저장소를 못 쓰면(비공개 모드 등) 안 본 것으로 물러선다 — 안내가 한 번 더 보일 뿐 막히진 않는다
export interface SeenFlag {
  has: () => boolean;
  mark: () => void;
  subscribe: (onChange: () => void) => () => void;
  clear: () => void;
}

// 만든 깃발을 모아 둔다 — 전부 계정 경험 기록(첫 안내·코치마크·설문)이라 탈퇴 때 한 번에 지운다
const flags = new Set<SeenFlag>();

export const seenFlag = (key: string): SeenFlag => {
  // 한 화면이 기록한 걸 다른 화면이 바로 알아야 할 때가 있다 (스몰톡에서 인사를 들으면 탭 칩의 점이 사라진다).
  // localStorage는 같은 문서 안에서 바뀐 걸 알려 주지 않으므로 mark()가 직접 알린다
  const watchers = new Set<() => void>();

  const flag = {
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
    clear: () => {
      try {
        localStorage.removeItem(key);
      } catch {
        // 지우지 못해도 다음 가입자가 안내를 한 번 덜 볼 뿐이다
      }
      watchers.forEach((notify) => notify());
    },
  };
  flags.add(flag);
  return flag;
};

/** 이 기기에 남은 깃발을 전부 내린다 — 탈퇴 뒤 다시 가입한 사람이 첫 안내를 새로 만나게 */
export const clearSeenFlags = () => {
  flags.forEach((flag) => flag.clear());
};
