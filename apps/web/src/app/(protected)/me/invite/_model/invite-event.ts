// 친구 초대 이벤트 화면 문구 — 지금 조건·서버 상한 진행·초대한 친구 수로 제목·진행·보내기 버튼 이름을 정한다
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

const won = (amount: number) => amount.toLocaleString('ko-KR');

// 진행 막대 옆 글 — 처음엔 0 / 10,000원이 점수처럼 읽혀 상한만 말한다. 적을 최대 금액이 없으면 비운다
const progressLabelOf = (
  offer: InviteOffer,
  invitedCount: number,
  earnedWon: number,
) => {
  if (offer.maxWon === null) return null;
  const used =
    offer.progress?.kind === 'amount' ? offer.progress.used : earnedWon;
  if (invitedCount === 0 && used === 0)
    return `최대 ${formatWon(offer.maxWon)}`;
  return `${won(used)} / ${formatWon(offer.maxWon)}`;
};

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
  const { progress } = offer;
  // 상한을 넘겨 초대해도 막대는 꽉 찬 데서 멈춘다
  const shown = progress ? Math.min(progress.used, progress.total) : 0;
  return {
    title:
      offer.inviteeWon > 0
        ? '친구를 초대하면 둘 다 적립금이 쌓여요'
        : '친구를 초대하면 적립금이 쌓여요',
    full: offer.full,
    countLabel:
      progress?.kind === 'count'
        ? `초대 받은 친구 ${shown}/${progress.total}명`
        : `초대 받은 친구 ${invitedCount}명`,
    // 무제한이면 막대를 그리지 않는다
    ratio: progress ? shown / progress.total : null,
    progressLabel: progressLabelOf(offer, invitedCount, earnedWon),
    // 상한을 채운 뒤 맨 위 한 줄 — 인원 상한은 몇 명을 채웠는지, 금액 상한은 한도를 채웠다고
    fullLabel:
      progress?.kind === 'count'
        ? `친구 ${progress.total}명 초대 완료`
        : '초대 적립 한도 완료',
    // 대기·검토로 덜 들어왔거나 최대 금액을 모르면 「모두」라고 하지 않는다
    fullAllEarned: offer.maxWon !== null && earnedWon >= offer.maxWon,
    // 다 채우면 내 몫은 끝나고 친구 몫만 남는다 — 부탁이 아니라 선물로 부른다
    shareLabel:
      offer.full && offer.inviteeWon > 0
        ? `친구에게 ${formatWon(offer.inviteeWon)} 선물하기`
        : '친구에게 초대 코드 보내기',
  };
};

// 받는 방법 마지막 단계의 「바로 나 N원 · 친구 N원 적립」 — 받을 사람만 남긴다(상한을 채우면 내 몫은 끝난다)
export const stepRewardsOf = (offer: InviteOffer) =>
  [
    { who: '나', won: offer.full ? 0 : offer.inviterWon },
    { who: '친구', won: offer.inviteeWon },
  ].filter((part) => part.won > 0);
