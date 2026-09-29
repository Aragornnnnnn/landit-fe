// 피드백 사진 첨부 규칙 — 몇 장까지 담고, 넘치게 고르면 어떻게 자르는지
/** 한 통에 붙일 수 있는 사진 수. 서버 제한과 같다 */
export const MAX_ATTACHMENTS = 3;

/** 남은 칸만큼 앞에서부터 채운다. 고른 순서가 곧 사용자가 먼저 보여주고 싶은 순서라 뒤를 버린다 */
export const takeAttachable = <T>(attachedCount: number, picked: T[]) => {
  const room = Math.max(MAX_ATTACHMENTS - attachedCount, 0);
  return {
    taken: picked.slice(0, room),
    overflowed: picked.length > room,
  };
};
