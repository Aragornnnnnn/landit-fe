// 세션 수준 평가 조회 — 대화 완료 뒤 BE가 비동기로 매긴 영역별 점수와 적용 수준 (백엔드 SessionLevelAssessmentResponse 미러, landit-be #169)
import { api } from '@/shared/api/client';

export type LevelAssessmentProcessingStatus =
  'NOT_REQUESTED' | 'PREPARING' | 'COMPLETED' | 'FAILED';

// score는 1~5 척도(소수 둘째 자리), 관찰이 없으면 null. confidence는 근거 충족 비율
export interface DomainScore {
  score: number | null;
  confidence: number;
}

export type LevelChangeType =
  'INITIALIZED' | 'PROMOTED' | 'UNCHANGED' | 'NOT_APPLIED';

export interface SessionLevelAssessment {
  situationPerformance: DomainScore;
  grammar: DomainScore;
  vocabulary: DomainScore;
  discourse: DomainScore;
  interactionPragmatics: DomainScore;
  assessedScore: number | null;
  assessedLevel: number | null;
  sufficientEvidence: boolean;
  source: 'MODEL' | 'FALLBACK';
  changeType: LevelChangeType;
  previousLevel: number | null;
  currentLevel: number | null;
  // 측정값이 없으면 당시 적용 수준 또는 기본값 3 — 확정 표시용으로는 쓰지 않는다
  displayLevel: number;
  details: { strength: string | null; improvement: string | null } | null;
  assessmentVersion: string;
}

export interface SessionLevelAssessmentResponse {
  sessionId: number;
  processingStatus: LevelAssessmentProcessingStatus;
  // PREPARING·NOT_REQUESTED·FAILED면 null
  levelAssessment: SessionLevelAssessment | null;
}

export const getLevelAssessment = (sessionId: number) =>
  api.get<SessionLevelAssessmentResponse>(
    `/api/v1/sessions/${sessionId}/level-assessment`,
  );
