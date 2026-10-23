// 친구 초대 이벤트(/me/invite) — 내 정보 초대 띠·환급 화면 초대 띠·친구 초대 안내 편지에서 들어온다
import { InviteAudienceGate } from './_ui/InviteAudienceGate';
import { InviteScreen } from './_ui/InviteScreen';

export default function InvitePage() {
  return (
    <InviteAudienceGate>
      <InviteScreen />
    </InviteAudienceGate>
  );
}
