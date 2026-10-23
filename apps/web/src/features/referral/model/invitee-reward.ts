// 초대받은 사람이 받는 금액 — 단계가 켜져 있고 대상에 초대받은 사람이 들 때만 센다
import type { ReferralStage } from '../api/referral';

export const inviteeWonOf = (stage: ReferralStage) =>
  stage.enabled && (stage.target === 'INVITEE' || stage.target === 'BOTH')
    ? stage.inviteeWon
    : 0;
