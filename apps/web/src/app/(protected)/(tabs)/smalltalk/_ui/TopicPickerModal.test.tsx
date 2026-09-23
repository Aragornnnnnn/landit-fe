// 주제 고르기 모달 — 마음에 드는 주제가 없으면 다른 주제를 받아볼 수 있어야 한다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkTopic } from '@/features/small-talk/api/small-talk';

import { TopicPickerModal } from './TopicPickerModal';

afterEach(cleanup);

const TOPICS: SmallTalkTopic[] = [
  { topicId: 1, displayName: '주말 계획', displayOrder: 1 },
  { topicId: 2, displayName: '요즘 보는 것', displayOrder: 2 },
];

const renderModal = (
  props: Partial<React.ComponentProps<typeof TopicPickerModal>> = {},
) =>
  render(
    <TopicPickerModal
      open
      partnerName="클로이"
      topics={TOPICS}
      refreshing={false}
      onRefresh={vi.fn()}
      onSelect={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );

describe('TopicPickerModal', () => {
  it('새로고침을 누르면 주제를 다시 받아오라고 알린다', async () => {
    const onRefresh = vi.fn();
    renderModal({ onRefresh });

    await userEvent.click(
      screen.getByRole('button', { name: '다른 주제 보기' }),
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('받아오는 동안에는 다시 누를 수 없다', async () => {
    const onRefresh = vi.fn();
    renderModal({ refreshing: true, onRefresh });

    await userEvent.click(
      screen.getByRole('button', { name: '다른 주제 보기' }),
    );

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('받아온 직후에도 아이콘이 한 바퀴 다 돌 때까지는 다시 누를 수 없다', async () => {
    // given — 연달아 누르면 읽기도 전에 주제가 갈린다
    const onRefresh = vi.fn();
    renderModal({ onRefresh });
    const button = screen.getByRole('button', { name: '다른 주제 보기' });

    // when — 한 번 누르고 곧바로 또 누른다
    await userEvent.click(button);
    await userEvent.click(button);

    // then — 두 번째는 먹지 않는다
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('눌러서 받아오는 동안에는 보던 주제가 그대로 있다', async () => {
    // given — 주제를 보다가 새로고침을 눌렀다
    const { rerender } = renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: '다른 주제 보기' }),
    );

    // when — 받아오는 중이 된다
    rerender(
      <TopicPickerModal
        open
        partnerName="클로이"
        topics={TOPICS}
        refreshing
        onRefresh={vi.fn()}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    // then
    expect(screen.getByText('주말 계획')).toBeInTheDocument();
  });

  it('열자마자 받는 중이면 지난번 주제를 보여주지 않는다', () => {
    // given + when — 열 때마다 새로 받으므로, 열린 순간 이미 받는 중이다
    renderModal({ refreshing: true });

    // then — 곧 갈릴 주제를 비추는 대신 빈 자리로 기다린다
    expect(screen.queryByText('주말 계획')).not.toBeInTheDocument();
  });
});
