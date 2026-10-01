// 피드백 사진 첨부 규칙 — 몇 장까지 담고, 넘치게 고르면 어떻게 자르는지, 얼마나 크면 막고, 못 보냈을 때 뭐라고 하는지
import { ApiError } from '@/shared/api/api-error';

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

/**
 * 한 번에 보낼 수 있는 사진 합계. 서버는 10MiB까지 받지만 웹이 거치는 Vercel 프록시가
 * 요청 한 번에 약 5MB를 넘으면 끊는다(실측) — 여유를 두고 그 아래로 잡는다
 */
export const MAX_SEND_BYTES = 4_500_000;

/** 사진 합계가 보낼 수 있는 한도를 넘는가 — 사진을 구울 때 장당 크기를 맞추므로 드문 경우다 */
export const exceedsSendLimit = (files: { size: number }[]) =>
  files.reduce((total, file) => total + file.size, 0) > MAX_SEND_BYTES;

const RETRY_LATER = '보내지 못했어요. 잠시 후 다시 시도해 주세요.';
export const TOO_LARGE =
  '사진 용량이 너무 커요. 한 장을 빼고 다시 보내 주세요.';

/**
 * 전송 실패를 사용자에게 할 말로 바꾼다.
 * 사진 때문에 거부됐으면 다시 시도해도 같으니 사진을 바꾸거나 빼라고 한다
 */
export const sendFailureMessage = (error: unknown, imageCount: number) => {
  if (imageCount === 0 || !(error instanceof ApiError)) return RETRY_LATER;
  if (error.status === 400 && error.code === 'VALIDATION_FAILED') {
    return '보낼 수 없는 사진이 있어요. 다른 사진으로 바꿔 주세요.';
  }
  // 413은 서버가, 502는 앞단 프록시가 큰 요청을 끊을 때 온다
  if (error.status === 413 || error.status === 502) return TOO_LARGE;
  return RETRY_LATER;
};
