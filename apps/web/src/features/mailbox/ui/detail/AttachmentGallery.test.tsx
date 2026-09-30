// 보낸 피드백 첨부 사진 줄 — 장마다 따로 받아 실패한 장만 다시 받고, 누르면 불러온 사진끼리 넘겨 본다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/api-error';
import { useAuthStore } from '@/shared/auth/auth-store';

import { getFeedbackAttachment } from '../../api/mailbox';
import { AttachmentGallery } from './AttachmentGallery';

vi.mock('../../api/mailbox', () => ({ getFeedbackAttachment: vi.fn() }));

const fetchAttachment = vi.mocked(getFeedbackAttachment);
// 다시 물어도 같은 답인 실패 — 자동 재시도 없이 바로 실패 칸이 된다
const notFound = () =>
  new ApiError('첨부를 찾을 수 없습니다.', 404, '/api/v1/mailbox', 'NOT_FOUND');

const attachment = (attachmentId: number) => ({
  attachmentId,
  contentType: 'image/jpeg',
  fileSize: 1000,
  downloadUrl: `/api/v1/mailbox/feedbacks/1/attachments/${attachmentId}`,
});

const renderGallery = (ids: number[]) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AttachmentGallery attachments={ids.map(attachment)} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  useAuthStore.setState({
    accessToken: 'a',
    refreshToken: 'r',
    member: { userId: 1, nickname: null, email: null, provider: 'KAKAO' },
  });
  let n = 0;
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => `blob:${(n += 1)}`,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AttachmentGallery', () => {
  it('한 장을 못 받으면 그 칸만 다시 불러오기로 두고 나머지는 보여준다', async () => {
    fetchAttachment.mockImplementation((url) =>
      url.endsWith('/2')
        ? Promise.reject(notFound())
        : Promise.resolve(new Blob(['jpeg'])),
    );

    renderGallery([1, 2, 3]);

    expect(
      await screen.findByRole('button', { name: '첨부 사진 2 다시 불러오기' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '첨부 사진 1 크게 보기' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '첨부 사진 3 크게 보기' }),
    ).toBeTruthy();
  });

  it('다시 불러오기를 누르면 그 사진만 다시 받는다', async () => {
    fetchAttachment
      .mockResolvedValueOnce(new Blob(['1']))
      .mockRejectedValueOnce(notFound())
      .mockResolvedValueOnce(new Blob(['2']));
    renderGallery([1, 2]);

    fireEvent.click(
      await screen.findByRole('button', { name: '첨부 사진 2 다시 불러오기' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '첨부 사진 2 크게 보기' }),
      ).toBeTruthy(),
    );
    expect(fetchAttachment).toHaveBeenCalledTimes(3);
  });

  it('누른 사진부터 불러온 사진끼리 몇 번째인지 보여주며 연다', async () => {
    fetchAttachment.mockResolvedValue(new Blob(['jpeg']));
    renderGallery([1, 2, 3]);

    fireEvent.click(
      await screen.findByRole('button', { name: '첨부 사진 3 크게 보기' }),
    );

    expect(screen.getByText('3 / 3')).toBeTruthy();
  });

  it('받는 중인 칸은 불러오는 중이라고 읽어 준다', () => {
    fetchAttachment.mockReturnValue(new Promise(() => {}));
    renderGallery([1]);

    expect(screen.getByRole('status').textContent).toBe(
      '첨부 사진 1 불러오는 중',
    );
  });

  it('연 뒤에 앞 사진이 늦게 도착해도 누른 사진을 계속 보여준다', async () => {
    let arriveFirst: (blob: Blob) => void = () => {};
    fetchAttachment.mockImplementation((url) =>
      url.endsWith('/1')
        ? new Promise((resolve) => {
            arriveFirst = resolve;
          })
        : Promise.resolve(new Blob(['jpeg'])),
    );
    renderGallery([1, 2, 3]);
    fireEvent.click(
      await screen.findByRole('button', { name: '첨부 사진 3 크게 보기' }),
    );

    arriveFirst(new Blob(['late']));
    await screen.findByRole('button', { name: '첨부 사진 1 크게 보기' });

    const viewer = screen.getByRole('dialog');
    expect(within(viewer).getByRole('img').getAttribute('alt')).toBe(
      '첨부 사진 3',
    );
  });
});
