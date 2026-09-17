'use client';

// 구독 해지 사유 플로우 — 구독 관리의 "구독 해지하기"가 여기로 온다. 스토어로 나가기 전에 사유를 묻고(①) 사유별 화면(②·③)을 거친다.
// 갱신되는 구독(체험·구독 중)에만 열린다. 해지 예약·프로모션 부여·유료 아님은 구독 관리로 돌려보낸다
import { useEffect, useState } from 'react';
import {
  EVENTS,
  type CancelReason,
  type CancelStayDestination,
  type StudyMethod,
} from '@landit/analytics';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { LEVEL_NAMES } from '@/features/feedback/model/level-assessment';
import { toEnglishLevel } from '@/features/onboarding/model/english-level';
import { useLearningLevelQuery } from '@/features/onboarding/model/useLearningLevelQuery';
import { getStreakCalendar } from '@/features/streak/api/streak';
import { streakKeys } from '@/features/streak/model/keys';
import type { MySubscription } from '@/features/subscription/api/subscription';
import {
  resolveStorePlatform,
  STORE,
} from '@/features/subscription/model/store-links';
import {
  summarizeSubscription,
  type PaidSubscriptionSummary,
} from '@/features/subscription/model/subscription-summary';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import {
  backOrReplace,
  MAILBOX_COMPOSE_PATH,
  SUBSCRIPTION_MANAGE_PATH,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { BackHeader } from '@/shared/ui/BackHeader';

import {
  EMPTY_DRAFT,
  stepAfterMethod,
  stepAfterReason,
  stepBefore,
  type CancelDraft,
  type CancelStep,
} from '../_model/cancel-flow';
import {
  methodRetentionContent,
  retentionContent,
} from '../_model/retention-content';
import { MethodStep } from './MethodStep';
import { ReasonStep } from './ReasonStep';
import { RetentionStep } from './RetentionStep';

// 스토어에서 해지할 구독이 있는 상태만 — 갱신되는 체험·구독. 해지 예약은 되돌리는 쪽이고 프로모션은 스토어에 구독이 없다
const canCancel = (
  summary: ReturnType<typeof summarizeSubscription>,
): summary is PaidSubscriptionSummary =>
  summary.kind !== 'none' && summary.kind !== 'canceled' && summary.renews;

interface FlowProps {
  summary: PaidSubscriptionSummary;
  /** BE가 준 결제 스토어 — 셸 플랫폼보다 우선한다 (구독 관리와 같은 규칙) */
  paidStore: MySubscription['store'];
}

const Flow = ({ summary, paidStore }: FlowProps) => {
  const router = useRouter();
  const [step, setStep] = useState<CancelStep>({ kind: 'reason' });
  const [draft, setDraft] = useState<CancelDraft>(EMPTY_DRAFT);

  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  const store = STORE[resolveStorePlatform(paidStore, context?.platform)];
  const nickname = useAuthStore(
    (state) => state.member?.nickname?.trim() || '게스트',
  );
  // 실력 안 늚 화면의 카드 — 누적 학습일은 스트릭 달력에서, 레벨은 학습 수준에서
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const { data: calendar } = useQuery({
    queryKey: streakKeys.calendar(userId, null),
    queryFn: () => getStreakCalendar(null),
    enabled: userId !== null,
  });
  const { data: profile } = useLearningLevelQuery();
  const level = toEnglishLevel(profile?.learningLevel ?? null);

  const leaveToManage = () => backOrReplace(router, SUBSCRIPTION_MANAGE_PATH);

  const proceedFromReason = () => {
    const { reason } = draft;
    if (!reason) return;
    track(EVENTS.CANCEL_REASON_SELECTED, {
      reason,
      ...(reason === 'other' && { other_text: draft.otherText.trim() }),
    });
    const next = stepAfterReason(reason);
    if (next.kind === 'retention') {
      track(EVENTS.CANCEL_RETENTION_VIEWED, {
        reason,
        ...(reason === 'price' && summary.plan && { plan: summary.plan }),
      });
    }
    setStep(next);
  };

  const proceedFromMethod = () => {
    const { method } = draft;
    if (!method) return;
    track(EVENTS.CANCEL_METHOD_SELECTED, { method });
    track(EVENTS.CANCEL_RETENTION_VIEWED, { reason: 'other_method', method });
    setStep(stepAfterMethod(method));
  };

  // 남기 — 어느 화면에서 남았는지는 스텝이 안다. 구독 관리로 돌아가거나 편지함으로
  const stay = (
    reason: CancelReason,
    to: CancelStayDestination,
    method?: StudyMethod,
  ) => {
    track(EVENTS.CANCEL_STAY_TAPPED, {
      reason,
      ...(method && { method }),
      to,
    });
    if (to === 'mailbox') router.push(MAILBOX_COMPOSE_PATH);
    else leaveToManage();
  };

  const back = () => {
    const previous = stepBefore(step);
    if (previous) setStep(previous);
    else leaveToManage();
  };

  // 스토어로 나가는 작은 링크 — 이동은 링크가 하고 여기서는 어느 사유·방법에서 나갔는지만 남긴다
  const leaveLink = (
    <a
      href={store.manageUrl}
      className="underline"
      onClick={() =>
        track(EVENTS.STORE_SUBSCRIPTION_TAPPED, {
          status: summary.kind,
          action: 'cancel',
          ...(draft.reason && { reason: draft.reason }),
          ...(draft.method && { method: draft.method }),
        })
      }
    >
      그래도 해지하러 가기
    </a>
  );

  const body = () => {
    switch (step.kind) {
      case 'reason':
        return (
          <ReasonStep
            draft={draft}
            onReason={(reason) => setDraft({ ...draft, reason })}
            onOtherText={(otherText) => setDraft({ ...draft, otherText })}
            onNext={proceedFromReason}
            onStay={leaveToManage}
          />
        );
      case 'method':
        return (
          <MethodStep
            method={draft.method}
            onMethod={(method) => setDraft({ ...draft, method })}
            onNext={proceedFromMethod}
            leaveLink={leaveLink}
          />
        );
      case 'retention': {
        const content = retentionContent(step.reason, {
          summary,
          nickname,
          totalActiveDays: calendar?.totalActiveDays ?? null,
          levelLabel: level ? `${LEVEL_NAMES[level]} Lv.${level}` : null,
          otherText: draft.otherText,
        });
        return (
          <RetentionStep
            content={content}
            onPrimary={() => stay(step.reason, content.primary.to)}
            leaveLink={leaveLink}
          />
        );
      }
      case 'method_retention': {
        const content = methodRetentionContent(step.method);
        return (
          <RetentionStep
            content={content}
            onPrimary={() =>
              stay('other_method', content.primary.to, step.method)
            }
            leaveLink={leaveLink}
          />
        );
      }
    }
  };

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader title="구독 해지" onBack={back} />
      {body()}
    </main>
  );
};

export const CancelFlowScreen = () => {
  const router = useRouter();
  const { subscription, isPending, isError } = useSubscriptionQuery();
  const summary = summarizeSubscription(subscription);
  const eligible = canCancel(summary);

  // 여기서 해지할 구독이 없으면 구독 관리로 — 그쪽이 상태에 맞는 행(해지 취소·페이월)을 보여준다
  useEffect(() => {
    if (!isPending && !eligible) router.replace(SUBSCRIPTION_MANAGE_PATH);
  }, [isPending, eligible, router]);

  if (isPending || isError || !eligible) {
    return (
      <main className="flex h-dvh flex-col bg-background">
        <BackHeader
          title="구독 해지"
          onBack={() => backOrReplace(router, SUBSCRIPTION_MANAGE_PATH)}
        />
      </main>
    );
  }
  return <Flow summary={summary} paidStore={subscription?.store} />;
};
