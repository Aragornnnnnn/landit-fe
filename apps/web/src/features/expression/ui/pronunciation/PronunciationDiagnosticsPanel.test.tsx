// 관리자 진단 공유와 공유 실패 시 수동 복사 경로를 검증한다.
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { createPronunciationDiagnostics } from '../../model/pronunciation-playback-diagnostics';
import { PronunciationDiagnosticsPanel } from './PronunciationDiagnosticsPanel';

const diagnostics = () =>
  createPronunciationDiagnostics({
    expressionId: 1946,
    requestedAt: '2026-11-05T07:33:00Z',
    recording: {
      blob: new Blob(['audio']),
      filename: 'recording.m4a',
      peak: null,
    },
    analysis: { score: 95, passed: false, words: [] },
  });

beforeEach(() => {
  useAuthStore.setState({
    member: { userId: 1, nickname: 'test', role: 'ADMIN' } as NonNullable<
      ReturnType<typeof useAuthStore.getState>['member']
    >,
  });
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  vi.unstubAllGlobals();
});

it('일반 계정이면 진단 UI를 표시하지 않는다', () => {
  useAuthStore.getState().clearAuth();

  render(<PronunciationDiagnosticsPanel diagnostics={diagnostics()} />);

  expect(screen.queryByText('발음 재생 진단')).not.toBeInTheDocument();
});

it('공유를 누르면 그 시점까지 수집한 보고서를 공유한다', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { userAgent: 'test', share });
  const report = diagnostics();
  render(<PronunciationDiagnosticsPanel diagnostics={report} />);
  fireEvent.click(screen.getByText('발음 재생 진단'));
  report.startPlayback(2, { startMs: 1200, endMs: 1500 });

  fireEvent.click(screen.getByRole('button', { name: '진단 정보 공유' }));

  await waitFor(() => expect(share).toHaveBeenCalled());
  expect(JSON.parse(share.mock.calls[0]![0].text).playbacks[0].order).toBe(2);
});

it('공유와 클립보드가 막혀도 보고서를 직접 선택해서 복사할 수 있다', async () => {
  vi.stubGlobal('navigator', {
    userAgent: 'test',
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  });
  render(<PronunciationDiagnosticsPanel diagnostics={diagnostics()} />);
  fireEvent.click(screen.getByText('발음 재생 진단'));

  fireEvent.click(screen.getByRole('button', { name: '진단 정보 공유' }));

  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      '아래 내용을 길게 눌러 복사해주세요.',
    ),
  );
  expect(
    (
      screen.getByRole('textbox', {
        name: '발음 재생 진단 JSON',
      }) as HTMLTextAreaElement
    ).value,
  ).toContain('LAN-844-v1');
});
