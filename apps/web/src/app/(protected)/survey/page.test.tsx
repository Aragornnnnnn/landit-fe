// 설문 라우트 — 한국어 화면이 아니면 문항을 그리지 않고 내 정보로 돌려보낸다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SurveyPage from './page';

const locale = vi.hoisted(() => ({ current: 'ko' }));
vi.mock('next-intl/server', () => ({ getLocale: async () => locale.current }));
const redirect = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/features/survey/ui/SurveyFlow', () => ({ SurveyFlow: () => null }));

beforeEach(() => {
  redirect.mockClear();
});

describe('SurveyPage', () => {
  it('한국어 화면이면 설문을 그린다', async () => {
    locale.current = 'ko';

    await SurveyPage();

    expect(redirect).not.toHaveBeenCalled();
  });

  it('일본어 화면이면 내 정보로 돌려보낸다', async () => {
    locale.current = 'ja';

    await SurveyPage();

    expect(redirect).toHaveBeenCalledWith('/me');
  });
});
