// MarkdownBody — 깃허브 코멘트처럼 그린다는 약속과, 유저가 쓴 글이라 지켜야 하는 안전 규칙
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownBody } from './MarkdownBody';

afterEach(cleanup);

describe('MarkdownBody', () => {
  it('마크다운 문법이 없는 평문은 그대로 보여준다', () => {
    render(<MarkdownBody text="로그인이 자꾸 풀려요." />);

    expect(screen.getByText('로그인이 자꾸 풀려요.')).toBeTruthy();
  });

  it('엔터 한 번도 줄바꿈으로 그린다 — 빈 줄 없이 이어 써도 붙지 않는다', () => {
    const { container } = render(<MarkdownBody text={'첫 줄\n둘째 줄'} />);

    expect(container.querySelector('br')).not.toBeNull();
  });

  it('[글자](주소)를 링크로 그린다', () => {
    render(<MarkdownBody text="[랜딧](https://landit.im)" />);

    expect(
      screen.getByRole('link', { name: '랜딧' }).getAttribute('href'),
    ).toBe('https://landit.im');
  });

  it('주소만 붙여넣어도 링크가 된다', () => {
    render(<MarkdownBody text="여기요 https://landit.im 보세요" />);

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      'https://landit.im',
    );
  });

  it('| 로 나눈 줄을 표로 그린다', () => {
    render(
      <MarkdownBody
        text={'| 기기 | 결과 |\n| --- | --- |\n| iPhone | 풀림 |'}
      />,
    );

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '기기' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: '풀림' })).toBeTruthy();
  });

  it('- [x]와 - [ ]를 체크된·안 된 체크박스로 그린다', () => {
    render(<MarkdownBody text={'- [x] 재설치 해봄\n- [ ] 로그아웃 해봄'} />);

    const [done, todo] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(done.checked).toBe(true);
    expect(todo.checked).toBe(false);
  });

  it('![설명](주소)를 이미지로 그린다', () => {
    render(<MarkdownBody text="![캡처](https://img.landit.im/a.png)" />);

    expect(screen.getByRole('img', { name: '캡처' }).getAttribute('src')).toBe(
      'https://img.landit.im/a.png',
    );
  });

  it('javascript: 주소는 링크로 만들지 않는다', () => {
    render(<MarkdownBody text="[눌러봐](javascript:alert(1))" />);

    expect(screen.getByText('눌러봐').getAttribute('href') ?? '').not.toContain(
      'javascript',
    );
  });

  it('본문에 적은 HTML 태그는 실행하지 않고 글자 그대로 보여준다', () => {
    const { container } = render(
      <MarkdownBody
        text={'줄바꿈은 <br> 로 되나요? <script>alert(1)</script>'}
      />,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('줄바꿈은 <br> 로 되나요?');
  });
});
