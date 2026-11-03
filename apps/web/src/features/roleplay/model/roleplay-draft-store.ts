// 페이월에 다녀오는 동안 적던 시나리오를 맡아 둔다 — 화면을 떠나면 입력이 사라져서 세션 저장소에 잠시 둔다
import type { RoleplayDraft } from './roleplay-draft';

const KEY = 'landit-roleplay-draft';

export const saveRoleplayDraft = (draft: RoleplayDraft) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // 못 맡기면 빈 칸으로 돌아올 뿐이다
  }
};

export const readRoleplayDraft = (): RoleplayDraft | null => {
  try {
    const saved = sessionStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as RoleplayDraft) : null;
  } catch {
    return null;
  }
};

/** 되살린 뒤 지운다 — 다음에 새로 만들 때 옛 글이 다시 나오지 않게 */
export const clearRoleplayDraft = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 이번 입력엔 영향이 없다
  }
};
