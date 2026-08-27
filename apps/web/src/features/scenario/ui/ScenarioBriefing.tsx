'use client';

// 대화 진입 브리핑 — 시나리오 페이지 위를 카드(이미지·제목·설명)가 잠깐 덮고, 다 보여주면 onDone으로 대화 진입을 넘긴다
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';
import { Emoji } from '@/shared/ui/emoji';

import type { Scenario } from '../lib/to-scenario';

// 브리핑이 떠 있는 시간 — 연출이 아니라 글을 읽는 시간이라, 모션을 끈 사람에게도 똑같이 준다
export const briefingHoldMs = 3500;

export const ScenarioBriefing = ({
  scenario,
  onDone,
  onCancel,
}: {
  scenario: Scenario;
  onDone: () => void;
  // 뒤로가기로 진입을 물렀다 — 시트·모달과 같은 결로, 앱 종료 대신 이 카드를 닫는다
  onCancel: () => void;
}) => {
  const reduced = useReducedMotion() ?? false;
  const portalTarget = useClientOnlyValue(() => document.body, null);

  useEffect(() => {
    const timer = setTimeout(onDone, briefingHoldMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만
  }, []);

  useEffect(() => registerOpenSheet(onCancel));

  if (!portalTarget) return null;

  // 다른 오버레이(시트·모달·소환)와 같이 body로 포탈한다 — 페이지 쪽 스택 컨텍스트에 갇히지 않게
  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black/55"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[430px] flex-1 items-center justify-center px-6 py-10">
        {/* 카드 내려앉기 — 홈 TodayCard의 Arrival과 같은 어휘 */}
        <motion.div
          className="flex h-full max-h-[620px] w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md"
          initial={reduced ? false : { y: -90, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 210,
            damping: 14,
            mass: 0.9,
          }}
        >
          {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다 (홈 카드와 동일) */}
          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-foreground">
            {scenario.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
              <img
                src={scenario.thumbnailUrl}
                alt={scenario.scenarioTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <Emoji className="text-6xl">💬</Emoji>
              </div>
            )}
          </div>

          <div className="flex flex-none flex-col px-5 pt-5 pb-7">
            <p className="text-2xl leading-snug font-extrabold text-foreground">
              {scenario.scenarioTitle}
            </p>
            {scenario.briefing && (
              <p className="mt-2 text-base leading-relaxed font-medium text-muted-foreground">
                {scenario.briefing}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>,
    portalTarget,
  );
};
