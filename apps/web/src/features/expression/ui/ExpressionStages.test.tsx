// 표현 리스트 리빌 문구 검증 — 닉네임 유무와 화면 언어에 따라 결과 문장이 갈린다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { RevealStage } from './ExpressionStages';

afterEach(() => cleanup());

const renderReveal = (nickname: string | null) =>
  render(
    <RevealStage
      count={0}
      nickname={nickname}
      expressions={null}
      onSelect={vi.fn()}
      onLearn={vi.fn()}
    />,
  );

describe('RevealStage', () => {
  it('찾은 표현이 없으면 닉네임을 불러 준비했다고 말한다', () => {
    renderReveal('준서');

    expect(
      screen.getByText('준서님을 위한 표현을 준비했어요'),
    ).toBeInTheDocument();
  });

  it('닉네임이 없으면 회원님으로 부른다', () => {
    renderReveal(null);

    expect(
      screen.getByText('회원님을 위한 표현을 준비했어요'),
    ).toBeInTheDocument();
  });

  it('일본어 화면에서는 닉네임 뒤에 さん을 붙인다', () => {
    setTestLocale('ja');

    renderReveal('Junseo');

    expect(screen.getByText(/Junseoさん/)).toBeInTheDocument();
  });
});
