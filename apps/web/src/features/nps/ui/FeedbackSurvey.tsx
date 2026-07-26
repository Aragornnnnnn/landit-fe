'use client';

// 만족도(표정) + 자유 의견 서베이 — 바텀시트 안에 들어가는 공용 콘텐츠
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';

import { submitNps, type NpsScore } from '../api/nps';
import { EmojiScoreButton } from './EmojiScoreButton';

const NPS_SCORES = [1, 2, 3, 4, 5] as const;

// 감사 화면이 잠깐 보인 뒤 시트를 닫기까지의 시간
const THANKS_DISMISS_MS = 1200;

// 제출 후 감사 화면
const SurveyThanks = () => (
  <div className="flex flex-col items-center gap-2 py-6">
    <span className="tossface text-4xl">🙏</span>
    <p className="text-base font-bold text-foreground">소중한 의견 고마워요!</p>
    <p className="text-sm text-muted-foreground">
      한 글자도 빼놓지 않고 읽어볼게요.
    </p>
  </div>
);

interface FeedbackSurveyProps {
  onDone: () => void;
}

export const FeedbackSurvey = ({ onDone }: FeedbackSurveyProps) => {
  const [score, setScore] = useState<NpsScore | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (score === null) return;
    // 의견 원문은 PII 위험이 있어 존재 여부만 남긴다
    track(EVENTS.NPS_SURVEY_SUBMITTED, {
      score,
      has_comment: comment.trim().length > 0,
    });
    try {
      await submitNps(score, comment);
    } catch {
      // 제출 실패해도 UX는 막지 않는다 — 감사 화면으로 넘긴다
    }
    setSubmitted(true);
    setTimeout(onDone, THANKS_DISMISS_MS);
  };

  const handleSelect = (value: NpsScore) => {
    track(EVENTS.NPS_SCORE_SELECTED, { score: value });
    setScore(value);
  };

  const handleDismiss = () => {
    // 제출 없이 닫음 — 점수를 골라놓고 이탈했으면 score가 담긴다
    track(EVENTS.NPS_SURVEY_DISMISSED, { score: score ?? undefined });
    onDone();
  };

  if (submitted) return <SurveyThanks />;

  return (
    <>
      {/* 질문 + 닫기 */}
      <div className="relative mb-6">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="닫기"
          className="absolute -top-1 right-0 text-xl leading-none text-muted-foreground"
        >
          ✕
        </button>
        <p className="pr-8 text-xl leading-snug font-bold text-foreground">
          Landit을 쓰면서 얼마나 만족하시나요?
        </p>
      </div>

      {/* 만족도 표정 */}
      <div className="mb-7 flex justify-between">
        {NPS_SCORES.map((value) => (
          <EmojiScoreButton
            key={value}
            value={value}
            score={score}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* 자유 의견 — 항상 노출 */}
      <p className="mb-2 text-sm font-medium text-foreground">
        전하고 싶은 의견이 있다면?
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="대화 흐름, 발음, AI 피드백 등 자유롭게 적어주세요"
        className="w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <p className="mt-1.5 mb-5 text-xs text-muted-foreground">
        주신 의견은 한 글자도 빼놓지 않고 꼼꼼히 읽어볼게요.
      </p>

      <Button size="md" onClick={handleSubmit} disabled={score === null}>
        {score === null ? '얼마나 만족하는지 알려줘요' : '제출할게요'}
      </Button>
    </>
  );
};
