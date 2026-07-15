// NPS(서비스 만족도) 제출 — 점수와 선택 의견을 백엔드에 저장 (백엔드 NpsSubmitRequest 미러)
import { api } from '@/shared/api/client';

export type NpsScore = 1 | 2 | 3 | 4 | 5;

export interface NpsSubmitRequest {
  score: NpsScore;
  opinionText?: string | null;
}

// 빈 의견은 null로 넘긴다 — 공백만 남은 텍스트를 의견으로 저장하지 않는다
export const submitNps = (score: NpsScore, opinionText?: string) => {
  const trimmed = opinionText?.trim();
  return api.post<void>('/api/v1/nps', {
    score,
    opinionText: trimmed ? trimmed : null,
  });
};
