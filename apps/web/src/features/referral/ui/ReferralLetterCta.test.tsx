// ReferralLetterCta — 친구 초대 안내 편지에서만 그리고, 누르면 친구 초대 이벤트 화면으로 가며 탭을 계측한다
import { EVENTS } from '@landit/analytics';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';

import { ReferralLetterCta } from './ReferralLetterCta';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_REFERRAL_LETTER_ID', '9');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('ReferralLetterCta', () => {
  it('친구 초대 안내 편지가 아니면 아무것도 그리지 않는다', () => {
    render(<ReferralLetterCta letterId={8} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('누르면 어느 편지에서 눌렀는지 계측하고 친구 초대 이벤트 화면으로 간다', async () => {
    render(<ReferralLetterCta letterId={9} />);

    await userEvent.click(
      screen.getByRole('button', { name: /친구에게 공유하기/ }),
    );

    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_LETTER_TAPPED, {
      letter_id: 9,
    });
    expect(push).toHaveBeenCalledWith(REFERRAL_INVITE_PATH);
  });
});
