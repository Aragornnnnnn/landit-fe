// 영역별 점수 차트 — 꼭짓점이 셋 이상이면 레이더, 그보다 적으면 목록, 없으면 아무것도 안 그린다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DomainRow } from '@/features/feedback/model/level-assessment';

import { ScoreChart } from './ScoreChart';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const row = (
  key: DomainRow['key'],
  label: string,
  score: number,
): DomainRow => ({
  key,
  label,
  shortLabel: label,
  score,
});
const five: DomainRow[] = [
  row('situationPerformance', '상황 수행', 82),
  row('grammar', '문법', 54),
  row('vocabulary', '어휘', 71),
  row('discourse', '대화 구성', 66),
  row('interactionPragmatics', '상호 작용', 58),
];

afterEach(() => cleanup());

describe('ScoreChart', () => {
  it('영역이 셋 이상이면 레이더 그림 하나로 그리고 점수를 읽어 준다', () => {
    render(<ScoreChart rows={five} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      '영역별 점수. 상황 수행 82점, 문법 54점, 어휘 71점, 대화 구성 66점, 상호 작용 58점',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('영역이 둘뿐이면 도형 대신 점수 목록으로 보여준다', () => {
    render(<ScoreChart rows={five.slice(0, 2)} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('상황 수행')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('관찰된 영역이 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<ScoreChart rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
