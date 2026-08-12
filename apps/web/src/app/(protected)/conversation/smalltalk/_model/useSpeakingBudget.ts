// 오늘 남은 말하기 시간 — 화면이 들고 있는 눈금이다. 말하는 동안 1초씩 깎고, 제출 응답이 오면 서버 값으로 맞춘다.
// 보내지 않은 발화(취소·인식 실패·제출 실패)는 서버가 모르는 시간이라 말하기 전 값으로 되돌린다.
'use client';

import { useEffect, useState } from 'react';

// 눈금은 1초에 한 칸씩 — 어림값이라 정산은 서버 잔량이 한다
const TICK_MS = 1000;

interface SpeakingBudgetOptions {
  // 진입 시점의 오늘 남은 시간
  initialMs: number;
  // 지금 말하는 중인가 — 이 동안만 눈금이 깎인다
  speaking: boolean;
  // 말하기 대기로 되돌아왔는가 — 보낸 말 없이 돌아왔다는 뜻이라 눈금을 되돌린다
  waiting: boolean;
}

export const useSpeakingBudget = ({
  initialMs,
  speaking,
  waiting,
}: SpeakingBudgetOptions) => {
  const [remainingMs, setRemainingMs] = useState(initialMs);
  // 이번 발화를 시작할 때의 잔량 — 타이머 링이 이 값을 가득 찬 것으로 잡고, 되돌릴 때의 기준이 된다.
  // 하루치를 기준으로 잡으면 남은 게 적은 날엔 말을 시작하기도 전에 링이 비어 있다
  const [budgetMs, setBudgetMs] = useState<number | null>(null);

  if (speaking && budgetMs === null) setBudgetMs(remainingMs);
  // 깎아 둔 눈금을 되돌리지 않으면 다음 제출 때 시간이 되살아난 것처럼 보인다
  if (waiting && budgetMs !== null) {
    setRemainingMs(budgetMs);
    setBudgetMs(null);
  }

  useEffect(() => {
    if (!speaking) return;
    const ticker = setInterval(
      () => setRemainingMs((ms) => Math.max(0, ms - TICK_MS)),
      TICK_MS,
    );
    return () => clearInterval(ticker);
  }, [speaking]);

  // 이번 발화에서 남은 몫(0~1) — 타이머 링이 그린다
  const toRatio = () => {
    if (budgetMs === null) return 1; // 말하기 전 — 링은 가득 차 있다
    if (budgetMs === 0) return 0; // 이미 다 쓴 채로 시작한 발화
    return remainingMs / budgetMs;
  };

  return {
    remainingMs,
    ratio: toRatio(),
    // 서버가 정산한 잔량이 정본이다 — 되돌릴 기준도 여기서 놓는다
    settle: (serverRemainingMs: number) => {
      setRemainingMs(serverRemainingMs);
      setBudgetMs(null);
    },
  };
};
