// 스트릭 열매 — 하루 1개 완료가 열매 1개다. 헤더·히어로·달력이 같은 그림을 쓴다
// 에셋은 피그마에서 내보낸 원본 그대로. 시안이 여백째 프레임에 담아 쓰므로 잘라내지 않는다
import Image from 'next/image';

import fruitImage from '../assets/fruit.png';
import type { FruitState } from '../model/streak-status';

// 시안(F1b·F1c)이 0일 열매를 opacity 40%로 그린다. 오늘치가 빈 상태는 그 사이에 둔다
const OPACITY: Record<FruitState, number> = {
  fresh: 1,
  faded: 0.55,
  empty: 0.4,
};

interface StreakFruitProps {
  state: FruitState;
  size?: number;
  // 익은 열매가 말랑거리는 연출. 히어로에서만 켠다 — 달력 열매 서른 개가 같이 움직이면 어지럽다
  animated?: boolean;
  // 첫 화면에 바로 보이는 자리인지. 크기로 짐작하면 시각적 조정이 로딩 동작을 몰래 바꾼다
  priority?: boolean;
}

export const StreakFruit = ({
  state,
  size = 26,
  animated = false,
  priority = false,
}: StreakFruitProps) => (
  <Image
    src={fruitImage}
    alt=""
    width={size}
    height={size}
    style={{ opacity: OPACITY[state] }}
    className={
      // 오늘치를 채운 열매만 움직인다 — 아직 못 받은 열매가 통통 튀면 상태가 거짓말이 된다
      animated && state === 'fresh'
        ? 'animate-fruit-squish motion-reduce:animate-none'
        : undefined
    }
    priority={priority}
  />
);
