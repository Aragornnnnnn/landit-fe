// 대화가 끝난 자리의 통계 — 전부 타이핑한 대화면 말한 시간 칸을 빼고 주고받은 말만 남긴다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TalkSummary } from './TalkSummary';

afterEach(cleanup);

describe('TalkSummary', () => {
  it('말한 시간과 주고받은 말을 나란히 보여 준다', () => {
    render(<TalkSummary speakingDurationMs={161_000} exchangeCount={6} />);

    expect(screen.getByText('2분 41초')).toBeInTheDocument();
    expect(screen.getByText('6개')).toBeInTheDocument();
  });

  it('전부 타이핑해 0초면 말한 시간 칸을 뺀다', () => {
    render(<TalkSummary speakingDurationMs={0} exchangeCount={6} />);

    expect(screen.queryByText('말한 시간')).toBeNull();
    expect(screen.getByText('6개')).toBeInTheDocument();
  });
});
