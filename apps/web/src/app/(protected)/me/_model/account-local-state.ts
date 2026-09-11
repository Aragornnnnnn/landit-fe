// 탈퇴하면 이 기기에 남은 계정 경험 기록을 지운다 — 다시 가입한 사람이 첫 램프·첫 안내·코치마크·소감 시트를 새로 만나게.
// 기기 것(온보딩 본 표시·알림 동의 물어봄·진동)은 남긴다. 로그인 정보는 clearAuth가 따로 지운다
import { clearSummoned } from '@/features/scenario/model/lamp-gate';
import { clearPromptRecords } from '@/shared/lib/prompt-store';
import { clearSeenFlags } from '@/shared/lib/seen-flag';

export const clearAccountLocalState = () => {
  clearSummoned();
  clearPromptRecords();
  clearSeenFlags();
};
