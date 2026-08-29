// iOS / 3 랜딧 검색 — landit을 검색해 결과에서 앱을 누르면, 그제야 위젯 크기 목록이 펼쳐진다
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import {
  WidgetPreviewMedium,
  WidgetPreviewSmall,
} from '@/features/widget/ui/WidgetPreviewCard';

import { GuideScaffold, PhoneMockup, TouchPulse } from './GuideScaffold';

const QUERY = 'landit';
const SHEET_MS = 0.25;
const TYPE_MS = 80;
// 다 친 뒤 결과 행이 떠 있는 걸 보여주는 시간 — 이 사이 손끝이 행을 누른다
const RESULT_TAP_MS = 1500;

const SizeCaption = ({ size }: { size: string }) => (
  <span className="flex flex-col items-center gap-px">
    <span className="text-[10px] font-bold text-[#1c1c1e]">{size}</span>
    <span className="text-[9px] font-medium text-[#8e8e93]">대화 스트릭</span>
  </span>
);

// 위젯 카드가 위에서부터 차례로 페이드인
const cardFade = (order: number, reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: order * 0.06 },
      };

export const SearchStep = ({ onDone }: { onDone: () => void }) => {
  const reduced = useReducedMotion() ?? false;
  const [typed, setTyped] = useState(reduced ? QUERY : '');
  // 'search' = 검색 결과에서 landit 앱을 고르는 중, 'widgets' = 위젯 크기 목록이 펼쳐짐
  const [view, setView] = useState<'search' | 'widgets'>(
    reduced ? 'widgets' : 'search',
  );

  // landit을 한 글자씩 친 뒤 결과 행을 톡 누르면 위젯 목록으로 넘어간다
  useEffect(() => {
    if (reduced) return;
    let count = 0;
    let typing: ReturnType<typeof setInterval>;
    let toWidgets: ReturnType<typeof setTimeout>;
    const start = setTimeout(() => {
      typing = setInterval(() => {
        count += 1;
        setTyped(QUERY.slice(0, count));
        if (count < QUERY.length) return;
        clearInterval(typing);
        // 다 쳤으면 결과 행이 떠 있는 걸 잠깐 보여준 뒤(손끝이 누른다) 위젯 목록으로
        toWidgets = setTimeout(() => setView('widgets'), RESULT_TAP_MS);
      }, TYPE_MS);
    }, SHEET_MS * 1000);
    return () => {
      clearTimeout(start);
      clearInterval(typing);
      clearTimeout(toWidgets);
    };
  }, [reduced]);

  const typedFull = typed === QUERY;

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
        {/* 위젯 갤러리 시트 — 아래에서 올라온다 */}
        <motion.div
          className="absolute top-[24px] left-0 h-[406px] w-full overflow-hidden rounded-t-[20px] bg-[#f1f1f3]"
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

          {/* 검색 결과: landit 앱 한 줄 — 이걸 눌러야 위젯 크기 목록이 열린다 */}
          {view === 'search' && typedFull && (
            <motion.div
              className="absolute top-[68px] left-[24px] flex h-[52px] w-[214px] items-center gap-2.5 rounded-[14px] bg-white px-3"
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="flex size-[38px] items-center justify-center rounded-[9px] bg-gradient-to-b from-[#f0912a] to-[#e07a3a] text-[15px] font-black text-white">
                L
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-bold text-[#1c1c1e]">
                  landit
                </span>
                <span className="text-[10px] font-medium text-[#8e8e93]">
                  대화 스트릭 위젯
                </span>
              </span>
              {/* 손끝이 결과 행을 톡 누른다 */}
              {!reduced && (
                <TouchPulse left={168} top={11} size={30} mode="tap" />
              )}
            </motion.div>
          )}

          {/* landit을 누른 뒤 펼쳐지는 위젯 크기 목록 */}
          {view === 'widgets' && (
            <>
              <motion.div
                className="absolute top-[62px] left-[72px]"
                {...cardFade(0, reduced)}
              >
                <WidgetPreviewSmall size={118} />
              </motion.div>
              <motion.div
                className="absolute top-[188px] left-1/2 -translate-x-1/2"
                {...cardFade(1, reduced)}
              >
                <SizeCaption size="2 x 2" />
              </motion.div>
              <motion.div
                className="absolute top-[232px] left-[24px]"
                {...cardFade(2, reduced)}
              >
                <WidgetPreviewMedium />
              </motion.div>
              <motion.div
                className="absolute top-[340px] left-1/2 -translate-x-1/2"
                {...cardFade(3, reduced)}
              >
                <SizeCaption size="4 x 2" />
              </motion.div>
            </>
          )}
        </motion.div>
      </PhoneMockup>
    </GuideScaffold>
  );
};
