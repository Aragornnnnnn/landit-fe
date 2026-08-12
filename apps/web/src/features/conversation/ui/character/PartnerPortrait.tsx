// 캐릭터 정지 초상 — 움직임 없이 한 컷만 그린다. viewBox로 얼굴만 잘라 아바타로도 쓴다.
// 표정 변형 조각(웃는 눈·찡그린 눈썹)은 파츠 SVG에 다 들어 있어서, 감추는 규칙을
// 얹지 않으면 전부 겹쳐 보인다 — 그 규칙이 PartnerCharacter.module.css의 .parts다
import type { Partner } from '../../model/character-look';
import { PARTS } from './PartnerCharacter';
import styles from './PartnerCharacter.module.css';

interface PartnerPortraitProps {
  partner: Partner;
  // 그릴 영역. 생략하면 파츠 원본 그대로(전신)
  viewBox?: string;
  className?: string;
}

export const PartnerPortrait = ({
  partner,
  viewBox,
  className,
}: PartnerPortraitProps) => {
  const Parts = PARTS[partner];

  return (
    <Parts
      viewBox={viewBox}
      className={[styles.parts, className].filter(Boolean).join(' ')}
      aria-hidden
    />
  );
};
