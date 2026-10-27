// 스몰톡이 끝난 자리의 두 숫자 — 말한 시간과 주고받은 말을 화면 언어대로 적는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { TalkSummary } from './TalkSummary';

afterEach(cleanup);

describe('TalkSummary', () => {
  it('한국어 화면은 "2분 41초"와 "12개"로 적는다', () => {
    render(<TalkSummary speakingDurationMs={161_000} exchangeCount={12} />);

    expect(screen.getByText('2분 41초')).toBeInTheDocument();
    expect(screen.getByText('12개')).toBeInTheDocument();
  });

  it('일본어 화면은 단위 사이를 띄우지 않고 "2分41秒"와 "12回"로 적는다', () => {
    // Given 일본어 화면
    setTestLocale('ja');

    // When 대화 결과를 그리면
    render(<TalkSummary speakingDurationMs={161_000} exchangeCount={12} />);

    // Then 라벨과 숫자 모두 일본어다
    expect(screen.getByText('話した時間')).toBeInTheDocument();
    expect(screen.getByText('2分41秒')).toBeInTheDocument();
    expect(screen.getByText('12回')).toBeInTheDocument();
  });
});
