// 답변 재전송 규칙 — 끊기면 같은 답변을 다시 보내고, 서버가 아직 만드는 중이면 기다렸다 받는다.
// 같은 답변(같은 발화 식별자·같은 문장)이라 서버는 몇 번을 받아도 한 번만 처리하고 만든 응답을 돌려준다
import { ApiError } from '@/shared/api/api-error';

// 연결이 끊긴 뒤 다시 보내기까지 기다리는 시간 — 와이파이↔LTE 전환은 보통 이 안에 끝난다
const RESEND_DELAYS_MS = [1000, 3000];
// 서버가 아직 대답을 만드는 중일 때 다시 묻는 간격
const IN_PROGRESS_POLL_MS = 2000;
// 처음 실패부터 이만큼 지나면 멈추고 유저에게 넘긴다 — 상대가 말없이 있는 게 길어지면 멈춘 앱처럼 보인다
const RESEND_DEADLINE_MS = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 응답을 못 받았는가(연결 끊김), 서버가 아직 처리 중인가(같은 답변을 다른 요청이 처리 중), 그 밖의 거절인가
const classify = (error: unknown) => {
  if (!(error instanceof ApiError)) return 'disconnected';
  if (error.status === 409 && error.code === 'CONFLICT') return 'in_progress';
  return 'rejected';
};

/** 같은 답변을 규칙대로 다시 보낸다. 받으면 응답을, 멈추면 마지막 실패를 던진다 */
export const sendWithResend = async <T>(
  send: () => Promise<T>,
  { isCancelled = () => false }: { isCancelled?: () => boolean } = {},
): Promise<T> => {
  let failure: unknown;
  try {
    return await send();
  } catch (error) {
    failure = error;
  }
  const failedAt = Date.now();
  let resends = 0;
  for (;;) {
    const kind = classify(failure);
    if (kind === 'rejected') throw failure;
    if (kind === 'disconnected' && resends >= RESEND_DELAYS_MS.length) {
      throw failure;
    }
    const delay =
      kind === 'disconnected' ? RESEND_DELAYS_MS[resends] : IN_PROGRESS_POLL_MS;
    if (Date.now() - failedAt + delay > RESEND_DEADLINE_MS) throw failure;
    await wait(delay);
    if (isCancelled()) throw failure;
    if (kind === 'disconnected') resends += 1;
    try {
      return await send();
    } catch (error) {
      failure = error;
    }
  }
};
