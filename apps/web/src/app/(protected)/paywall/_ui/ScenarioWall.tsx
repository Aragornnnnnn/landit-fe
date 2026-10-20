// 혜택 화면 맨 위 카드 벽 — 실제 시나리오 그림을 비스듬히 깔고, 그중 한 장이 「오늘의 시나리오」로 뽑혀 떠 있다.
// 시나리오는 무료로도 하니 혜택이 아니라 무대다. 배치·크기·흐림은 피그마 「상황 카드 벽」(3526:337)을 그대로 옮겼다
import Image from 'next/image';

import { SCENARIOS, WALL_PICK_INDEX } from '../_model/paywall-content';

/** 줄마다 깔 시나리오(SCENARIOS 순번)와 첫 장의 가로 위치 — 줄을 어긋나게 해 벽돌처럼 쌓고, 클로이·마르코가 테디 사이사이에 보이게 섞었다 */
const ROWS = [
  { left: 40, top: 20, scenarios: [0, 1, 2, 9, 4, 5] },
  { left: -18, top: 190, scenarios: [8, 3, 10, 11, 12, 13] },
  { left: 68, top: 360, scenarios: [2, 3, 4, 5, 6, 1] },
];
/** 카드 한 장 너비(104)에 사이 간격(12)을 더한 가로 걸음 */
const STEP_X = 116;

const ScenarioCard = ({
  title,
  image,
  picked = false,
}: {
  title: string;
  image: string;
  picked?: boolean;
}) => (
  <div
    className={`relative overflow-hidden rounded-[14px] ${picked ? 'h-[192px] w-[128px] border-3 border-primary drop-shadow-[0_10px_14px_rgba(224,122,59,0.45)]' : 'h-[156px] w-[104px] opacity-55 drop-shadow-[0_6px_7px_rgba(51,31,13,0.18)]'}`}
  >
    <Image src={image} alt="" fill sizes="128px" className="object-cover" />
    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.72))]" />
    <p
      className={`absolute inset-x-2 bottom-2 line-clamp-2 font-bold break-keep text-white ${picked ? 'text-[13px] leading-[1.3]' : 'text-[10px] leading-[1.3]'}`}
    >
      {title}
    </p>
  </div>
);

export const ScenarioWall = () => {
  const picked = SCENARIOS[WALL_PICK_INDEX];

  return (
    <div aria-hidden="true" className="relative h-[460px] overflow-hidden">
      {/* 760×560 묶음을 시계 방향으로 7도 기울인다 — 피그마처럼 묶음 가운데가 화면 가운데보다 5px 오른쪽에 오게 둔다 */}
      <div className="absolute top-[34px] left-[calc(50%-375px)] h-[560px] w-[760px] rotate-7">
        {ROWS.map((row) =>
          row.scenarios.map((index, column) => (
            <div
              key={`${row.top}-${column}`}
              className="absolute"
              style={{ left: row.left + column * STEP_X, top: row.top }}
            >
              <ScenarioCard
                title={SCENARIOS[index].title}
                image={SCENARIOS[index].image}
              />
            </div>
          )),
        )}
        <div className="absolute top-[172px] left-[318px] z-10">
          <ScenarioCard title={picked.title} image={picked.image} picked />
        </div>
        <span className="absolute top-[158px] left-[332px] z-10 rounded-full bg-primary px-2.5 py-[5px] text-xs font-bold whitespace-nowrap text-primary-foreground">
          오늘의 시나리오
        </span>
      </div>
      {/* 위아래 60px은 혜택 화면 머리 배경색(#fbf6ef)으로 흐려 벽이 화면 밖으로 이어지는 것처럼 보인다 */}
      <div className="absolute inset-x-0 top-0 h-15 bg-[linear-gradient(to_bottom,#fbf6ef,transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-15 bg-[linear-gradient(to_top,#fbf6ef,transparent)]" />
    </div>
  );
};
