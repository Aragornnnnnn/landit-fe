// LetterBlocks — 문단 블록은 마크다운으로 그린다. 문법별 동작은 MarkdownBody 테스트가 맡고 여기선 연결만 본다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LetterBlocks } from './LetterBlocks';

afterEach(cleanup);

describe('LetterBlocks', () => {
  it('문단 블록의 마크다운 링크를 링크로 그린다', () => {
    render(
      <LetterBlocks
        blocks={[
          { type: 'PARAGRAPH', text: '[릴리즈 노트](https://landit.im/notes)' },
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: '릴리즈 노트' }).getAttribute('href'),
    ).toBe('https://landit.im/notes');
  });
});
