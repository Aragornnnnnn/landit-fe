// 초대 메시지 보내기 — 코드를 넣은 공유 문구를 셸 공유 시트·웹 공유·복사 중 쓸 수 있는 길로 보낸다
'use client';

import { useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import { track } from '@/shared/analytics';
import { useCurrentUserId } from '@/shared/auth/current-member';
import { shareText } from '@/shared/lib/share-text';
import { reportWarning } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import { inviteeWonOf } from './invitee-reward';
import { rememberReferralCode } from './keys';
import { referralShareMessage } from './share-message';
import { useReferralCode } from './useReferralCode';
import { useReferralSummaryQuery } from './useReferralSummaryQuery';

export const useInviteShare = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const summary = useReferralSummaryQuery().data;
  // 발급 전이면 미리 받아 둔다 — 탭한 뒤 발급을 기다리면 브라우저가 탭 직후에만 주는 공유·복사 권한이 사라진다
  const code = useReferralCode();
  // 웹 공유 시트가 떠 있는 동안 또 누르면 두 번째 공유가 거절돼 복사로 샌다 — 끝날 때까지 탭을 무시한다 (앱 공유와 같은 이유)
  const sharingRef = useRef(false);

  const share = async () => {
    if (!summary || !code || sharingRef.current) return;
    sharingRef.current = true;
    try {
      rememberReferralCode(queryClient, userId, code);
      const method = await shareText(
        referralShareMessage({
          code,
          inviteeSignupWon: inviteeWonOf(summary.currentOffer.signup),
        }),
      );
      track(EVENTS.REFERRAL_INVITE_SHARED, { method });
      if (method === 'copy') showToast('초대 메시지를 복사했어요');
    } catch (error) {
      reportWarning(error);
      showToast('초대 메시지를 보내지 못했어요');
    } finally {
      sharingRef.current = false;
    }
  };

  return { ready: summary !== undefined && code !== null, share };
};
