'use client';

// 롤플레이 탭 화면 — 만든 시나리오가 없으면 상황 카드로 무엇을 하는 곳인지 보여 주고, 있으면 두 열 카드로 쌓는다.
// 만들기 버튼은 어느 쪽이든 바닥 같은 자리에 선다. 롤플레이는 프리미엄 전용이라 무료 사용자는 페이월로 간다
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { getDeviceToday } from '@/shared/lib/device-today';
import {
  ROLEPLAY_NEW_PATH,
  ROLEPLAY_PATH,
  roleplayTalkPath,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { Button } from '@/shared/ui/Button';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { RoleplayEmpty } from './RoleplayEmpty';
import { ScenarioCard } from './ScenarioCard';

export const RoleplayHome = () => {
  const router = useRouter();
  const t = useTranslations('roleplay.home');
  const { scenarios, error, retry } = useRoleplayScenariosQuery();
  const gate = usePaywallGate();
  // 서버 렌더엔 기기 시계가 없다 — 하이드레이션 뒤에 읽는다 (그 전엔 목록도 아직 없다)
  const today = useClientOnlyValue(getDeviceToday, '');

  const startCreate = () =>
    gate.guard(() => router.push(ROLEPLAY_NEW_PATH), {
      source: 'roleplay',
      returnTo: ROLEPLAY_PATH,
    });

  // 만든 시나리오로 다시 대화하는 것도 프리미엄이다 — 구독이 끝난 뒤 카드를 눌러도 막힌다
  const startTalk = (scenario: RoleplaySettings) =>
    gate.guard(() => router.push(roleplayTalkPath(scenario.id)), {
      source: 'roleplay',
      returnTo: ROLEPLAY_PATH,
    });

  if (error) {
    return (
      <RetryNotice
        fill
        screen="roleplay"
        message={t('loadError')}
        onRetry={retry}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[max(var(--safe-area-inset-bottom),24px)]">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {/* 목록이 오는 동안은 비워 둔다 — 빈 상태를 먼저 보였다가 카드로 바뀌면 없던 게 생긴 것처럼 보인다 */}
        {scenarios !== null &&
          (scenarios.length === 0 ? (
            <RoleplayEmpty />
          ) : (
            <section className="px-5 pt-2.5 pb-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {t('listTitle')}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {t('countLabel', { count: scenarios.length })}
                </span>
              </div>
              <ul className="mt-3.5 grid grid-cols-2 gap-3">
                {scenarios.map((scenario) => (
                  <li key={scenario.id}>
                    <ScenarioCard
                      scenario={scenario}
                      today={today}
                      onOpen={() => startTalk(scenario)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>

      <div className="px-5 pt-3">
        <Button onClick={startCreate}>{t('createButton')}</Button>
      </div>
    </div>
  );
};
