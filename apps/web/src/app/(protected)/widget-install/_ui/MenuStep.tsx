// iOS / 2 위젯 추가 — 편집 캡슐이 눌리고 메뉴가 펼쳐진다. 첫 항목(위젯 추가)을 톡톡 눌러 짚는다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import {
  AppSlots,
  Capsule,
  GuideScaffold,
  PhoneMockup,
  TouchPulse,
} from './GuideScaffold';

// 배경은 꽉 찬 홈 화면 — 메뉴가 좌상단을 덮고 나머지 아이콘이 뒤로 비친다
const APP_SLOTS = [
  [24, 62],
  [105, 62],
  [186, 62],
  [24, 143],
  [105, 143],
  [186, 143],
  [24, 224],
  [105, 224],
  [186, 224],
] as const;

// 캡슐이 먼저 눌리고, 그 반동으로 메뉴가 열린다
const PRESS_MS = 0.2;

export const MenuStep = ({ onNext }: { onNext: () => void }) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <GuideScaffold
      title={
        <>
          편집을 누르고
          <br />
          위젯 추가를 골라주세요
        </>
      }
      subtitle="왼쪽 위에 편집 버튼이 나타나요"
      cta="다음"
      onCta={onNext}
    >
      <PhoneMockup>
        <AppSlots slots={APP_SLOTS} />

        {/* 편집 캡슐이 0.96으로 눌렸다 돌아온다 */}
        <motion.div
          initial={reduced ? false : { scale: 1 }}
          animate={reduced ? {} : { scale: [1, 0.96, 1] }}
          transition={{ duration: PRESS_MS, ease: 'easeOut' }}
          className="absolute"
        >
          <Capsule left={16} highlight>
            편집
          </Capsule>
        </motion.div>
        <Capsule left={186}>완료</Capsule>

        {/* 메뉴가 캡슐 아래 좌상단 기준으로 펼쳐진다 — 첫 항목만 밝게, 색이 아니라 밝기로 짚는다 */}
        <motion.div
          className="absolute top-[50px] left-[16px] w-[178px] origin-top-left overflow-hidden rounded-[18px] border border-[#dfe6ef] bg-white/95 shadow-[0_4px_12px_rgba(38,51,77,0.14)]"
          initial={reduced ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut', delay: PRESS_MS }}
        >
          {/* 첫 항목(위젯 추가)이 눌리는 하이라이트를 되풀이한다 — 여기를 고르라는 신호 */}
          <motion.div
            className="flex h-8 items-center pl-3.5 text-[12px] font-semibold text-[#3c4654]"
            initial={false}
            animate={
              reduced
                ? { backgroundColor: '#eef3f9' }
                : { backgroundColor: ['#ffffff', '#e3ecf7', '#ffffff'] }
            }
            transition={
              reduced
                ? undefined
                : { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            위젯 추가
          </motion.div>
          <div className="h-8" />
          <div className="h-8" />
        </motion.div>

        {/* 손끝이 위젯 추가 항목을 톡톡 누른다 — 물결로 클릭을 짚어준다 */}
        {!reduced && <TouchPulse left={150} top={52} size={30} mode="tap" />}
      </PhoneMockup>
    </GuideScaffold>
  );
};
