'use client';

// 피드백 작성 — 고른 유형에 맞춰 묻고, 다 쓰면 보낸 편지함으로 돌려보낸다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { BackHeader } from '@/shared/ui/BackHeader';
import { showToast } from '@/shared/ui/toast';

import type { FeedbackType } from '../api/mailbox';
import { mailboxPath } from '../model/box';
import {
  FEEDBACK_TYPE_FACES,
  MAILBOX_COMPOSE_PATH,
} from '../model/feedback-type';
import { useSendFeedbackMutation } from '../model/useSendFeedbackMutation';
import { SubmitBar } from './compose/SubmitBar';

// 한 통에 담을 수 있는 길이. 넘겨 쓰게 두면 읽는 쪽도 보내는 쪽도 지친다
const MAX_LENGTH = 1000;

export const FeedbackComposeFlow = ({ type }: { type: FeedbackType }) => {
  const router = useRouter();
  const keyboardInset = useKeyboardInset();
  const [content, setContent] = useState('');
  const { mutate: send, isPending: isSending } = useSendFeedbackMutation(type);

  const { question, placeholder, assurance } = FEEDBACK_TYPE_FACES[type];
  const trimmed = content.trim();

  const submit = () => {
    if (!trimmed || isSending) return;

    // 이 콜백들은 화면이 사라지면 불리지 않는다(React Query) — 느린 회선에서 보내는 동안 뒤로 나가도
    // 뒤늦게 도착한 응답이 유저가 고른 자리에서 보낸 편지함으로 끌고 가지 않는다
    send(trimmed, {
      onSuccess: () => {
        showToast('소중한 의견 고마워요!');
        // 방금 보낸 편지가 보이는 자리로 데려간다. replace라 뒤로가기가 작성 화면으로 되돌지 않는다
        router.replace(mailboxPath('sent'));
      },
      onError: () => showToast('보내지 못했어요. 잠시 후 다시 시도해 주세요.'),
    });
  };

  return (
    // 키보드가 가린 만큼 화면을 줄인다 — 웹뷰는 키보드가 떠도 dvh가 그대로라,
    // 안 줄이면 입력창 아랫부분과 보내기 바가 키보드 뒤로 숨는다.
    // 줄어드는 건 입력창뿐이고 질문은 맨 위에 그대로 남는다
    <main
      style={{ height: `calc(100dvh - ${keyboardInset}px)` }}
      className="mx-auto flex max-w-[430px] flex-col bg-background"
    >
      {/* 유형을 다시 고르러 간다 — 한 층이라 되짚지 않고 갈아끼운다 */}
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
