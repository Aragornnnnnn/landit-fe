// SurveyMenuEntry — 설문 메뉴는 한국어 화면에서만 보인다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { SurveyMenuEntry } from './SurveyMenuEntry';

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다
vi.mock('next/link', () => ({
  default: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

describe('SurveyMenuEntry', () => {
  it('한국어 화면이면 설문 메뉴를 보여 준다', () => {
    render(<SurveyMenuEntry />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/survey');
  });

  it('일본어 화면이면 설문 메뉴를 그리지 않는다', () => {
    setTestLocale('ja');

    render(<SurveyMenuEntry />);

    expect(screen.queryByRole('link')).toBeNull();
  });
});
