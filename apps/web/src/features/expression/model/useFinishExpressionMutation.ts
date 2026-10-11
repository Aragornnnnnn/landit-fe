// 표현 학습 완료 처리 — 완료가 바꾸는 목록(표현·시나리오·스몰톡)과 환급을 새로 받게 한다
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 표현 완료가 환급액도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { expressionsEarnOf } from '@/features/reward/model/completion-earn';
import { useEarnedPop } from '@/features/reward/model/earned-pop';
import { refreshRewardAfterCompletion } from '@/features/reward/model/refresh-reward';
import { scenarioKeys } from '@/features/scenario/model/keys';
// 스몰톡 표현의 완료 여부는 그 대화의 세션 상세가 들고 있다 — 목록 주인이 둘이라 양쪽을 다 턴다
import { smallTalkKeys } from '@/features/small-talk/model/keys';

import { finishExpression } from '../api/finish';
import { expressionKeys } from './keys';

/**
 * @param freeTalkSessionId 스몰톡 표현이면 그 대화의 세션 — 서버가 세션 연결을 검증해야 완료를 기록한다
 * @param repeated 이미 끝낸 표현을 다시 하는가 — 서버가 처음 영수증을 그대로 주므로, 또 받은 것처럼 알리지 않는다
 * @returns 완료의 결과로 `earned`를 준다 — 이번 완료로 오늘 표현 몫을 다 받았으면 화면이 보여 줄 금액, 아니면 null
 */
export const useFinishExpressionMutation = (
  expressionId: number,
  {
    freeTalkSessionId,
    repeated,
  }: { freeTalkSessionId?: number; repeated: boolean },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 응답 몸통이 비어 와도 완료 후속은 돌아야 한다
      const response = await finishExpression(expressionId, freeTalkSessionId);
      const receipt = (!repeated && response?.reward) || null;
      return { receipt, earned: receipt && expressionsEarnOf(receipt) };
    },
    onSuccess: ({ receipt, earned }) => {
      // 받은 금액을 알리는 방법은 둘 중 하나다 — 오늘 표현을 다 끝낸 완료는 부른 쪽이 화면으로 보여 주고(earned),
      // 그 밖에는 화면 위에 잠깐 뜨는 표시로 알린다. 학습은 멈추지 않는다
      if (receipt && !earned) useEarnedPop.getState().show(receipt);
      // 전역 staleTime(30s)이 있어 명시적 무효화가 없으면 stale locked가 남는다
      void queryClient.invalidateQueries({ queryKey: expressionKeys.all });
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
      void queryClient.invalidateQueries({ queryKey: smallTalkKeys.all });
      // 홈에 돌아왔을 때 헤더의 금액이 이미 새 값이어야 늘어난 만큼 동전이 들어온다
      refreshRewardAfterCompletion(queryClient);
    },
  });
};
