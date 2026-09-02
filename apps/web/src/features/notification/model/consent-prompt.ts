// 알림 동의 풀스크린을 본 적 있는지 기기 단위로 기록한다 — 첫 1회는 풀스크린, 이후엔 실행마다 바텀시트로 청한다
export const CONSENT_PROMPT_SEEN_KEY =
  'landit-notification-consent-prompt-seen';

export const hasSeenConsentPrompt = () => {
  try {
    return localStorage.getItem(CONSENT_PROMPT_SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

export const markConsentPromptSeen = () => {
  try {
    localStorage.setItem(CONSENT_PROMPT_SEEN_KEY, '1');
  } catch {
    // 저장 실패 시 풀스크린이 한 번 더 보일 뿐이라 무시한다
  }
};

// 동의를 청할 차례인가 — 아직 안 물었고 권한이 미결정일 때. 동의 노출 조건의 단일 출처
export const isConsentPromptDue = (permission: string) =>
  !hasSeenConsentPrompt() && permission === 'undetermined';
