// 환급 화면의 틀 — 아래 버튼 자리가 필요할 때만 생기는지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RefundFrame } from './RefundFrame';

afterEach(cleanup);

describe('RefundFrame', () => {
  it('아래 버튼을 주면 그 자리에 놓는다', () => {
    render(
      <RefundFrame onBack={() => {}} footer={<button>신청</button>}>
        본문
      </RefundFrame>,
    );

    expect(screen.getByRole('contentinfo')).toContainElement(
      screen.getByRole('button', { name: '신청' }),
    );
  });

  it.each([[null], [undefined]])(
    '아래 버튼이 없으면(%s) 자리도 두지 않는다',
    (footer) => {
      render(
        <RefundFrame onBack={() => {}} footer={footer}>
          본문
        </RefundFrame>,
      );

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    },
  );
});
