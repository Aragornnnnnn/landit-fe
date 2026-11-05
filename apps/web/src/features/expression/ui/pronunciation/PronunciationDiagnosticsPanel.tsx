// 관리자에게 현재 평가의 진단 보고서 공유와 수동 복사 경로를 제공한다.
import { useState } from 'react';

import { useIsAdmin } from '@/shared/auth/current-member';
import { shareText } from '@/shared/lib/share-text';

import type { PronunciationDiagnostics } from '../../model/pronunciation-playback-diagnostics';

export const PronunciationDiagnosticsPanel = ({
  diagnostics,
}: {
  diagnostics: PronunciationDiagnostics;
}) => {
  const isAdmin = useIsAdmin();
  const [report, setReport] = useState('');
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  if (!isAdmin) return null;

  const share = async () => {
    const text = diagnostics.export();
    setReport(text);
    setSharing(true);
    try {
      const method = await shareText(text);
      setNotice(
        method === 'copy'
          ? '진단 정보를 복사했어요.'
          : '화면 녹화와 진단 정보를 함께 전달해주세요.',
      );
    } catch {
      setNotice('아래 내용을 길게 눌러 복사해주세요.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <details className="rounded-xl border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">발음 재생 진단</summary>
      <p className="my-3 text-muted-foreground">
        화면 녹화를 켜고 전체 내 발음과 문제가 난 단어를 재생한 뒤 공유해주세요.
        최근 8회 재생을 기록하며, 다시 평가하면 새 보고서로 바뀝니다. 녹음
        파일과 계정 정보는 포함하지 않습니다.
      </p>
      <button
        type="button"
        onClick={share}
        disabled={sharing}
        className="rounded-lg bg-secondary px-3 py-2 font-semibold disabled:opacity-50"
      >
        진단 정보 공유
      </button>
      {notice && (
        <p role="status" className="mt-2">
          {notice}
        </p>
      )}
      {report && (
        <textarea
          aria-label="발음 재생 진단 JSON"
          readOnly
          value={report}
          rows={4}
          className="mt-2 w-full rounded border border-border p-2 font-mono text-xs select-text"
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </details>
  );
};
