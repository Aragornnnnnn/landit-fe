'use client';

// 소감 바텀시트 — 대화 소감(scenario·smalltalk)은 묻기(ask)로 열려 좋았어요 → 감사(thanks),
// 아쉬웠어요 → 피드백 안내(letter)로 같은 시트 안에서 말만 바뀐다. 리뷰 요청(review)은 물을 게 없어 별점판으로 바로 열린다.
// 시나리오 쪽 제목이 "첫 대화"가 아니라 "방금 대화"인 건, 배포 전부터 쓰던 사람에겐 첫 대화가 아니어서다
import type { SatisfactionMoment } from '@landit/analytics';
import { useTranslations, type Messages } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

export type SatisfactionView = 'ask' | 'thanks' | 'letter' | 'review';

interface SatisfactionSheetProps {
  open: boolean;
  moment: SatisfactionMoment;
  view: SatisfactionView;
  // 시나리오 소감을 표현 학습 뒤로 미뤘다 — 대화와 표현을 함께 묻는다
  withExpression?: boolean;
  // 프리뷰 중간에 멈췄다 돌아왔다 — 좀 전 대화로 묻는다
  earlier?: boolean;
  onGood: () => void;
  onBad: () => void;
  onSendFeedback: () => void;
  onWriteReview: () => void;
  // 리뷰 요청만 — 앱 안 별점 카드의 회신을 기다리는 동안 버튼을 잠근다
  writeReviewPending?: boolean;
  // 리뷰 요청만 — 재요청(2번째 노출)부터 「이미 남겼어요」를 보여준다. 처음엔 아직 남겼을 리 없다
  showAlreadyDone?: boolean;
  onAlreadyDone?: () => void;
  onClose: () => void;
}

type SheetKey = keyof Messages['satisfaction']['satisfactionSheet'];

// 문구는 satisfaction.satisfactionSheet 아래 키
interface Face {
  image: string;
  titleKey: SheetKey;
  descriptionKey: SheetKey;
  // 한 버튼 화면의 CTA — 묻기 화면은 두 버튼(아쉬웠어요·좋았어요)이 고정이라 따로 두지 않는다
  buttonKey?: SheetKey;
}

// 시나리오는 왼쪽에서, 스몰톡은 반대쪽에서 빼꼼 — 두 번째로 볼 때 같은 그림이 아니게 (물음표는 정방향인 별도 에셋)
const PEEK = '/images/character/landy-peek.webp';
const PEEK_RIGHT = '/images/character/landy-peek-right.webp';
const WAVE = '/images/character/landy-wave-smile.webp';
const CRYING = '/images/character/landy-crying.webp';
const REVIEW = '/images/character/landy-review.webp';

// 순간·화면별 얼굴과 말 — 본문은 모두 두 줄 이내로 맞춰 시트 높이가 같게 유지되게 한다
const faceOf = (
  moment: SatisfactionMoment,
  view: SatisfactionView,
  withExpression: boolean,
  earlier: boolean,
): Face => {
  if (moment === 'review')
    return {
      image: REVIEW,
      titleKey: 'reviewTitle',
      descriptionKey: 'reviewDescription',
      buttonKey: 'reviewButton',
    };
  if (view === 'thanks')
    return {
      image: WAVE,
      titleKey: 'thanksTitle',
      // 표현까지 마치고 온 사람(프리뷰를 끝낸 무료 유저)은 남은 표현이 잠겨 있어 꾸준한 학습을 권한다
      descriptionKey: withExpression
        ? 'thanksExpressionDescription'
        : 'thanksDescription',
    };
  if (view === 'letter')
    return {
      image: CRYING,
      titleKey: 'letterTitle',
      descriptionKey: 'letterDescription',
      buttonKey: 'letterButton',
    };
  return {
    image: moment === 'smalltalk' ? PEEK_RIGHT : PEEK,
    titleKey:
      moment === 'smalltalk'
        ? 'smalltalkAskTitle'
        : withExpression
          ? 'expressionAskTitle'
          : earlier
            ? 'earlierAskTitle'
            : 'askTitle',
    descriptionKey: 'askDescription',
  };
};

export const SatisfactionSheet = ({
  open,
  moment,
  view,
  withExpression = false,
  earlier = false,
  onGood,
  onBad,
  onSendFeedback,
  onWriteReview,
  writeReviewPending = false,
  showAlreadyDone = false,
  onAlreadyDone,
  onClose,
}: SatisfactionSheetProps) => {
  const t = useTranslations('satisfaction.satisfactionSheet');
  const tCommon = useTranslations('common');
  const face = faceOf(moment, view, withExpression, earlier);

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* 리뷰 요청은 다시 뜨는 시트라 닫는 길을 눈에 보이게 둔다 — 소감은 한 번뿐이라 딤·뒤로가기로 족하다 */}
      {view === 'review' && (
        <button
          type="button"
          aria-label={tCommon('closeLabel')}
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
        >
          <CloseIcon size={20} />
        </button>
      )}
      {/* 소감 화면들은 같은 최소 높이로 맞춘다 — 문구만 바뀌는 전환이라 시트가 덜컥 줄어들면 안 된다.
          고정 높이가 아니라 최소 높이인 건 글자 크기를 키우면 내용이 넘쳐 버튼이 시트 밖으로 밀려서다.
          리뷰 요청은 「이미 남겼어요」 링크만큼 자란다.
          버튼 있는 화면은 위에서부터 쌓고 버튼을 바닥에, 감사는 버튼이 없으니 내용을 가운데로 모아 빈 자리를 없앤다 */}
      <div
        className={`flex min-h-[328px] flex-col items-center text-center ${
          view === 'thanks' ? 'justify-center' : ''
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={face.image}
          alt={t('characterLabel')}
          className="object-contain"
          style={{ width: 160, height: 160 }}
        />
        <BottomSheet.Title
          className={`${view === 'thanks' ? 'mt-5' : 'mt-4'} text-xl font-bold text-foreground`}
        >
          {t(face.titleKey)}
        </BottomSheet.Title>
        <p className="mt-2 text-15 leading-6 text-muted-foreground">
          {t.rich(face.descriptionKey, lineBreak)}
        </p>
        {view !== 'thanks' && (
          <div className="mt-auto flex w-full gap-3 pt-6">
            {view === 'ask' ? (
              <>
                <Button variant="ghost" size="md" onClick={onBad}>
                  {t('badButton')}
                </Button>
                <Button size="md" onClick={onGood}>
                  {t('goodButton')}
                </Button>
              </>
            ) : (
              <Button
                size="md"
                disabled={view === 'review' && writeReviewPending}
                onClick={view === 'review' ? onWriteReview : onSendFeedback}
              >
                {face.buttonKey && t(face.buttonKey)}
              </Button>
            )}
          </div>
        )}
        {/* 버튼과 떨어뜨려 두어 주 버튼과 한 덩어리로 안 보이게, 탭 영역은 글자보다 넉넉히 */}
        {view === 'review' && showAlreadyDone && (
          <button
            type="button"
            onClick={onAlreadyDone}
            className="mt-5 px-4 py-2 text-sm text-muted-foreground underline underline-offset-2"
          >
            {t('alreadyDoneButton')}
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
