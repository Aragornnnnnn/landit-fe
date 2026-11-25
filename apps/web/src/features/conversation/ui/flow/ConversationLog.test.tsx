// ConversationLog — 지난 대화를 쌓고, 지난 대화를 보는 중엔 끌어 내리지 않고 「최신 대화로」 알약을 띄우는 계약을 검증한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LogEntry } from '../../model/conversation-log';
import { ConversationLog } from './ConversationLog';

afterEach(() => cleanup());

const entries: LogEntry[] = [
  { id: 0, speaker: 'PARTNER', text: 'Where do you live?' },
  { id: 1, speaker: 'ME', text: 'I live in Seoul.' },
];

// jsdom엔 레이아웃이 없다 — 칸 높이 300, 내용 높이 1000, 새 말풍선 위끝 900으로 심어 둔다
const layOut = () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(900);
  Element.prototype.scrollTo = vi.fn();
};

const renderLog = (latestKey: number) =>
  render(
    <ConversationLog entries={entries} latestKey={latestKey}>
      <p>Nice! Which part?</p>
    </ConversationLog>,
  );

// 사용자가 칸을 잡고 끌어 올려 지난 대화를 보는 중이 된다
const browseUp = (box: HTMLElement) => {
  fireEvent.touchStart(box);
  box.scrollTop = 100;
  fireEvent.scroll(box);
};

describe('ConversationLog', () => {
  it('지난 대화를 순서대로 쌓고 그 아래에 지금 차례의 말을 둔다', () => {
    layOut();

    renderLog(0);

    const texts = [
      'Where do you live?',
      'I live in Seoul.',
      'Nice! Which part?',
    ];
    const nodes = texts.map((text) => screen.getByText(text));
    expect(
      nodes.every(
        (node, i) =>
          i === 0 ||
          nodes[i - 1].compareDocumentPosition(node) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });

  it('최신 대화를 보는 중엔 알약을 띄우지 않는다', () => {
    layOut();

    renderLog(0);

    expect(
      screen.queryByRole('button', { name: /최신 대화로/ }),
    ).not.toBeInTheDocument();
  });

  it('끌어 올려 지난 대화를 보는 중이면 「최신 대화로」 알약을 띄운다', () => {
    layOut();
    const { container } = renderLog(0);

    browseUp(container.querySelector('.overflow-y-auto') as HTMLElement);

    expect(
      screen.getByRole('button', { name: /최신 대화로/ }),
    ).toBeInTheDocument();
  });

  it('지난 대화를 보는 사이 새 답변이 오면 끌어 내리지 않고 알약에 점을 찍는다', () => {
    layOut();
    const { container, rerender } = renderLog(0);
    const box = container.querySelector('.overflow-y-auto') as HTMLElement;
    browseUp(box);
    vi.mocked(Element.prototype.scrollTo).mockClear();

    rerender(
      <ConversationLog entries={entries} latestKey={1}>
        <p>Nice! Which part?</p>
      </ConversationLog>,
    );

    expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText('새 답변이 있어요')).toBeInTheDocument();
  });

  it('알약을 누르면 새 말풍선 자리로 내려간다', () => {
    layOut();
    const { container } = renderLog(0);
    browseUp(container.querySelector('.overflow-y-auto') as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /최신 대화로/ }));

    expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({
      top: 700,
      behavior: 'smooth',
    });
  });
});
