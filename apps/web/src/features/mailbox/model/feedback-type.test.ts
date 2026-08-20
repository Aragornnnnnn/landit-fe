// 주소 조각 ↔ 피드백 유형 — 손으로 고친 주소가 작성 화면을 열지 못하게 막는다
import { describe, expect, it } from 'vitest';

import {
  FEEDBACK_TYPES,
  feedbackComposePath,
  readFeedbackType,
} from './feedback-type';

describe('readFeedbackType', () => {
  it('아는 조각이면 그 유형을 돌려준다', () => {
    expect(readFeedbackType('bug')).toBe('BUG_REPORT');
  });

  it('모르는 조각이면 유형이 없는 것으로 본다', () => {
    expect(readFeedbackType('rant')).toBeNull();
  });

  it('대문자 enum을 그대로 주소에 실어도 열리지 않는다', () => {
    expect(readFeedbackType('BUG')).toBeNull();
  });
});

describe('feedbackComposePath ↔ readFeedbackType', () => {
  it('주소에 실은 유형은 되읽으면 그 유형이다 — 네 유형 모두', () => {
    for (const type of FEEDBACK_TYPES) {
      const slug = feedbackComposePath(type).split('/').pop() ?? '';

      expect(readFeedbackType(slug)).toBe(type);
    }
  });
});
