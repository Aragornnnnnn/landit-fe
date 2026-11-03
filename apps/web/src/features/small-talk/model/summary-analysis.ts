// 총평 분석이 어디까지 왔는지 — 스몰톡·롤플레이 요약 화면이 같은 규칙으로 읽는다
export type SummaryAnalysis = 'ready' | 'partial' | 'waiting' | 'expired';

export const toSummaryAnalysis = (
  summary: { pending: boolean; analysisStatus?: string | null },
  waitExpired: boolean,
): SummaryAnalysis => {
  if (summary.pending) return waitExpired ? 'expired' : 'waiting';
  return summary.analysisStatus === 'PARTIAL' ? 'partial' : 'ready';
};
