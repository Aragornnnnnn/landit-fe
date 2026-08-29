// 표현 학습 시작 조회 — 대표 질문·정답 문장·단어뱅크 (백엔드 ExpressionLearningResponse 미러)
import { api } from '@/shared/api/client';

export interface ExpressionLearning {
  expressionId: number;
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  representativeQuestionText: string | null;
  representativeQuestionTranslation: string | null;
  representativeSentenceText: string;
  representativeSentenceTranslation: string;
  // 정답 예문을 단어 단위로 나눈 배열(정답 순서)과, 정답+오답을 섞은 선택지 배열(BE 저장 순서)
  representativeSentenceWords: string[];
  representativeSentenceWordChoices: string[];
  representativeImageUrl: string | null;
  // 대표 예문 원어민 TTS URL — null이면 발음 자산 미구축(또는 튜터 미설정)이라 발음 스텝을 숨긴다
  representativeSentenceAudioUrl: string | null;
  // 표현만 읽는 원어민 TTS URL — 음원은 자산 파이프라인에 이미 있고 BE 노출 요청 중(명세 targetExpressionAudioUrl).
  // 아직 응답에 없으므로 옵셔널, 없으면 문장 음원으로 폴백한다
  targetExpressionAudioUrl?: string | null;
}

export const getExpressionLearning = (expressionId: number) =>
  api.get<ExpressionLearning>(
    `/api/v1/expressions/${expressionId}/learning-start`,
  );
