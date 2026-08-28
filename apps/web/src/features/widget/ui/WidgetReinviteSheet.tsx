// 위젯 재유도 시트 — 설치를 미룬 사람에게 대화를 마친 직후 한 번 더 청한다. 설명은 하지 않는다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import { WidgetPreviewMedium, WidgetPreviewSmall } from './WidgetPreviewCard';

// 위젯 두 장은 시트가 멈춘 뒤 60ms 간격으로 나타난다
const previewFade = (order: number, reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0.28 + order * 0.06 },
      };

export const WidgetReinviteSheet = ({
  open,
  onInstall,
  onDismiss,
}: {
  open: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <BottomSheet open={open} onClose={onDismiss}>
      <h2 className="text-[22px] font-bold text-foreground">
        오늘 열매, 홈에서도 보고 싶다면
      </h2>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        위젯을 올려두면 며칠째인지 바로 보여요
      </p>

      <div className="flex items-center justify-center gap-4 py-7">
        <motion.div {...previewFade(0, reduced)}>
          <WidgetPreviewSmall size={118} />
        </motion.div>
        <motion.div {...previewFade(1, reduced)}>
          <WidgetPreviewMedium width={192} />
        </motion.div>
      </div>

      <Button onClick={onInstall}>위젯 추가하기</Button>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 flex h-12 w-full items-center justify-center text-[15px] font-medium text-muted-foreground"
      >
        나중에 하기
      </button>
    </BottomSheet>
  );
};
