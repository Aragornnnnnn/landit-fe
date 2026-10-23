// 친구 초대 이벤트 화면 문구 — 지금 조건·서버 상한·초대한 친구 수로 제목·진행·보내기 버튼 이름을 정한다
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

export const inviteEventViewOf = ({
  offer,
  invitedCount,
  earnedWon,
}: {
  offer: InviteOffer;
  invitedCount: number;
  // 초대한 사람으로 실제 적립된 순액(서버 inviterCreditedWon)
  earnedWon: number;
}) => {
  const { limitCount, maxWon } = offer;
  const full = limitCount !== null && invitedCount >= limitCount;
  // 상한을 넘겨 초대해도 막대는 꽉 찬 데서 멈춘다
  const count =
    limitCount === null ? invitedCount : Math.min(invitedCount, limitCount);
  return {
    title:
      offer.inviteeWon > 0
        ? '친구를 초대하면 둘 다 적립금이 쌓여요'
        : '친구를 초대하면 적립금이 쌓여요',
    count,
    full,
    countLabel:
      limitCount === null
        ? `초대 받은 친구 ${count}명`
        : `초대 받은 친구 ${count}/${limitCount}명`,
    // 무제한이면 막대를 그리지 않는다
    ratio: limitCount ? count / limitCount : null,
    // 처음엔 0 / 10,000원이 점수처럼 읽혀 상한만 말한다. 무제한이면 적을 상한이 없다
    progressLabel:
      maxWon === null
        ? null
        : invitedCount === 0
          ? `최대 ${formatWon(maxWon)}`
          : `${earnedWon.toLocaleString('ko-KR')} / ${formatWon(maxWon)}`,
    // 상한을 채운 뒤 금액 한 마디 — 대기·검토로 덜 들어왔으면 「모두」라고 하지 않는다
    fullAllEarned: maxWon !== null && earnedWon >= maxWon,
    // 다 채우면 내 몫은 끝나고 친구 몫만 남는다 — 부탁이 아니라 선물로 부른다
    shareLabel:
      full && offer.inviteeWon > 0
        ? `친구에게 ${formatWon(offer.inviteeWon)} 선물하기`
        : '친구에게 초대 코드 보내기',
  };
};

// 받는 방법 마지막 단계의 「바로 나 N원 · 친구 N원 적립」 — 받을 사람만 남긴다(상한을 채우면 내 몫은 끝난다)
export const stepRewardsOf = (offer: InviteOffer, full: boolean) =>
  [
    { who: '나', won: full ? 0 : offer.inviterWon },
    { who: '친구', won: offer.inviteeWon },
  ].filter((part) => part.won > 0);
