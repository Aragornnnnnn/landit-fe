// 피드백 등록 요청 모양 — 사진이 있으면 multipart, 없으면 지금까지처럼 JSON
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/shared/api/client';

import { submitFeedback } from './mailbox';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
}));

const post = vi.mocked(api.post);

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue(undefined as never);
});

describe('submitFeedback', () => {
  it('사진이 없으면 JSON 본문으로 보낸다', async () => {
    await submitFeedback({ type: 'BUG_REPORT', content: '화면이 하얘져요' });

    expect(post).toHaveBeenCalledWith('/api/v1/mailbox/feedbacks', {
      type: 'BUG_REPORT',
      content: '화면이 하얘져요',
    });
  });

  it('사진이 있으면 feedback JSON 파트와 images 파트로 나눠 보낸다', async () => {
    // given
    const photo = new File(['jpeg'], 'a.jpg', { type: 'image/jpeg' });

    // when
    await submitFeedback({ type: 'BUG_REPORT', content: '화면이 하얘져요' }, [
      photo,
    ]);

    // then — 서버는 feedback 파트를 JSON으로 읽는다(@RequestPart)
    const form = post.mock.calls[0][1] as FormData;
    const feedback = form.get('feedback') as Blob;
    expect(feedback.type).toBe('application/json');
    expect(JSON.parse(await feedback.text())).toEqual({
      type: 'BUG_REPORT',
      content: '화면이 하얘져요',
    });
    expect(form.getAll('images')).toHaveLength(1);
  });
});
