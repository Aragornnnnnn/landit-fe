// 총평 영역 점수 카드의 상태 계약 — 응답에 실린 평가, 다시 물어 온 평가, 기다림 상한으로 로딩·표시·숨김을 가른다
import { describe, expect, it } from 'vitest';

import type {
  SessionLevelAssessment,
  SessionLevelAssessmentResponse,
} from '../api/level-assessment';
import { decideSummaryLevelCard } from './summary-level-card';

const domain = (score: number | null) => ({ score, confidence: 0.9 });

const assessment: SessionLevelAssessment = {
  situationPerformance: domain(5),
  grammar: domain(1.15),
  vocabulary: domain(0.9),
  discourse: domain(1.2),
  interactionPragmatics: domain(1.1),
  assessedScore: 2,
  assessedLevel: 2,
  sufficientEvidence: true,
  source: 'MODEL',
  changeType: 'INITIALIZED',
  previousLevel: null,
  currentLevel: 2,
  displayLevel: 2,
  details: { strength: '잘했어요', improvement: '상황에 맞는 말을 해 봐요' },
  assessmentVersion: 'v1',
};

const inline = (
  processingStatus: SessionLevelAssessmentResponse['processingStatus'],
  levelAssessment: SessionLevelAssessment | null = null,
): SessionLevelAssessmentResponse => ({
  sessionId: 7,
  processingStatus,
  levelAssessment,
});

const notPolled = { outcome: 'pending' as const, levelAssessment: null };

describe('decideSummaryLevelCard', () => {
  it('응답에 끝난 평가가 실려 오면 시안 이름·순서의 다섯 줄과 개선할 점을 보인다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('COMPLETED', assessment),
      polled: notPolled,
      timedOut: false,
    });

    expect(card).toEqual({
      kind: 'ready',
      rows: [
        { key: 'situationPerformance', label: '상황 대처 능력', score: 100 },
        { key: 'vocabulary', label: '어휘력', score: 18 },
        { key: 'grammar', label: '문법', score: 23 },
        { key: 'discourse', label: '문장 완성도', score: 24 },
        { key: 'interactionPragmatics', label: '대화 매너', score: 22 },
      ],
      improvement: '상황에 맞는 말을 해 봐요',
    });
  });

  it('관찰이 없는 영역은 줄에서 빼고, 개선할 점이 없으면 null로 둔다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('COMPLETED', {
        ...assessment,
        grammar: domain(null),
        details: null,
      }),
      polled: notPolled,
      timedOut: false,
    });

    expect(card.kind === 'ready' && card.rows.map((row) => row.key)).toEqual([
      'situationPerformance',
      'vocabulary',
      'discourse',
      'interactionPragmatics',
    ]);
    expect(card.kind === 'ready' && card.improvement).toBeNull();
  });

  it('응답 때 분석 중이었으면 다시 물어 온 결과가 오기 전까지 로딩이다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('PREPARING'),
      polled: notPolled,
      timedOut: false,
    });

    expect(card).toEqual({ kind: 'loading' });
  });

  it('응답 때 분석 중이었어도 다시 물어 온 결과가 끝났으면 그 결과를 보인다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('PREPARING'),
      polled: { outcome: 'ready', levelAssessment: assessment },
      timedOut: false,
    });

    expect(card.kind).toBe('ready');
  });

  it('기다림 상한을 넘기면 로딩을 거두고 카드를 숨긴다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('NOT_REQUESTED'),
      polled: notPolled,
      timedOut: true,
    });

    expect(card).toEqual({ kind: 'hidden' });
  });

  it('상한이 지난 뒤 늦게 온 결과는 카드를 다시 끼워 넣지 않는다 — 보던 아래 카드가 밀리지 않게', () => {
    const card = decideSummaryLevelCard({
      inline: inline('PREPARING'),
      polled: { outcome: 'ready', levelAssessment: assessment },
      timedOut: true,
    });

    expect(card).toEqual({ kind: 'hidden' });
  });

  it.each([
    ['평가 비활성 세션(null)', null],
    ['필드가 없는 구버전 응답', undefined],
    ['평가 실패', inline('FAILED')],
  ])('%s이면 카드를 숨긴다', (_, value) => {
    const card = decideSummaryLevelCard({
      inline: value,
      polled: notPolled,
      timedOut: false,
    });

    expect(card).toEqual({ kind: 'hidden' });
  });

  it('다시 묻다 실패하면 카드를 숨긴다', () => {
    const card = decideSummaryLevelCard({
      inline: inline('PREPARING'),
      polled: { outcome: 'unavailable', levelAssessment: null },
      timedOut: false,
    });

    expect(card).toEqual({ kind: 'hidden' });
  });

  it('FALLBACK·근거 부족 결과는 기본값으로 채워진 점수라 숨긴다', () => {
    const fallback = decideSummaryLevelCard({
      inline: inline('COMPLETED', { ...assessment, source: 'FALLBACK' }),
      polled: notPolled,
      timedOut: false,
    });
    const thin = decideSummaryLevelCard({
      inline: inline('COMPLETED', { ...assessment, sufficientEvidence: false }),
      polled: notPolled,
      timedOut: false,
    });

    expect(fallback).toEqual({ kind: 'hidden' });
    expect(thin).toEqual({ kind: 'hidden' });
  });
});
