// 지난 스몰톡 한 줄을 이루는 값들 — 언제 했고, 얼마나 얘기했고, 표현을 얼마나 배웠는지
import { toDayLabel } from '@/shared/lib/day-label';

// 제목은 서버가 대화 내용에서 뽑는다. 못 뽑았으면 날짜가 그 자리를 대신한다
export const toSessionTitle = (
  title: string | null,
  completedAt: string,
): string => title ?? `${toDayLabel(completedAt)}의 대화`;
