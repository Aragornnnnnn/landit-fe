// 혜택 화면 맨 위 카드 벽 — 실제 시나리오 그림을 비스듬히 깔고, 그중 한 장이 「오늘의 시나리오」로 뽑혀 떠 있다.
// 시나리오는 무료로도 하니 혜택이 아니라 무대다. 움직이지 않는 그림이라 rAF가 멎은 웹뷰에서도 그대로 보인다
import Image from 'next/image';

import { SCENARIOS, WALL_PICK_INDEX } from '../_model/paywall-content';

/** 세 줄 × 여섯 장. 줄마다 시작 위치를 어긋나게 해 벽돌처럼 쌓인다 */
const ROW_OFFSETS = [-40, -98, -12];
const COLUMNS = 6;
const CARD = { width: 104, height: 156, gapX: 12, gapY: 14 };
/** 가운데 줄 넷째 칸이 뽑힌 자리다 */
const PICK_ROW = 1;
const PICK_COLUMN = 3;

/** 칸마다 그림을 흩뜨린다 — 줄마다 두 칸씩 밀고, 뽑힌 시나리오는 벽에 다시 깔지 않는다 */
const scenarioAt = (row: number, column: number) => {
  const index = (row * COLUMNS + column + row * 2) % SCENARIOS.length;
  return SCENARIOS[
    index === WALL_PICK_INDEX ? (index + 1) % SCENARIOS.length : index
  ];
};

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
    className={`relative overflow-hidden rounded-[14px] shadow-[0_6px_14px_rgba(51,31,13,0.18)] ${picked ? 'h-[192px] w-[128px] ring-3 ring-primary' : 'h-[156px] w-[104px] opacity-55'}`}
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
  const pickLeft =
    ROW_OFFSETS[PICK_ROW] + PICK_COLUMN * (CARD.width + CARD.gapX) - 12;
  const pickTop = PICK_ROW * (CARD.height + CARD.gapY) - 18;

  return (
    <div aria-hidden="true" className="relative h-[420px] overflow-hidden">
      {/* 묶음을 기울여 가운데 둔다 — 화면 폭과 상관없이 뽑힌 카드가 한가운데 오도록 기준점을 가운데로 잡는다 */}
      <div className="absolute top-[24px] left-1/2 h-[520px] w-[640px] -translate-x-[47%] -rotate-[7deg]">
        {ROW_OFFSETS.map((offset, row) =>
          Array.from({ length: COLUMNS }, (_, column) => {
            if (row === PICK_ROW && column === PICK_COLUMN) return null;
            const scenario = scenarioAt(row, column);
            return (
              <div
                key={`${row}-${column}`}
                className="absolute"
                style={{
                  left: offset + column * (CARD.width + CARD.gapX),
                  top: row * (CARD.height + CARD.gapY),
                }}
              >
                <ScenarioCard title={scenario.title} image={scenario.image} />
              </div>
            );
          }),
        )}
        <div className="absolute z-10" style={{ left: pickLeft, top: pickTop }}>
          <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold whitespace-nowrap text-primary-foreground">
            오늘의 시나리오
          </span>
          <ScenarioCard title={picked.title} image={picked.image} picked />
        </div>
      </div>
      {/* 위아래 가장자리는 바탕색으로 흐려 벽이 화면 밖으로 이어지는 것처럼 보인다 */}
      <div className="absolute inset-x-0 top-0 h-14 bg-[linear-gradient(to_bottom,var(--color-background),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,var(--color-background)_30%,transparent)]" />
    </div>
  );
};
