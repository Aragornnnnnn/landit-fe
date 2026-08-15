'use client';

// 피드백 작성 — 고른 유형에 맞춰 묻고, 다 쓰면 보낸 편지함으로 돌려보낸다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { reportError } from '@/shared/monitoring/report';
import { BackHeader } from '@/shared/ui/BackHeader';
import { showToast } from '@/shared/ui/toast';

import type { FeedbackType } from '../api/mailbox';
import { MAILBOX_COMPOSE_PATH, mailboxPath } from '../model/box';
import { FEEDBACK_TYPE_FACES } from '../model/feedback-type';
import { useSendFeedbackMutation } from '../model/useSendFeedbackMutation';
import { SubmitBar } from './compose/SubmitBar';

// 한 통에 담을 수 있는 길이. 넘겨 쓰게 두면 읽는 쪽도 보내는 쪽도 지친다
const MAX_LENGTH = 1000;

export const FeedbackComposeFlow = ({ type }: { type: FeedbackType }) => {
  const router = useRouter();
  const keyboardInset = useKeyboardInset();
  const [content, setContent] = useState('');
  const { mutateAsync: send, isPending: isSending } =
    useSendFeedbackMutation(type);

  // 느린 회선에서 보내는 동안 뒤로 나갈 수 있다. 그때 도착한 응답이 화면을 갈아끼우면
  // 유저가 고른 자리에서 보낸 편지함으로 끌려간다.
  // 켜는 일도 setup에서 한다 — StrictMode는 setup·cleanup·setup으로 도는데,
  // 첫 cleanup이 끈 값을 되살리지 않으면 개발 중엔 보낸 뒤 아무 일도 일어나지 않는다
  const isOnScreen = useRef(true);
  useEffect(() => {
    isOnScreen.current = true;
    return () => {
      isOnScreen.current = false;
    };
  }, []);

  const { question, placeholder, assurance } = FEEDBACK_TYPE_FACES[type];
  const trimmed = content.trim();

  const submit = async () => {
    if (!trimmed || isSending) return;

    try {
      await send(trimmed);
    } catch (error) {
      reportError(error);
      showToast('보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    // 보낸 뒤에만 남긴다 — 실패한 시도가 전송으로 집계되면 지표가 부풀고 반증도 안 된다.
    // 원문은 PII 위험이 있어 길이만 싣는다
    track(EVENTS.FEEDBACK_SUBMITTED, {
      feedback_type: type,
      length: trimmed.length,
    });
    // 이미 떠난 화면이면 여기까지. 편지는 갔고 알림도 남았다
    if (!isOnScreen.current) return;

    showToast('소중한 의견 고마워요!');
    // 방금 보낸 편지가 보이는 자리로 데려간다. replace라 뒤로가기가 작성 화면으로 되돌지 않는다
    router.replace(mailboxPath('sent'));
  };

  return (
    // 키보드가 가린 만큼 화면을 줄인다 — 웹뷰는 키보드가 떠도 dvh가 그대로라,
    // 안 줄이면 입력창 아랫부분과 보내기 바가 키보드 뒤로 숨는다.
    // 줄어드는 건 입력창뿐이고 질문은 맨 위에 그대로 남는다
    <main
      style={{ height: `calc(100dvh - ${keyboardInset}px)` }}
      className="mx-auto flex max-w-[430px] flex-col bg-background"
    >
      {/* 유형을 다시 고르러 간다. 되짚기로 두면 히스토리 없는 진입에서 막다른 화면이 된다 */}
      <BackHeader onBack={() => router.replace(MAILBOX_COMPOSE_PATH)} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
        <h1 className="mt-3 shrink-0 text-[22px] leading-snug font-bold whitespace-pre-line text-foreground">
          {question}
        </h1>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          // 들어오자마자 쓸 수 있게 초점을 준다. 질문은 위에 고정돼 있어 키보드가 올라와도 안 가린다
          autoFocus
          className="mt-6 h-[180px] w-full shrink-0 resize-none rounded-2xl border border-border bg-card p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        <p className="tossface mt-3 shrink-0 text-xs text-muted-foreground">
          {assurance}
        </p>
      </div>

      <SubmitBar
        disabled={!trimmed}
        loading={isSending}
        keyboardOpen={keyboardInset > 0}
        onClick={submit}
      />
    </main>
  );
};
