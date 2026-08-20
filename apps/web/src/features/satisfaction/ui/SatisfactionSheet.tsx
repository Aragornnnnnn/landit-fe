'use client';

// 소감 바텀시트 — 대화 소감(scenario·smalltalk)은 묻기(ask)로 열려 좋았어요 → 감사(thanks),
// 아쉬웠어요 → 피드백 안내(letter)로 같은 시트 안에서 말만 바뀐다. 리뷰 요청(review)은 물을 게 없어 별점판으로 바로 열린다.
// 시나리오 쪽 제목이 "첫 대화"가 아니라 "방금 대화"인 건, 배포 전부터 쓰던 사람에겐 첫 대화가 아니어서다
import type { SatisfactionMoment } from '@landit/analytics';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

export type SatisfactionView = 'ask' | 'thanks' | 'letter' | 'review';

interface SatisfactionSheetProps {
  open: boolean;
  moment: SatisfactionMoment;
  view: SatisfactionView;
  onGood: () => void;
  onBad: () => void;
  onSendFeedback: () => void;
  onWriteReview: () => void;
  onClose: () => void;
}

interface Face {
  image: string;
  title: string;
  body: string;
  // 묻기 화면의 두 버튼
  bad?: string;
  good?: string;
  // 한 버튼 화면의 CTA
  cta?: string;
}

// 시나리오는 왼쪽에서, 스몰톡은 반대쪽에서 빼꼼 — 두 번째로 볼 때 같은 그림이 아니게 (물음표는 정방향인 별도 에셋)
const PEEK = '/images/character/landy-peek.webp';
const PEEK_RIGHT = '/images/character/landy-peek-right.webp';
const WAVE = '/images/character/landy-wave-smile.webp';
const CRYING = '/images/character/landy-crying.webp';
const REVIEW = '/images/character/landy-review.webp';

// 순간·화면별 얼굴과 말 — 본문은 모두 두 줄 이내로 맞춰 시트 높이가 같게 유지되게 한다
const faceOf = (moment: SatisfactionMoment, view: SatisfactionView): Face => {
  if (moment === 'review')
    return {
      image: REVIEW,
      title: '잘 써주셔서 감사해요!',
      body: '스토어에 남겨주신 응원 한마디가\n랜딧에겐 큰 힘이 돼요',
      cta: '응원 남기러 가기',
    };
  if (view === 'thanks')
    return {
      image: WAVE,
      title: '좋았다니 래디도 기뻐요!',
      body: '남은 표현들도 이어서 공부해보세요',
    };
  if (view === 'letter')
    return {
      image: CRYING,
      title: '아쉬웠군요…',
      body: '어떤 점이 아쉬웠는지 알려주세요.\n피드백을 보내주시면 꼭 읽고 답장드릴게요',
      cta: '피드백 보내기',
    };
  return {
    image: moment === 'smalltalk' ? PEEK_RIGHT : PEEK,
    title:
      moment === 'smalltalk'
        ? '첫 스몰톡, 어떠셨나요?'
        : '방금 대화, 어떠셨나요?',
    body: '래디가 많이 궁금해요!\n솔직하게 골라주세요',
    bad: '아쉬웠어요',
    good: '좋았어요',
  };
};

export const SatisfactionSheet = ({
  open,
  moment,
  view,
  onGood,
  onBad,
  onSendFeedback,
  onWriteReview,
  onClose,
}: SatisfactionSheetProps) => {
  const face = faceOf(moment, view);

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* 모든 화면의 높이를 같게 고정한다 — 문구만 바뀌는 전환이라 시트가 덜컥 줄어들면 안 된다.
          버튼 있는 화면은 위에서부터 쌓고 버튼을 바닥에, 감사는 버튼이 없으니 내용을 가운데로 모아 빈 자리를 없앤다 */}
      <div
        className={`flex h-[328px] flex-col items-center text-center ${
          view === 'thanks' ? 'justify-center' : ''
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={face.image}
          alt="래디"
          className="object-contain"
          style={{ width: 160, height: 160 }}
        />
        <h2
          className={`${view === 'thanks' ? 'mt-5' : 'mt-4'} text-xl font-bold text-foreground`}
        >
          {face.title}
        </h2>
        <p className="mt-2 text-[15px] leading-6 whitespace-pre-line text-muted-foreground">
          {face.body}
        </p>
        {view !== 'thanks' && (
          <div className="mt-auto flex w-full gap-3">
            {view === 'ask' ? (
              <>
                <Button variant="ghost" size="md" onClick={onBad}>
                  {face.bad}
                </Button>
                <Button size="md" onClick={onGood}>
                  {face.good}
                </Button>
              </>
            ) : (
              <Button
                size="md"
                onClick={view === 'review' ? onWriteReview : onSendFeedback}
              >
                {face.cta}
              </Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
