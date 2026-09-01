// 발음 평가 요청 — 발화 녹음을 올려 단어별 판정을 받는다 (백엔드 PronunciationAnalysisResponse 미러)
import { api } from '@/shared/api/client';

export type PronunciationWordStatus =
  'CORRECT' | 'PHONEME_ERROR' | 'STRESS_ERROR';

export interface PronunciationWord {
  order: number;
  word: string;
  status: PronunciationWordStatus;
  // 사용자 녹음에서 이 단어가 들린 구간(ms) — 내 발음 다시 듣기에 쓴다
  startTimeMs: number | null;
  endTimeMs: number | null;
  // 아래는 오류 단어만 채워진다 — CORRECT는 전부 null
  nativeWordAudioUrl: string | null;
  // respelling 비교(PHONEME_ERROR만) — span은 각 표기에서 빨강 처리할 부분
  nativeDisplay: string | null;
  userDisplay: string | null;
  errorTargetSpan: string | null;
  errorUserSpan: string | null;
  // 음절 분해와 강세 위치(STRESS_ERROR만) — stressIndex 원어민, userStressIndex 사용자
  syllables: string[] | null;
  stressIndex: number | null;
  userStressIndex: number | null;
  coachingText: string | null;
}

export interface PronunciationAnalysis {
  // 0~100. 정상 단어 수 / 전체 단어 수 비율 반올림
  score: number;
  // 오류 단어가 0개면 true
  passed: boolean;
  // order 오름차순. 퀴즈 배열과 토큰화가 다를 수 있어 화면은 이 배열 기준으로 그린다
  words: PronunciationWord[];
}

/**
 * 발화 녹음을 올려 문장 발음 분석 결과(점수·단어별 판정)를 받는다.
 *
 * @param filename 업로드 파일명 — BE가 확장자로 형식을 검증하므로 recording-format이 정한 값을 그대로 넘긴다
 * @throws ApiError 404(발음 데이터 없음) · 400 INVALID_AUDIO(녹음 판독 불가) 등
 */
export const postPronunciationAnalysis = (
  expressionId: number,
  audio: Blob,
  filename: string,
) => {
  const form = new FormData();
  form.append('audio', audio, filename);
  return api.post<PronunciationAnalysis>(
    `/api/v1/expressions/${expressionId}/pronunciation/sentence-analysis`,
    form,
  );
};
