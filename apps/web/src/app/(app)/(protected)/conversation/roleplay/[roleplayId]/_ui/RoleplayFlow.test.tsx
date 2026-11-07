// 롤플레이 대화 진입 — 프리미엄 거절은 오류 화면 대신 페이월로, 그 밖의 실패는 오류 화면으로 간다
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { useRoleplaySession } from '../_model/useRoleplaySession';
import { RoleplayFlow } from './RoleplayFlow';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));
vi.mock('../_model/useRoleplaySession', () => ({
  useRoleplaySession: vi.fn(),
}));
vi.mock('./RoleplayConversation', () => ({ RoleplayConversation: () => null }));

const failWith = (error: unknown) =>
  vi.mocked(useRoleplaySession).mockReturnValue({
    session: null,
    error,
    partner: null,
  });

const waitWith = (partner: 'marco' | null) =>
  vi.mocked(useRoleplaySession).mockReturnValue({
    session: null,
    error: null,
    partner,
  });

afterEach(() => {
  cleanup();
  replace.mockClear();
});

describe('RoleplayFlow', () => {
  it('프리미엄이 없다고 거절되면 오류 없이 페이월로 보낸다', async () => {
    failWith(new ApiError('막힘', 403, '/x', 'PREMIUM_REQUIRED'));

    render(<RoleplayFlow roleplayId={7} entry="card" />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(expect.stringContaining('/paywall')),
    );
    expect(screen.queryByRole('button', { name: '돌아가기' })).toBeNull();
  });

  it('그 밖의 실패는 오류 화면을 보여 준다', () => {
    failWith(new ApiError('오류', 500, '/x'));

    render(<RoleplayFlow roleplayId={7} entry="card" />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('상대를 알면 첫 말을 기다리는 동안 상대가 말을 준비하는 모습을 보여 준다', () => {
    waitWith('marco');

    render(<RoleplayFlow roleplayId={7} entry="card" />);

    expect(screen.getByRole('status')).toHaveTextContent('답을 생각하는 중');
  });

  it('상대를 모르면 기다리는 동안 빈 자리만 보여 준다', () => {
    waitWith(null);

    render(<RoleplayFlow roleplayId={7} entry="card" />);

    expect(screen.queryByRole('status')).toBeNull();
  });
});
