// 발음 분석 응답을 피드백 화면 모델로 바꾼다 — 단어별 카드 분기와 respelling 하이라이트 분해
import type { PronunciationWord } from '../api/pronunciation';
import { isLowScoreWord } from './pronunciation-score';

export interface DisplaySegment {
  text: string;
  error: boolean;
}

/** respelling에서 틀린 부분(span)만 error 세그먼트로 분리한다 — span이 없거나 못 찾으면 통짜 텍스트 하나 */
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
    }
  | {
      kind: 'lowScore';
      word: PronunciationWord;
      native: DisplaySegment[];
      // 다른 단어로 들렸으면 그 단어, 아니면 원어민과 같은 표기
      user: string;
    };

/**
 * 오류 단어와 100점 미만 단어를 교정 카드 모델로 바꾼다 — 발음 오류는 respelling 비교, 강세 오류는 음절·강세 위치,
 * 나머지 100점 미만 단어는 원어민 표기와 들린 소리를 견주는 카드. order 오름차순으로 직접 정렬한다.
 */
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
      // 강세 카드는 음절 분해가 있어야 그릴 수 있다 — 없으면 아래 100점 미만 카드로 간다
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
      if (isLowScoreWord(word)) {
        // 표기 자산이 없는 단어도 빈 행이 생기지 않게 철자로 보여준다
        const display = word.nativeDisplay ?? word.word;
        return [
          {
            kind: 'lowScore',
            word,
            native: splitDisplay(display, null),
            user: word.heardAs ?? display,
          },
        ];
      }
      return [];
    });
