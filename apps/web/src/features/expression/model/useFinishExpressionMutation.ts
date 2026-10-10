// 표현 학습 완료 처리 — 완료가 바꾸는 목록(표현·시나리오·스몰톡)과 환급을 새로 받게 한다
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 표현 완료가 환급액도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { useEarnedPop } from '@/features/reward/model/earned-pop';
import { refreshRewardAfterCompletion } from '@/features/reward/model/refresh-reward';
import { scenarioKeys } from '@/features/scenario/model/keys';
// 스몰톡 표현의 완료 여부는 그 대화의 세션 상세가 들고 있다 — 목록 주인이 둘이라 양쪽을 다 턴다
import { smallTalkKeys } from '@/features/small-talk/model/keys';

import { finishExpression } from '../api/finish';
import { expressionKeys } from './keys';

export const useFinishExpressionMutation = (
  expressionId: number,
  freeTalkSessionId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finishExpression(expressionId, freeTalkSessionId),
    onSuccess: (response) => {
      // 환급 참여자는 표현 하나마다 받은 금액이 화면 위에 잠깐 뜬다 — 학습은 멈추지 않는다
      // 응답 몸통이 비어 와도 완료 후속은 돌아야 한다
      if (response?.reward) useEarnedPop.getState().show(response.reward);
      // 전역 staleTime(30s)이 있어 명시적 무효화가 없으면 stale locked가 남는다
      void queryClient.invalidateQueries({ queryKey: expressionKeys.all });
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
      void queryClient.invalidateQueries({ queryKey: smallTalkKeys.all });
      // 홈에 돌아왔을 때 헤더의 금액이 이미 새 값이어야 늘어난 만큼 동전이 들어온다
      refreshRewardAfterCompletion(queryClient);
    },
  });
};
