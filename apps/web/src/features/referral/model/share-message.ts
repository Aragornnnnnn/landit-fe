// 초대 공유 문구 — 코드는 「초대 코드:」 한 줄에 따로 둔다. 받는 사람은 카톡 말풍선을 통째로 복사해 붙여넣으면 된다
import { formatWon } from '@/shared/lib/won';

// 받는 사람 기기에 맞는 스토어로 보내는 /download에 친구 공유 유입 딱지를 붙인다 (docs/analytics-utm.md).
// 도메인은 고정한다 — 개발 서버에서 눌러도 친구에게는 실제 주소가 가야 한다
const DOWNLOAD_URL =
  'https://landit.im/download?utm_source=share&utm_medium=referral&utm_campaign=friend_invite';

export const referralShareMessage = ({
  code,
  inviteeSignupWon,
}: {
  code: string;
  // 받는 사람이 가입 때 받는 금액 — 0이면 금액을 적지 않는다
  inviteeSignupWon: number;
}) =>
  [
    '랜딧에서 영어 회화 같이 해요 🙌',
    inviteeSignupWon > 0
      ? `앱을 받고 가입할 때 아래 초대 코드를 넣으면 ${formatWon(inviteeSignupWon)}을 받아요`
      : '앱을 받고 가입할 때 아래 초대 코드를 넣어 주세요',
    '',
    `초대 코드: ${code}`,
    '',
    DOWNLOAD_URL,
  ].join('\n');
