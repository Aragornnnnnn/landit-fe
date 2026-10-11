// 방금 받은 금액을 화면 위에 잠깐 띄우는 알림의 상태 — 표현처럼 화면을 멈추지 않고 이어 가는 학습에서 쓴다
import { create } from 'zustand';

import type { RewardReceipt } from '../api/reward';

interface EarnedPopState {
  // 지금 떠 있는 것
  shown: { completionId: number; earnedWon: number } | null;
  // 이미 알린 완료들 — 서버는 같은 완료를 다시 요청하면 처음 영수증을 그대로 준다. 그걸 또 받은 것처럼 알리면 안 된다
  announced: number[];
  show: (receipt: RewardReceipt) => void;
  clear: () => void;
}

export const useEarnedPop = create<EarnedPopState>((set, get) => ({
  shown: null,
  announced: [],
  show: (receipt) => {
    // 받은 게 없거나(0원·미확정) 이미 알린 완료면 조용히 넘어간다
    if (receipt.status !== 'EARNED' || !receipt.earnedWon) return;
    if (get().announced.includes(receipt.completionId)) return;
    set({
      shown: {
        completionId: receipt.completionId,
        earnedWon: receipt.earnedWon,
      },
      announced: [...get().announced, receipt.completionId],
    });
  },
  clear: () => set({ shown: null }),
}));
