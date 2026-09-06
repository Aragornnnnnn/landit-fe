// SurveyLetterCta — 설문 안내 편지에서만 그리고, 누르면 설문으로 가며 탭을 계측한다
import { EVENTS } from '@landit/analytics';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { SurveyLetterCta } from './SurveyLetterCta';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SURVEY_LETTER_ID', '5');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('SurveyLetterCta', () => {
  it('설문 안내 편지가 아니면 아무것도 그리지 않는다', () => {
    render(<SurveyLetterCta letterId={4} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('버튼을 누르면 어느 편지에서 눌렀는지 계측하고 설문으로 간다', async () => {
    render(<SurveyLetterCta letterId={5} />);

    await userEvent.click(
      screen.getByRole('button', { name: /설문하고 이용권 받기/ }),
    );

    expect(track).toHaveBeenCalledWith(EVENTS.SURVEY_INVITE_TAPPED, {
      letter_id: 5,
    });
    expect(push).toHaveBeenCalledWith('/survey');
  });
});
