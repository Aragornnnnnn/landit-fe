// 이 편지를 읽음으로 알려야 하는가 — 알릴 필요가 없는 두 경우를 여기서 가른다
import type { LetterDetail } from '../api/letter-detail';

export const needsReadMark = (letter: LetterDetail) =>
  // 내가 보낸 편지에는 읽음이라는 개념이 없다. 실서버에선 이 요청이 4xx로 돌아온다
  letter.kind !== 'FEEDBACK' &&
  // 이미 읽은 편지를 다시 열 때마다 알리면 미읽음 조회 캐시까지 매번 무효화된다
  !letter.read;
