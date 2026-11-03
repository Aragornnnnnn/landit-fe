// 총평 분석이 어디까지 왔는지 — 스몰톡·롤플레이 요약 화면이 같은 규칙으로 읽는다
// 일부 문장을 분석하지 못한 결과(PARTIAL)도 ready다. 통계와 완료된 분석은 그대로 맞고 교정 하나가 빠질 뿐이라, 굳이 알려 불안하게 하지 않는다
export type SummaryAnalysis = 'ready' | 'waiting' | 'expired';

export const toSummaryAnalysis = (
  summary: { pending: boolean },
  waitExpired: boolean,
): SummaryAnalysis => {
  if (!summary.pending) return 'ready';
  return waitExpired ? 'expired' : 'waiting';
};
