// clearAccountLocalState — 램프·시트·깃발 기록은 지우고 기기 것은 남긴다. 실제 저장 키로 검사한다
import { afterEach, describe, expect, it } from 'vitest';

import {
  markSummoned,
  readLastSummoned,
} from '@/features/scenario/model/lamp-gate';
import { surveyDone } from '@/features/survey/model/survey-done';
import {
  PROMPT_RECORD_KEY,
  updatePromptEntry,
} from '@/shared/lib/prompt-store';

import { clearAccountLocalState } from './account-local-state';

afterEach(() => localStorage.clear());

describe('clearAccountLocalState', () => {
  it('램프 소환일·시트 기록·설문 완료 깃발을 지운다', () => {
    markSummoned('2026-09-11');
    updatePromptEntry('impression', { shown: true });
    surveyDone.mark();

    clearAccountLocalState();

    expect(readLastSummoned()).toBeNull();
    expect(localStorage.getItem(PROMPT_RECORD_KEY)).toBeNull();
    expect(surveyDone.has()).toBe(false);
  });

  it('로그인 정보·온보딩 본 표시·진동 설정은 남긴다', () => {
    localStorage.setItem('landit-auth', '{"state":{}}');
    localStorage.setItem('landit-onboarding-seen', '1');
    localStorage.setItem('landit-haptics-off', '1');

    clearAccountLocalState();

    expect(localStorage.getItem('landit-auth')).not.toBeNull();
    expect(localStorage.getItem('landit-onboarding-seen')).toBe('1');
    expect(localStorage.getItem('landit-haptics-off')).toBe('1');
  });
});
