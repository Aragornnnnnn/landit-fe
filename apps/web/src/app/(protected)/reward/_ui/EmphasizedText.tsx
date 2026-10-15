// 가운데 낱말만 주황으로 띄운 한 줄 — 환급 소개의 받을 수 있는 금액에 쓴다
import type { EmphasizedLine } from '../_model/reward-intro-copy';

export const EmphasizedText = ({ line }: { line: EmphasizedLine }) => (
  <>
    {line.lead}
    <strong className="font-bold text-primary">{line.strong}</strong>
    {line.tail}
  </>
);
