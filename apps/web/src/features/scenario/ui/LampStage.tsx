'use client';

// 램프 자리 — 자는 래디를 보여주다 부르면 소환 연출로 넘긴다.
// 오버레이는 앱 컬럼을 통째로 덮어야 하는데 카드가 transform 안에 있어 기준점이 어긋난다.
// 그래서 카드 안에서 그리지 않고 컬럼으로 실어 보낸다
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAppColumn } from '@/shared/lib/app-column';

import { LampSummon, type LampRect } from './LampSummon';
import { LampWaiting } from './LampWaiting';

interface LampStageProps {
  // 대화를 시작한다. 서버가 시작 불가로 판정하면 넘어오지 않는다
  onStart?: () => void;
  // 전날 시작했다 못 끝내 다시 받은 카드는 "도착"이 아니라 이어서 하는 것이다
  retry?: boolean;
}

export const LampStage = ({ onStart, retry }: LampStageProps) => {
  const [lamp, setLamp] = useState<LampRect | null>(null);
  const lampBoxRef = useRef<HTMLDivElement>(null);
  const column = useAppColumn();

  // 카드에 놓인 램프의 자리를 재서 넘긴다 — 오버레이가 같은 자리에서 시작해야 넘어갈 때 튀지 않는다.
  // 컬럼 기준 좌표로 바꾸는 것은 오버레이가 컬럼을 덮기 때문이다
  const summon = () => {
    const box = lampBoxRef.current;
    if (!box || !column) return;

    const lampBox = box.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();
    setLamp({
      left: lampBox.left - columnBox.left,
      top: lampBox.top - columnBox.top,
      width: lampBox.width,
    });
  };

  return (
    <>
      <LampWaiting
        ref={lampBoxRef}
        retry={retry}
        asleep={!lamp}
        onSummon={onStart ? summon : undefined}
      />

      {lamp &&
        column &&
        createPortal(
          <LampSummon
            lamp={lamp}
            onAccept={() => onStart?.()}
            onClose={() => setLamp(null)}
          />,
          column,
        )}
    </>
  );
};
