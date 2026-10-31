// 롤플레이 입력 — 내 역할·상대 역할·상황 세 칸. 셋 다 채워야 시나리오를 만들 수 있다
export interface RoleplayDraft {
  myRole: string;
  partnerRole: string;
  situation: string;
}

export const EMPTY_DRAFT: RoleplayDraft = {
  myRole: '',
  partnerRole: '',
  situation: '',
};

/** 세 칸이 모두 찼는가. 공백만 친 칸은 빈 칸이다 */
export const isDraftReady = (draft: RoleplayDraft) =>
  [draft.myRole, draft.partnerRole, draft.situation].every(
    (value) => value.trim() !== '',
  );
