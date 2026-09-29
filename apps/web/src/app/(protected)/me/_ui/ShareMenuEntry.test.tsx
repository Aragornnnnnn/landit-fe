// ShareMenuEntry — 누르면 공유하고 쓴 길을 계측한다. 복사로 끝났으면 복사했다고, 실패하면 실패했다고 알린다
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareMenuEntry } from './ShareMenuEntry';

const mocks = vi.hoisted(() => ({
  shareApp: vi.fn(),
  track: vi.fn(),
  showToast: vi.fn(),
}));
// 공유 길 고르기는 share-app.test.ts가 본다 — 여기선 결과에 따른 안내만 본다
vi.mock('../_model/share-app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../_model/share-app')>()),
  shareApp: mocks.shareApp,
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/ui/toast', () => ({ showToast: mocks.showToast }));

afterEach(() => cleanup());

const pressShare = () =>
  userEvent.click(
    screen.getByRole('button', { name: '친구에게 랜딧 공유하기' }),
  );

describe('ShareMenuEntry', () => {
  it('누르면 공유하고 쓴 길을 계측한다', async () => {
    mocks.shareApp.mockResolvedValue('native_sheet');
    render(<ShareMenuEntry />);

    await pressShare();

    await waitFor(() =>
      expect(mocks.track).toHaveBeenCalledWith('App Share Tapped', {
        method: 'native_sheet',
      }),
    );
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('링크 복사로 끝나면 복사했다고 알린다', async () => {
    mocks.shareApp.mockResolvedValue('copy');
    render(<ShareMenuEntry />);

    await pressShare();

    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith('링크를 복사했어요'),
    );
  });

  it('공유가 끝나기 전에 다시 누르면 한 번만 공유한다', async () => {
    // 웹 공유 시트가 떠 있는 동안 — 끝나지 않은 공유
    mocks.shareApp.mockReturnValue(new Promise(() => {}));
    render(<ShareMenuEntry />);

    await pressShare();
    await pressShare();

    expect(mocks.shareApp).toHaveBeenCalledTimes(1);
  });

  it('복사까지 실패하면 실패했다고 알린다', async () => {
    mocks.shareApp.mockRejectedValue(new Error('clipboard denied'));
    render(<ShareMenuEntry />);

    await pressShare();

    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith('링크를 복사하지 못했어요'),
    );
    expect(mocks.track).not.toHaveBeenCalled();
  });
});
