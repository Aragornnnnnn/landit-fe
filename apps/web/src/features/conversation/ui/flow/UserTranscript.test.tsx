// UserTranscript — 듣는 중 점(물결)이 언제 보이고 언제 사라지는지 검증한다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UserTranscript } from './UserTranscript';

afterEach(() => cleanup());

const countDots = (container: HTMLElement) =>
  container.querySelectorAll('.animate-listening-wave').length;

describe('UserTranscript', () => {
  it('아직 아무 말도 확정되지 않았으면 듣는 중 표시로 점이 보인다', () => {
    const { container } = render(
      <UserTranscript text="" phase="USER_SPEAKING" speechPending={false} />,
    );

    expect(countDots(container)).toBe(3);
  });

  it('확정 전 말이 남아 있으면 글자 뒤에 점이 보인다', () => {
    const { container } = render(
      <UserTranscript
        text="I went to the park"
        phase="USER_SPEAKING"
        speechPending
      />,
    );

    expect(countDots(container)).toBe(3);
  });

  it('말한 것이 모두 확정되면 점이 사라진다', () => {
    const { container } = render(
      <UserTranscript
        text="I went to the park"
        phase="USER_SPEAKING"
        speechPending={false}
      />,
    );

    expect(countDots(container)).toBe(0);
  });

  it('듣는 중이 아니면 점이 보이지 않는다', () => {
    const { container } = render(
      <UserTranscript text="" phase="AI_THINKING" speechPending />,
    );

    expect(countDots(container)).toBe(0);
  });
});
