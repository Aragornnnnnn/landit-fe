// MicPermissionSheet — 앱/브라우저 분기와 설정 열기 브릿지 발신을 검증한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSurface } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

import { MicPermissionSheet } from './MicPermissionSheet';

vi.mock('@/shared/bridge/native-context', () => ({
  getSurface: vi.fn(),
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(),
}));
// BottomSheet는 framer-motion(모노레포 다중 react 사본)을 끌어와 렌더가 깨진다 —
// 시트의 관심사가 아니므로 열렸을 때 children만 그리는 패스스루로 대체한다
vi.mock('@/shared/ui/BottomSheet', () => ({
  BottomSheet: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
}));

const getSurfaceMock = vi.mocked(getSurface);
const postToNativeMock = vi.mocked(postToNative);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MicPermissionSheet', () => {
  it('앱이면 설정 열기 버튼을 눌러 OPEN_SETTINGS를 보내고 닫는다', () => {
    getSurfaceMock.mockReturnValue('app');
    const onClose = vi.fn();

    render(<MicPermissionSheet open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '설정 열기' }));

    expect(postToNativeMock).toHaveBeenCalledWith({ type: 'OPEN_SETTINGS' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('브라우저면 설정 열기 버튼을 노출하지 않는다', () => {
    getSurfaceMock.mockReturnValue('browser');

    render(<MicPermissionSheet open onClose={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: '설정 열기' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('닫기 버튼은 브릿지 발신 없이 onClose만 부른다', () => {
    getSurfaceMock.mockReturnValue('app');
    const onClose = vi.fn();

    render(<MicPermissionSheet open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(postToNativeMock).not.toHaveBeenCalled();
  });
});
