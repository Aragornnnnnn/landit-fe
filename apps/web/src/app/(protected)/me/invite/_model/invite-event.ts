// 친구 초대 이벤트 화면 문구 — 지금 조건과 초대한 친구 수로 제목·진행 막대 옆 글·보내기 버튼 이름을 정한다
import {
  REFERRAL_INVITE_LIMIT,
  type InviteOffer,
} from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

export const inviteEventViewOf = ({
  offer,
  invitedCount,
  earnedWon,
}: {
  offer: InviteOffer;
  invitedCount: number;
  // 초대한 사람으로 실제 적립된 순액
  earnedWon: number;
}) => {
  const full = invitedCount >= REFERRAL_INVITE_LIMIT;
  return {
    title:
      offer.inviteeWon > 0
        ? '친구를 초대하면 둘 다 적립금을 받아요'
        : '친구를 초대하면 적립금을 받아요',
    // 상한을 넘겨 초대해도 막대는 꽉 찬 데서 멈춘다
    count: Math.min(invitedCount, REFERRAL_INVITE_LIMIT),
    full,
    // 처음엔 0 / 10,000원이 점수처럼 읽혀 상한만 말한다
    progressLabel:
      invitedCount === 0
        ? `최대 ${formatWon(offer.maxWon)}`
        : `${earnedWon.toLocaleString('ko-KR')} / ${formatWon(offer.maxWon)}`,
    // 다 채우면 내 몫은 끝나고 친구 몫만 남는다 — 부탁이 아니라 선물로 부른다
    shareLabel:
      full && offer.inviteeWon > 0
        ? `친구에게 ${formatWon(offer.inviteeWon)} 선물하기`
        : '친구에게 초대 코드 보내기',
  };
};
