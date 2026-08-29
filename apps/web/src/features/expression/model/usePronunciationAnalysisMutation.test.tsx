// 발음 분석 mutation 계약 검증 — 녹음(blob·파일명)이 API 호출로 그대로 전달된다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { postPronunciationAnalysis } from '../api/pronunciation';
import { usePronunciationAnalysisMutation } from './usePronunciationAnalysisMutation';

vi.mock('../api/pronunciation', () => ({
  postPronunciationAnalysis: vi.fn().mockResolvedValue({
    score: 100,
    passed: true,
    words: [],
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('usePronunciationAnalysisMutation', () => {
  it('녹음의 blob과 파일명을 표현 id와 함께 그대로 API에 전달한다', async () => {
    const blob = new Blob(['sound'], { type: 'audio/webm' });
    const { result } = renderHook(() => usePronunciationAnalysisMutation(7), {
      wrapper,
    });

    result.current.mutate({ blob, filename: 'recording.webm' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postPronunciationAnalysis).toHaveBeenCalledWith(
      7,
      blob,
      'recording.webm',
    );
  });
});
