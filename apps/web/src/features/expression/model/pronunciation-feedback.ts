// 발음 분석 응답을 피드백 화면 모델로 바꾼다 — 오류 카드 분기와 respelling 하이라이트 분해
import type { PronunciationWord } from '../api/pronunciation';

export interface DisplaySegment {
  text: string;
  error: boolean;
}

// respelling에서 틀린 부분(span)만 error 세그먼트로 분리한다. span이 없거나 못 찾으면 통짜 텍스트
export const splitDisplay = (
  display: string | null,
  span: string | null,
): DisplaySegment[] => {
  if (!display) return [];
  const index = span ? display.indexOf(span) : -1;
  if (!span || index < 0) return [{ text: display, error: false }];
  return [
    { text: display.slice(0, index), error: false },
    { text: span, error: true },
    { text: display.slice(index + span.length), error: false },
  ].filter((segment) => segment.text.length > 0);
};

export type FeedbackCard =
  | {
      kind: 'phoneme';
      word: PronunciationWord;
      native: DisplaySegment[];
      user: DisplaySegment[];
    }
  | {
      kind: 'stress';
      word: PronunciationWord;
      syllables: string[];
      stressIndex: number | null;
      userStressIndex: number | null;
    };

// 오류 단어만 카드로 만든다. order 오름차순 — 응답 순서를 신뢰하지 않고 직접 정렬한다
export const toFeedbackCards = (words: PronunciationWord[]): FeedbackCard[] =>
  [...words]
    .sort((a, b) => a.order - b.order)
    .flatMap((word): FeedbackCard[] => {
      if (word.status === 'PHONEME_ERROR') {
        return [
          {
            kind: 'phoneme',
            word,
            native: splitDisplay(word.nativeDisplay, word.errorTargetSpan),
            user: splitDisplay(word.userDisplay, word.errorUserSpan),
          },
        ];
      }
      // 강세 카드는 음절 분해가 있어야 그릴 수 있다 — 데이터 불량이면 조용히 뺀다
      if (word.status === 'STRESS_ERROR' && word.syllables?.length) {
        return [
          {
            kind: 'stress',
            word,
            syllables: word.syllables,
            stressIndex: word.stressIndex,
            userStressIndex: word.userStressIndex,
          },
        ];
      }
      return [];
    });
