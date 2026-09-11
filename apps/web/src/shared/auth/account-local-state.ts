// 탈퇴하면 이 기기에 남은 계정 경험 기록을 지운다 — 다시 가입한 사람이 첫 램프·첫 안내·코치마크를 새로 만나게.
// 기기 설정(진동)은 계정이 아니라 기기의 것이라 남긴다. 로그인 정보는 clearAuth가 따로 지운다
const STORAGE_PREFIX = 'landit-';
const KEEP = new Set(['landit-auth', 'landit-haptics-off']);

export const clearAccountLocalState = () => {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    );
    for (const key of keys) {
      if (key && key.startsWith(STORAGE_PREFIX) && !KEEP.has(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다
  }
};
