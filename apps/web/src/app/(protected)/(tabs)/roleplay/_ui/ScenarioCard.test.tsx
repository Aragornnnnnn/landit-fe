// 시나리오 카드 그림 검증 — 준비된 썸네일만 보여 주고 나머지는 캐릭터 카드로 둔다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';

import { ScenarioCard } from './ScenarioCard';

vi.mock('@/features/roleplay/ui/PartnerBust', () => ({
  PartnerBust: () => <span>캐릭터</span>,
}));

afterEach(() => cleanup());

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

  it('그림이 그려지기 전에는 캐릭터를 함께 둔다', () => {
    render(card(ready(THUMBNAIL_URL)));

    expect(screen.getByText('캐릭터')).toBeInTheDocument();
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
});
