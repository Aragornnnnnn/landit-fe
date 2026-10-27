// 테스트 화면 언어 도구 — 기본은 한국어, setTestLocale로 그 테스트만 일본어로 렌더되는지 검증
import { render, screen } from '@testing-library/react';
import { useLocale, useTranslations } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { localeFromDocument } from './locale';
import { setTestLocale } from './test-locale';

const CloseLabel = () => {
  const t = useTranslations('common');
  return (
    <p>
      {useLocale()}:{t('closeLabel')}
    </p>
  );
};

describe('setTestLocale', () => {
  it('부르면 그 테스트는 일본어 문구와 일본어 화면 언어로 렌더된다', () => {
    setTestLocale('ja');

    render(<CloseLabel />);

    expect(screen.getByText('ja:閉じる')).toBeInTheDocument();
    expect(localeFromDocument()).toBe('ja');
  });

  it('다음 테스트는 다시 한국어로 시작한다', () => {
    render(<CloseLabel />);

    expect(screen.getByText('ko:닫기')).toBeInTheDocument();
    expect(localeFromDocument()).toBe('ko');
  });
});
