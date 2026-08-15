'use client';

// 피드백 유형 선택 — 무슨 말을 하러 왔는지 먼저 고르게 한다.
// 유형을 알아야 다음 화면이 알맞게 물을 수 있고, 보낸 편지의 제목도 이 선택이 된다
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { MAILBOX_PATH } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import type { FeedbackType } from '../api/mailbox';
import { feedbackComposePath } from '../model/box';
import { FEEDBACK_TYPE_FACES, FEEDBACK_TYPES } from '../model/feedback-type';

export const FeedbackTypeFlow = () => {
  const router = useRouter();

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      {/* 되짚기로 두면 히스토리 없는 진입에서 화살표가 아무 일도 하지 않는다 */}
      <BackHeader onBack={() => router.replace(MAILBOX_PATH)} />

      <div className="flex-1 overflow-y-auto px-5">
        <h1 className="mt-4 text-[22px] leading-snug font-bold text-foreground">
          어떤 피드백을
          <br />
          개발자에게 보낼까요?
        </h1>

        <ul className="mt-7 flex flex-col gap-2.5">
          {FEEDBACK_TYPES.map((type) => (
            <li key={type}>
              <FeedbackTypeRow type={type} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

const FeedbackTypeRow = ({ type }: { type: FeedbackType }) => {
  const { emoji, label } = FEEDBACK_TYPE_FACES[type];

  return (
    <Link
      href={feedbackComposePath(type)}
      onClick={() =>
        track(EVENTS.FEEDBACK_TYPE_SELECTED, { feedback_type: type })
      }
      className="flex h-[58px] items-center gap-4 rounded-2xl bg-secondary px-4 transition-transform active:scale-[0.98]"
    >
      <span aria-hidden className="tossface text-[22px]">
        {emoji}
      </span>
      <span className="flex-1 text-[15px] font-semibold text-foreground">
        {label}
      </span>
      <ChevronRightIcon size={18} className="text-muted-foreground" />
    </Link>
  );
};
