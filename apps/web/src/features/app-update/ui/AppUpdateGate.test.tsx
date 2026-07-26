// AppUpdateGate — updateType에 따라 올바른 화면을 고르고, 소프트는 명시적으로 닫히는지 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAppUpdateCheck } from '@/features/app-update/model/useAppUpdateCheck';

import { AppUpdateGate } from './AppUpdateGate';

// 중첩된 framer-motion 인스턴스가 렌더러 아이덴티티를 갈라놔서, 테스트에선 순수 DOM으로 치환한다
vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  const MOTION_PROPS = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileTap',
    'whileHover',
    'whileInView',
    'layout',
    'variants',
  ]);
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: Record<string, unknown>) =>
          createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
            ),
            children as React.ReactNode,
          ),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

vi.mock('@/features/app-update/model/useAppUpdateCheck');
const useAppUpdateCheckMock = vi.mocked(useAppUpdateCheck);

afterEach(() => cleanup());

describe('AppUpdateGate', () => {
  it('강제 업데이트면 나중에 할래요 없이 모달만 보여준다', () => {
    useAppUpdateCheckMock.mockReturnValue({
      updateType: 'FORCE',
      reason: '보안 패치가 필요해요',
    });

    render(<AppUpdateGate />);

    expect(screen.getByText('Landit 새 버전 출시!')).toBeInTheDocument();
    expect(screen.getByText('보안 패치가 필요해요')).toBeInTheDocument();
    expect(screen.queryByText('나중에 할래요')).not.toBeInTheDocument();
  });

  it('강제 업데이트인데 사유가 없으면 기본 문구를 보여준다', () => {
    useAppUpdateCheckMock.mockReturnValue({
      updateType: 'FORCE',
      reason: null,
    });

    render(<AppUpdateGate />);

    expect(
      screen.getByText('새로운 기능을 사용하려면 업데이트가 필요해요'),
    ).toBeInTheDocument();
  });

  it('소프트 업데이트면 나중에 할래요 버튼이 있는 시트를 보여준다', () => {
    useAppUpdateCheckMock.mockReturnValue({
      updateType: 'SOFT',
      reason: '알림 기능이 추가됐어요',
    });

    render(<AppUpdateGate />);

    expect(screen.getByText('나중에 할래요')).toBeInTheDocument();
  });

  it('소프트 업데이트에서 나중에 할래요를 누르면 사라진다', () => {
    useAppUpdateCheckMock.mockReturnValue({
      updateType: 'SOFT',
      reason: '알림 기능이 추가됐어요',
    });

    render(<AppUpdateGate />);
    fireEvent.click(screen.getByText('나중에 할래요'));

    expect(screen.queryByText('나중에 할래요')).not.toBeInTheDocument();
  });

  it('소프트 업데이트인데 사유가 없으면 기본 문구를 보여준다', () => {
    useAppUpdateCheckMock.mockReturnValue({ updateType: 'SOFT', reason: null });

    render(<AppUpdateGate />);

    expect(screen.getByText('새로워진 기능을 만나보세요')).toBeInTheDocument();
  });

  it('업데이트가 필요 없으면 아무것도 보여주지 않는다', () => {
    useAppUpdateCheckMock.mockReturnValue({ updateType: 'NONE', reason: null });

    render(<AppUpdateGate />);

    expect(screen.queryByText('Landit 새 버전 출시!')).not.toBeInTheDocument();
  });
});
