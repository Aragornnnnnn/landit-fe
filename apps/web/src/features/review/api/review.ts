// 푸시 복습 — 상태 조회·시작·답안 제출 (백엔드 ReviewResponse 미러)
// 알림에 담긴 복습 id로만 접근한다. 생성·목록 API는 없다
import type { WritingSentence } from '@/features/expression/api/practice';
import { api } from '@/shared/api/client';

// READY=시작 전, IN_PROGRESS=진행 중, COMPLETED=모든 문제가 끝남(맞힌 개수와 무관), EXPIRED=기한 지남
export type ReviewStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface ReviewQuestion {
  questionId: string;
  expressionId: number;
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  // 출제 스냅샷 — 표현학습의 작문 문제와 같은 형태다(EN/KR, 단어뱅크 포함)
  quiz: WritingSentence;
  displayOrder: number;
  queueOrder: number;
  wrongCount: number;
  // 이 문제가 끝난 시각 — 정답 또는 두 번째 오답에서 찍힌다. 맞혔다는 뜻이 아니라
  // 끝났다는 뜻이고, 맞혔는지는 wrongCount가 가른다 (review-progress의 isSolved)
  completedAt: string | null;
}

export interface Review {
  reviewId: string;
  status: ReviewStatus;
  availableUntil: string;
  // 시작 후 진행 기한 — 시작 전에는 null
  expiresAt: string | null;
  completedAt: string | null;
  // 지금 풀 문제 — 시작 전·완료·만료면 null. 끝난 문제를 빼고 서버가 순서를 정한다
  currentQuestionId: string | null;
  // 최초 출제 순서 고정. 시작 전·만료면 빈 배열
  questions: ReviewQuestion[];
}

export interface ReviewAnswer {
  // 같은 시도의 재전송을 서버가 같은 판정으로 처리하는 멱등 키
  submissionId: string;
  questionId: string;
  words: string[];
}

export interface ReviewAnswerResult {
  correct: boolean;
  review: Review;
}

export const getReview = (reviewId: string) =>
  api.get<Review>(`/api/v1/reviews/${reviewId}`);

export const startReview = (reviewId: string) =>
  api.post<Review>(`/api/v1/reviews/${reviewId}/start`);

export const submitReviewAnswer = (reviewId: string, answer: ReviewAnswer) =>
  api.post<ReviewAnswerResult>(`/api/v1/reviews/${reviewId}/answers`, answer);
