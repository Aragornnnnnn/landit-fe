'use client';

// 전역 토스트 — showToast()로 어디서든 짧은 안내를 띄운다. Toaster는 루트 레이아웃에 하나만 마운트
import { Fragment, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';

import { splitSentences } from './split-sentences';

// 노출 시간 — 종료 재입력 대기(BridgeListener) 등 외부 타이머와 맞출 때 참조한다
export const TOAST_MS = 2000;

// 키보드가 올라와 있을 때 토스트와 키보드 사이 간격
const KEYBOARD_GAP_PX = 16;

// 시스템이 실패했으면 error, 사용자가 고쳐서 다시 하면 되면 warning, 동작이 끝났으면 success,
// 그냥 알려주기만 하면 default(아이콘 없음)
export type ToastTone = 'default' | 'success' | 'warning' | 'error';

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  expiresAt: number;
};

let listener: ((message: string, tone: ToastTone) => void) | null = null;

// 컴포넌트 밖(훅·이벤트 핸들러)에서도 호출 가능. Toaster가 없으면 조용히 무시된다(테스트 등)
export const showToast = (message: string, tone: ToastTone = 'default') =>
  listener?.(message, tone);

export const Toaster = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const reduced = useReducedMotion() ?? false;
  // 웹뷰는 키보드가 올라와도 화면 아래가 그대로라 토스트가 키보드 뒤에 숨는다 — 키보드 위로 올린다
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    // 같은 안내가 떠 있으면 새로 그리지 않고 떠 있는 시간만 늘린다 — 새로 그리면 사라졌다 나타나며 번쩍인다
    listener = (message, tone) =>
      setToast((current) =>
        current?.message === message && current.tone === tone
          ? { ...current, expiresAt: Date.now() + TOAST_MS }
          : { id: Date.now(), message, tone, expiresAt: Date.now() + TOAST_MS },
      );
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.expiresAt - Date.now(),
    );
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    // 센터링은 바깥 div가 맡는다 — motion이 주입하는 transform(y)이 -translate-x-1/2를 덮어쓰지 않게
    // 모달·시트(z-50)보다 위에 — 같은 층이면 나중에 붙는 포털에 가려 딤 뒤로 가라앉는다
    <div
      style={
        keyboardInset > 0
          ? { bottom: keyboardInset + KEYBOARD_GAP_PX }
          : undefined
      }
      // 너비는 글자만큼(w-max), 화면 양옆 16px 안에서 줄바꿈 — fixed라 left-1/2 기준이면 화면 절반에서 꺾인다
      className="pointer-events-none fixed bottom-[max(var(--safe-area-inset-bottom),24px)] left-1/2 z-[60] w-max max-w-[calc(100vw-32px)] -translate-x-1/2"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p
              className={`flex items-center gap-2 rounded-[20px] bg-toast/92 py-2.5 pr-4 text-sm font-semibold text-background ${toast.tone === 'default' ? 'pl-4' : 'pl-2.5'}`}
            >
              {toast.tone !== 'default' && (
                <ToastIcon tone={toast.tone} reduced={reduced} />
              )}
              {/* 문장마다 한 덩어리(inline-block)라 넘치면 문장 사이에서 꺾인다. 문장이 한 줄보다 길 때만 그 안에서
                 한국어는 어절·일본어는 구절 단위로 꺾는다(auto-phrase는 지원 브라우저만) */}
              <span className="text-balance [&:lang(ja)]:[word-break:auto-phrase] [&:lang(ko)]:break-keep">
                {splitSentences(toast.message).map((sentence, i) => (
                  <Fragment key={i}>
                    <span className="inline-block">{sentence.trimEnd()}</span>
                    {sentence !== sentence.trimEnd() && ' '}
                  </Fragment>
                ))}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 원이 튀어나온 뒤 체크·느낌표·X 선이 그려진다 — 0.4초 안에 끝나야 2초 노출 중에 다 보인다
type IconTone = Exclude<ToastTone, 'default'>;

const ICON_FILL: Record<IconTone, string> = {
  success: 'fill-toast-success',
  warning: 'fill-toast-warning',
  error: 'fill-toast-error',
};

const ICON_LABEL_KEY = {
  success: 'successLabel',
  warning: 'warningLabel',
  error: 'errorLabel',
} as const satisfies Record<IconTone, string>;

const ToastIcon = ({ tone, reduced }: { tone: IconTone; reduced: boolean }) => {
  const t = useTranslations('common.toast');
  // 동작 줄이기면 처음부터 완성된 모습으로 그린다
  const drawStroke = (delay: number) =>
    reduced
      ? { initial: false as const }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { delay, duration: 0.16, ease: 'easeOut' as const },
        };

  return (
    <svg
      role="img"
      aria-label={t(ICON_LABEL_KEY[tone])}
      viewBox="0 0 20 20"
      className="size-5 shrink-0 overflow-visible"
    >
      <motion.circle
        cx={10}
        cy={10}
        r={10}
        className={ICON_FILL[tone]}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      />
      <g
        fill="none"
        stroke="white"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === 'success' && (
          <motion.path d="M6 10.4l2.7 2.7L14.2 7.4" {...drawStroke(0.14)} />
        )}
        {tone === 'warning' && (
          <>
            <motion.path d="M10 5.6v5.2" {...drawStroke(0.12)} />
            {/* 점은 선이 그려진 뒤 톡 찍힌다 */}
            <motion.circle
              cx={10}
              cy={14.3}
              r={1.25}
              fill="white"
              stroke="none"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.26,
                type: 'spring',
                stiffness: 600,
                damping: 20,
              }}
            />
          </>
        )}
        {tone === 'error' && (
          <>
            <motion.path d="M7 7l6 6" {...drawStroke(0.12)} />
            <motion.path d="M13 7l-6 6" {...drawStroke(0.22)} />
          </>
        )}
      </g>
    </svg>
  );
};
