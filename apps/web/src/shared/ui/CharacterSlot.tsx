// 대화 상대 캐릭터 자리 — 지금은 점선 원 placeholder. 후속 이슈에서 Rive 2D 사람 캐릭터 + 진폭 립싱크로 교체된다.
import { UserIcon } from './Icons';

interface CharacterSlotProps {
  size?: number;
  className?: string;
}

export const CharacterSlot = ({
  size = 96,
  className = '',
}: CharacterSlotProps) => (
  <div
    className={`flex items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <UserIcon size={size * 0.42} className="text-muted-foreground/50" />
  </div>
);
