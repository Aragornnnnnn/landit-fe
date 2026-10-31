// 카드에 서는 캐릭터 상반신 — 내 시나리오 카드와 만들기 로딩의 섞이는 카드가 같이 쓴다.
// 파츠 SVG는 높이를 부모에 맞추는 규칙(height: 100%)이라, 크롭 비율대로 상자를 잡아 주면 폭 기준으로 크기를 정할 수 있다
import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';

// 피그마 카드의 상반신 크롭 — 클로이·마르코는 같은 원본 비율이라 같은 영역, 테디는 곰이라 더 넓게 잡는다
const BUST_VIEWBOX: Record<Partner, string> = {
  chloe: '292 40 440 610',
  marco: '292 40 440 610',
  teddy: '34 52 840 904',
};

export const PartnerBust = ({
  partner,
  className,
}: {
  partner: Partner;
  // 상자의 자리와 폭 — 높이는 크롭 비율이 정한다
  className: string;
}) => {
  const viewBox = BUST_VIEWBOX[partner];
  const [, , width, height] = viewBox.split(' ');
  return (
    // 버튼 안에도 놓이므로 div가 아니라 span이다
    <span
      className={`block ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <PartnerAvatar partner={partner} viewBox={viewBox} />
    </span>
  );
};
