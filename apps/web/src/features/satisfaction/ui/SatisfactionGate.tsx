'use client';

// 소감 게이트 — 대화 소감(scenario·smalltalk)은 좋았어요 → 감사 후 닫히고, 아쉬웠어요 → 피드백 안내 → 편지함.
// 리뷰 요청(review)은 물을 게 없어 별점판으로 바로 열려 스토어로 보낸다.
// 띄울지 말지는 부르는 쪽(홈 탭의 useSatisfactionSheet)이 정하고, 여기서는 띄운 뒤의 흐름만 맡는다
import { useEffect, useState } from 'react';
import {
  EVENTS,
  type SatisfactionAnswer,
  type SatisfactionMoment,
} from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';
import { MAILBOX_COMPOSE_PATH } from '@/shared/lib/routes';

import {
  consumeAllTalkPending,
  recordSatisfactionAnswer,
} from '../model/prompt-record';
import { resolveReviewStore } from '../model/review-store';
import { SatisfactionSheet, type SatisfactionView } from './SatisfactionSheet';

// 좋았어요 뒤 감사 문구를 보여주는 시간 — 읽을 만큼만 두고 스스로 닫는다
export const THANKS_MS = 2000;

export const SatisfactionGate = ({
  moment,
}: {
  moment: SatisfactionMoment;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  // 리뷰 요청은 물을 게 없어 별점판으로 바로 연다
  const [view, setView] = useState<SatisfactionView>(
    moment === 'review' ? 'review' : 'ask',
  );

  // 노출을 계측하고, 이번 완료로 쌓인 차례를 모두 소비한다 — 같은 완료로 다른 시트가 또 뜨지 않게
  useEffect(() => {
    consumeAllTalkPending();
    track(EVENTS.SATISFACTION_PROMPT_VIEWED, { moment });
    // 마운트 때 한 번 — moment는 마운트 동안 안 바뀐다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 감사 문구는 잠시 보여주고 스스로 닫는다
  useEffect(() => {
    if (view !== 'thanks') return;
    const timer = setTimeout(() => setOpen(false), THANKS_MS);
    return () => clearTimeout(timer);
  }, [view]);

  const answer = (value: SatisfactionAnswer) => {
    recordSatisfactionAnswer(moment, value);
    track(EVENTS.SATISFACTION_PROMPT_ANSWERED, { moment, answer: value });
  };

  const good = () => {
    answer('good');
    setView('thanks');
  };

  const bad = () => {
    answer('bad');
    setView('letter');
  };

  // 딤·뒤로가기로 닫힘 — 아직 답을 안 남겼으면 dismiss로 남긴다. 리뷰 요청도 닫으면 그것으로 끝이다
  const close = () => {
    if (view === 'ask' || view === 'review') answer('dismiss');
    setOpen(false);
  };

  // 작성 흐름은 히스토리 한 층만 쓴다(편지함 규칙) — 보내고 뒤로가기하면 홈으로 나온다
  const sendFeedback = () => router.replace(MAILBOX_COMPOSE_PATH);

  // 스토어 리뷰 화면 — 앱 셸이면 스토어 앱, 브라우저면 스토어 웹. 누른 것으로 답을 남겨 다시 청하지 않는다
  const writeReview = () => {
    answer('good');
    const { url, store } = resolveReviewStore(
      getNativeContext()?.platform ?? null,
      navigator.userAgent,
    );
    track(EVENTS.REVIEW_STORE_OPENED, { store });
    setOpen(false);
    window.location.href = url;
  };

  // 시트는 닫힌 뒤에도 마운트를 유지한다 — 언마운트하면 아래로 내려가는 닫힘 연출이 잘린다
  return (
    <SatisfactionSheet
      open={open}
      moment={moment}
      view={view}
      onGood={good}
      onBad={bad}
      onSendFeedback={sendFeedback}
      onWriteReview={writeReview}
      onClose={close}
    />
  );
};
