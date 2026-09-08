// 수준 평가 결과의 화면 변환 계약 — 100점 환산, 강점·보완 태그, 결과를 보여줘도 되는지
import { describe, expect, it } from 'vitest';

import type { SessionLevelAssessment } from '../api/level-assessment';
import {
  isUsableAssessment,
  LEVEL_NAMES,
  toHundred,
  toLevelResult,
} from './level-assessment';

const domain = (score: number | null) => ({ score, confidence: 0.9 });

const base: SessionLevelAssessment = {
  situationPerformance: domain(4.1),
  grammar: domain(2.7),
  vocabulary: domain(3.55),
  discourse: domain(3.3),
  interactionPragmatics: domain(2.9),
  assessedScore: 3.4,
  assessedLevel: 3,
  sufficientEvidence: true,
  source: 'MODEL',
  changeType: 'INITIALIZED',
  previousLevel: null,
  currentLevel: 3,
  displayLevel: 3,
  details: { strength: null, improvement: null },
  assessmentVersion: 'v1',
};

describe('toHundred', () => {
  it('1~5 척도를 100점으로 환산해 반올림한다 — 4.1은 82, 2.7은 54', () => {
    expect(toHundred(4.1)).toBe(82);
    expect(toHundred(2.7)).toBe(54);
    expect(toHundred(5)).toBe(100);
  });
});

describe('isUsableAssessment', () => {
  it('모델 결과이고 근거가 충분하며 수준이 매겨졌을 때만 참이다', () => {
    expect(isUsableAssessment(base)).toBe(true);
  });

  it('FALLBACK이거나 근거가 부족하거나 수준이 없으면 거짓이다 — displayLevel 기본값을 레벨로 보여주지 않는다', () => {
    expect(isUsableAssessment({ ...base, source: 'FALLBACK' })).toBe(false);
    expect(isUsableAssessment({ ...base, sufficientEvidence: false })).toBe(
      false,
    );
    expect(isUsableAssessment({ ...base, assessedLevel: null })).toBe(false);
    expect(isUsableAssessment(null)).toBe(false);
  });
});

describe('toLevelResult', () => {
  it('레벨 이름과 종합 점수, 영역 다섯 줄을 시안 순서로 만든다', () => {
    const result = toLevelResult(base);

    expect(result.level).toBe(3);
    expect(result.name).toBe(LEVEL_NAMES[3]);
    expect(result.overall).toBe(68);
    expect(result.rows.map((row) => row.label)).toEqual([
      '상황 수행 능력',
      '문법',
      '어휘',
      '대화 구성',
      '상호 작용 및 활용',
    ]);
    expect(result.rows.map((row) => row.score)).toEqual([82, 54, 71, 66, 58]);
  });

  it('가장 높은 영역이 강점, 가장 낮은 영역이 보완이다', () => {
    const result = toLevelResult(base);

    expect(result.rows.find((row) => row.tag === 'strength')?.label).toBe(
      '상황 수행 능력',
    );
    expect(result.rows.find((row) => row.tag === 'improvement')?.label).toBe(
      '문법',
    );
  });

  it('관찰이 없는 영역은 줄에서 뺀다', () => {
    const result = toLevelResult({ ...base, vocabulary: domain(null) });

    expect(result.rows).toHaveLength(4);
    expect(result.rows.some((row) => row.key === 'vocabulary')).toBe(false);
  });

  it('점수가 전부 같으면 강점·보완 태그를 달지 않는다', () => {
    const flat = {
      ...base,
      situationPerformance: domain(3),
      grammar: domain(3),
      vocabulary: domain(3),
      discourse: domain(3),
      interactionPragmatics: domain(3),
    };

    expect(toLevelResult(flat).rows.every((row) => row.tag === null)).toBe(
      true,
    );
  });
});
