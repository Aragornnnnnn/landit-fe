// iOS / 3 랜딧 검색 — 갤러리 시트가 올라오고, 검색어가 찍히면 랜딧 위젯들이 차례로 나타난다
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import {
  WidgetPreviewMedium,
  WidgetPreviewSmall,
} from '@/features/widget/ui/WidgetPreviewCard';

import { GuideScaffold, PhoneMockup } from './GuideScaffold';

const QUERY = 'landit';
// 시트(250ms)가 멈춘 뒤 타이핑이 시작되고(글자당 80ms), 다 찍히면 결과가 60ms 간격으로 나타난다
const SHEET_MS = 0.25;
const TYPE_MS = 80;
const RESULTS_AT = SHEET_MS + (QUERY.length * TYPE_MS) / 1000 + 0.1;

// 검색 결과 카드가 위에서부터 차례로 페이드인
const resultFade = (order: number, reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: RESULTS_AT + order * 0.06 },
      };

const SizeCaption = ({ size }: { size: string }) => (
  <span className="flex flex-col items-center gap-px">
    <span className="text-[10px] font-bold text-[#1c1c1e]">{size}</span>
    <span className="text-[9px] font-medium text-[#8e8e93]">대화 스트릭</span>
  </span>
);

export const SearchStep = ({ onDone }: { onDone: () => void }) => {
  const reduced = useReducedMotion() ?? false;
  const [typed, setTyped] = useState(reduced ? QUERY : '');

  // 검색창에 한 글자씩 찍는다 — 시트가 자리잡은 뒤 시작하고, 다 친 뒤 잠깐 두었다
  // 지우고 다시 친다. 늦게 본 사람도 "landit이라고 검색하는구나"를 놓치지 않게 되풀이한다
  useEffect(() => {
    if (reduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval>;

    const typeOnce = () => {
      let count = 0;
      interval = setInterval(() => {
        count += 1;
        setTyped(QUERY.slice(0, count));
        if (count < QUERY.length) return;
        clearInterval(interval);
        // 다 쳤으면 잠깐 보여준 뒤 지우고 다음 사이클을 예약한다
        timers.push(
          setTimeout(() => {
            setTyped('');
            timers.push(setTimeout(typeOnce, 600));
          }, 1800),
        );
      }, TYPE_MS);
    };

    timers.push(setTimeout(typeOnce, SHEET_MS * 1000));
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [reduced]);

  return (
    <GuideScaffold
      title={
        <>
          landit을 검색해서
          <br />
          위젯을 골라주세요
        </>
      }
      subtitle="크기는 세 가지 중에 고를 수 있어요"
      cta="홈 화면으로 가기"
      onCta={onDone}
    >
      <PhoneMockup>
        {/* 위젯 갤러리 시트 — 아래에서 올라온다. 마지막 카드는 일부러 잘려 더 있음을 알린다 */}
        <motion.div
          className="absolute top-[24px] left-0 h-[406px] w-full rounded-t-[20px] bg-[#f1f1f3]"
          initial={reduced ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: SHEET_MS, ease: 'easeOut' }}
        >
          <div className="absolute top-2 left-1/2 h-1 w-[34px] -translate-x-1/2 rounded-[2px] bg-[#c9c9ce]" />

          <div className="absolute top-[22px] left-[24px] flex h-[34px] w-[214px] items-center gap-2 rounded-full bg-white px-3">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle
                cx="5.5"
                cy="5.5"
                r="4.5"
                stroke="#8e8e93"
                strokeWidth="1.6"
              />
              <path
                d="M9 9l3 3"
                stroke="#8e8e93"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px] font-medium text-[#1c1c1e]">
              {typed}
            </span>
          </div>

          <motion.div
            className="absolute top-[62px] left-[72px]"
            {...resultFade(0, reduced)}
          >
            <WidgetPreviewSmall size={118} />
          </motion.div>
          <motion.div
            className="absolute top-[188px] left-1/2 -translate-x-1/2"
            {...resultFade(1, reduced)}
          >
            <SizeCaption size="2 x 2" />
          </motion.div>
          <motion.div
            className="absolute top-[232px] left-[24px]"
            {...resultFade(2, reduced)}
          >
            <WidgetPreviewMedium />
          </motion.div>
          <motion.div
            className="absolute top-[340px] left-1/2 -translate-x-1/2"
            {...resultFade(3, reduced)}
          >
            <SizeCaption size="4 x 2" />
          </motion.div>
        </motion.div>
      </PhoneMockup>
    </GuideScaffold>
  );
};
