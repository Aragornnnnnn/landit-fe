// 시나리오 카드 그림 검증 — 준비된 썸네일만 보여 주고 나머지는 캐릭터 카드로 둔다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { paintedThumbnails } from '@/features/roleplay/model/painted-thumbnails';

import { ScenarioCard } from './ScenarioCard';

vi.mock('@/features/roleplay/ui/PartnerBust', () => ({
  PartnerBust: () => <span>캐릭터</span>,
}));

afterEach(() => {
  cleanup();
  paintedThumbnails.clear();
});

const THUMBNAIL_URL = 'https://cdn.example/roleplay.webp';
const NEXT_URL = 'https://cdn.example/next.webp';

const scenario: RoleplaySettings = {
  id: 1,
  characterId: 'chloe',
  title: '카페에서 주문하기',
  userRole: '손님',
  aiRole: '점원',
  situation: '커피를 주문한다',
  createdAt: '2026-11-04T10:00:00',
  lastPlayedAt: null,
};

const card = (thumbnail: RoleplaySettings['thumbnail']) => (
  <ScenarioCard
    scenario={{ ...scenario, thumbnail }}
    today="2026-11-04"
    onOpen={vi.fn()}
    onMore={vi.fn()}
  />
);

const ready = (url: string) => ({ status: 'READY', url }) as const;

// alt가 빈 장식 그림이라 role은 presentation이다
const thumbnailImage = () => screen.queryByRole('presentation');

describe('ScenarioCard', () => {
  it('썸네일을 받아 그림이 그려지면 캐릭터를 치운다', () => {
    // given
    render(card(ready(THUMBNAIL_URL)));

    // when
    fireEvent.load(thumbnailImage()!);

    // then
    expect(thumbnailImage()).toHaveAttribute('src', THUMBNAIL_URL);
    expect(screen.queryByText('캐릭터')).not.toBeInTheDocument();
  });

  it('그림을 불러오는 동안엔 캐릭터 대신 빈 자리를 둔다', () => {
    render(card(ready(THUMBNAIL_URL)));

    expect(screen.getByTestId('thumbnail-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('캐릭터')).not.toBeInTheDocument();
  });

  it('그림은 투명하게 시작해 불러오면 서서히 나타난다', () => {
    // given
    render(card(ready(THUMBNAIL_URL)));
    expect(thumbnailImage()).toHaveClass('opacity-0');

    // when
    fireEvent.load(thumbnailImage()!);

    // then
    expect(thumbnailImage()).toHaveClass('opacity-100');
  });

  it('그림이 나타나는 동안 스켈레톤은 뒤에 남아 카드 바탕색이 비치지 않게 한다', () => {
    // given
    render(card(ready(THUMBNAIL_URL)));

    // when
    fireEvent.load(thumbnailImage()!);

    // then 남아 있되 더는 흐르지 않는다
    const skeleton = screen.getByTestId('thumbnail-skeleton');
    expect(skeleton).not.toHaveClass('animate-skeleton-flow');
  });

  it.each([
    'NOT_REQUESTED',
    'PENDING',
    'GENERATING',
    'FAILED',
    'CANCELLED',
  ] as const)('%s 상태면 캐릭터 카드로 둔다', (status) => {
    render(card({ status, url: null }));

    expect(thumbnailImage()).not.toBeInTheDocument();
    expect(screen.getByText('캐릭터')).toBeInTheDocument();
  });

  it('READY인데 주소가 없으면 캐릭터 카드로 둔다', () => {
    render(card({ status: 'READY', url: null }));

    expect(thumbnailImage()).not.toBeInTheDocument();
  });

  it('응답에 썸네일이 없으면 캐릭터 카드로 둔다', () => {
    render(card(undefined));

    expect(thumbnailImage()).not.toBeInTheDocument();
    expect(screen.getByText('캐릭터')).toBeInTheDocument();
  });

  it('그림을 불러오지 못하면 캐릭터 카드로 돌아간다', () => {
    // given
    render(card(ready(THUMBNAIL_URL)));

    // when
    fireEvent.error(thumbnailImage()!);

    // then
    expect(thumbnailImage()).not.toBeInTheDocument();
    expect(screen.getByText('캐릭터')).toBeInTheDocument();
  });

  it('실패한 뒤 새 주소가 오면 다시 불러온다', () => {
    // given
    const { rerender } = render(card(ready(THUMBNAIL_URL)));
    fireEvent.error(thumbnailImage()!);

    // when
    rerender(card(ready(NEXT_URL)));

    // then
    expect(thumbnailImage()).toHaveAttribute('src', NEXT_URL);
  });

  it('그림이 너무 오래 안 오면 캐릭터를 세우고, 뒤늦게 오면 그림으로 바꾼다', () => {
    // given
    vi.useFakeTimers();
    render(card(ready(THUMBNAIL_URL)));

    // when 기다리다 지친다
    act(() => vi.advanceTimersByTime(8_000));

    // then
    expect(screen.queryByTestId('thumbnail-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('캐릭터')).toBeInTheDocument();

    // when 그 뒤에 그림이 온다
    fireEvent.load(thumbnailImage()!);

    // then
    expect(screen.queryByText('캐릭터')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('이미 그려 본 그림은 다시 만들어져도 스켈레톤과 페이드 없이 바로 보인다', () => {
    // given 한 번 그려진 카드를 치운다 (탭을 오가면 카드가 다시 만들어진다)
    const first = render(card(ready(THUMBNAIL_URL)));
    fireEvent.load(thumbnailImage()!);
    first.unmount();

    // when
    render(card(ready(THUMBNAIL_URL)));

    // then
    expect(thumbnailImage()).toHaveClass('opacity-100');
    expect(screen.getByTestId('thumbnail-skeleton')).not.toHaveClass(
      'animate-skeleton-flow',
    );
  });

  it('그림을 기다리는 동안에도 더보기와 카드 열기가 눌린다', () => {
    // given 스켈레톤이 떠 있다
    const onOpen = vi.fn();
    const onMore = vi.fn();
    render(
      <ScenarioCard
        scenario={{ ...scenario, thumbnail: ready(THUMBNAIL_URL) }}
        today="2026-11-04"
        onOpen={onOpen}
        onMore={onMore}
      />,
    );
    expect(screen.getByTestId('thumbnail-skeleton')).toBeInTheDocument();

    // when 카드 본체와 더보기 버튼을 각각 누른다
    const [openButton, moreButton] = screen.getAllByRole('button');
    fireEvent.click(openButton);
    fireEvent.click(moreButton);

    // then
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onMore).toHaveBeenCalledOnce();
  });
});
