'use client';

// 소감 게이트 — 그 순간에 딱 한 번 묻는다. 첫 소감(scenario·smalltalk)은 좋았어요 → 감사 후 닫힘,
// 랜딧 소감(app)은 잘 쓰고 있어요 → 별점판 → 스토어 리뷰. 아쉬웠어요는 어느 순간이든 피드백 안내 → 편지함.
// 첫 소감은 여기서 물을 차례인지 판단하고, 랜딧 소감은 스트릭 조건까지 본 띄우는 쪽(홈의 useHomeSheet)이 판단해 마운트한다
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
  consumeTalkPending,
  recordSatisfactionAnswer,
  shouldAskSatisfaction,
} from '../model/prompt-record';
import { resolveReviewStore } from '../model/review-store';
import { SatisfactionSheet, type SatisfactionView } from './SatisfactionSheet';

// 좋았어요 뒤 감사 문구를 보여주는 시간 — 읽을 만큼만 두고 스스로 닫는다
export const THANKS_MS = 2000;

// 랜딧 소감은 시나리오 대화의 완료 차례를 쓴다 — 띄우는 순간 그 차례를 소비해 같은 완료로 첫 소감이 또 뜨지 않게 한다
const pendingTalkOf = (moment: SatisfactionMoment) =>
  moment === 'app' ? 'scenario' : moment;

export const SatisfactionGate = ({
  moment,
}: {
  moment: SatisfactionMoment;
}) => {
  const router = useRouter();
  // 마운트 시점에 한 번만 판단한다 — 서버에선 localStorage가 없어 false, 클라이언트 첫 렌더에서 결정된다.
  // app은 띄우기로 결정된 뒤에만 마운트되므로 바로 연다
  const [open, setOpen] = useState(
    () => moment === 'app' || shouldAskSatisfaction(moment),
  );
  const [view, setView] = useState<SatisfactionView>('ask');

  // 열리면 노출을 계측하고 이번 완료의 차례를 소비한다 — 같은 완료로 다른 시트가 또 뜨지 않게
  useEffect(() => {
    if (!open) return;
    consumeTalkPending(pendingTalkOf(moment));
    track(EVENTS.SATISFACTION_PROMPT_VIEWED, { moment });
    // 처음 열릴 때 한 번 — moment는 마운트 동안 안 바뀐다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    setView(moment === 'app' ? 'review' : 'thanks');
  };

  const bad = () => {
    answer('bad');
    setView('letter');
  };

  // 딤·뒤로가기로 닫힘 — 아직 안 골랐으면 dismiss로 남기고, 이미 골랐으면 답을 덮지 않는다
  const close = () => {
    if (view === 'ask') answer('dismiss');
    setOpen(false);
  };

  // 작성 흐름은 히스토리 한 층만 쓴다(편지함 규칙) — 보내고 뒤로가기하면 홈으로 나온다
  const sendFeedback = () => router.replace(MAILBOX_COMPOSE_PATH);

  // 스토어 리뷰 화면 — 앱 셸이면 스토어 앱, 브라우저면 스토어 웹
  const writeReview = () => {
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
