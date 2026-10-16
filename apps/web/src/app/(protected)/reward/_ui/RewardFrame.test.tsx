// 환급 화면의 틀 — 아래 버튼 자리가 필요할 때만 생기는지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RewardFrame } from './RewardFrame';

afterEach(cleanup);

describe('RewardFrame', () => {
  it('아래 버튼을 주면 그 자리에 놓는다', () => {
    render(
      <RewardFrame onBack={() => {}} footer={<button>신청</button>}>
        본문
      </RewardFrame>,
    );

    expect(screen.getByRole('contentinfo')).toContainElement(
      screen.getByRole('button', { name: '신청' }),
    );
  });

  it.each([[null], [undefined]])(
    '아래 버튼이 없으면(%s) 자리도 두지 않는다',
    (footer) => {
      render(
        <RewardFrame onBack={() => {}} footer={footer}>
          본문
        </RewardFrame>,
      );

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    },
  );

  it('아래 버튼이 없으면 본문이 하단 safe-area만큼 띄워진다', () => {
    // given
    render(<RewardFrame onBack={() => {}}>본문</RewardFrame>);

    // then
    expect(screen.getByText('본문').className).toContain(
      '--safe-area-inset-bottom',
    );
  });
});
