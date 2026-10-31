// 결제자 설문 라우트 — 한국어 화면이면 결제자 설문을, 아니면 내 정보로 돌려보낸다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaidSurveyPage from './page';

const locale = vi.hoisted(() => ({ current: 'ko' }));
vi.mock('next-intl/server', () => ({ getLocale: async () => locale.current }));
const redirect = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/features/survey/ui/SurveyFlow', () => ({ SurveyFlow: () => null }));

beforeEach(() => {
  redirect.mockClear();
});

describe('PaidSurveyPage', () => {
  it('한국어 화면이면 결제자 설문을 그린다', async () => {
    locale.current = 'ko';

    const page = await PaidSurveyPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(page.props).toEqual({ kind: 'paid' });
  });

  it('일본어 화면이면 내 정보로 돌려보낸다', async () => {
    locale.current = 'ja';

    await PaidSurveyPage();

    expect(redirect).toHaveBeenCalledWith('/me');
  });
});
