'use client';

// 램프 자리 — 자는 래디를 보여주다 부르면 소환 연출로 넘긴다.
// 오버레이는 앱 컬럼을 통째로 덮어야 하는데 카드가 transform 안에 있어 기준점이 어긋난다.
// 그래서 카드 안에서 그리지 않고 컬럼으로 실어 보낸다
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAppColumn } from '@/shared/lib/app-column';
import { DAILY_REMINDER_CAMPAIGN } from '@/shared/lib/routes';

import { BUBBLE_AT, LAMP_ASPECT, LAMP_FRAME } from '../lib/summon-timeline';
import {
  decideSummon,
  markSummoned,
  readLastSummoned,
} from '../model/lamp-gate';
import { LampSummon, type LampRect } from './LampSummon';
import { LampWaiting } from './LampWaiting';

// 판정하면서 히스토리의 주소에서 utm을 지운다 — 남겨두면 하드웨어 뒤로가기로
// 이 주소에 돌아올 때마다 알림 진입으로 오인해 다시 소환한다.
// 라우터를 안 거치므로 앰플리튜드 페이지뷰가 중복 발사되지도 않는다
const consumeReminderEntry = () => {
  const params = new URLSearchParams(window.location.search);
  const fromReminder = params.get('utm_campaign') === DAILY_REMINDER_CAMPAIGN;
  if (!fromReminder) return false;

  [...params.keys()]
    .filter((key) => key.startsWith('utm_'))
    .forEach((key) => params.delete(key));
  const search = params.toString();
  window.history.replaceState(
    null,
    '',
    window.location.pathname + (search ? `?${search}` : ''),
  );
  return true;
};

interface LampStageProps {
  // 대화를 시작한다. 서버가 시작 불가로 판정하면 넘어오지 않는다
  onStart?: () => void;
  // 전날 시작했다 못 끝내 다시 받은 카드는 "도착"이 아니라 이어서 하는 것이다
  retry?: boolean;
  // 이 카드의 날 (서버가 준 yyyy-MM-dd). 자동 소환을 "그날 처음"으로 거르는 열쇠다
  today?: string;
}

// 소환에는 두 결이 있다 — 화면이 알아서 띄우면 묻고, 사용자가 부르면 묻지 않는다
interface Summon {
  lamp: LampRect;
  asks: boolean;
}

export const LampStage = ({ onStart, retry, today }: LampStageProps) => {
  const [summon, setSummon] = useState<Summon | null>(null);
  const lampBoxRef = useRef<HTMLDivElement>(null);
  const column = useAppColumn();

  // 카드에 놓인 램프의 자리를 재고, 오버레이가 설 시안 자리를 계산한다.
  // 같은 자리에서 출발해야 카드에서 오버레이로 넘어갈 때 튀지 않는다
  const measure = (): LampRect | null => {
    const box = lampBoxRef.current;
    if (!box || !column) return null;

    const lampBox = box.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();

    // 시안 자리(LAMP_FRAME) 그대로 서되, 세로가 짧은 폰에선 그 폭대로면 말풍선이
    // 화면 위로 나간다 — 위 여백과 CTA 자리를 뺀 높이에 맞춰 폭을 줄이고,
    // 구도 전체(말풍선→램프)가 비율 그대로 작아지게 한다
    const stack = LAMP_ASPECT - BUBBLE_AT.top;
    const topMargin = 76; // 닫기 X와 상태바가 서는 자리
    const ctaSpace = 128; // "네!" 버튼과 아래 여백
    const width = Math.min(
      columnBox.width * LAMP_FRAME.widthRatio,
      (columnBox.height - topMargin - ctaSpace) / stack,
    );

    // 폭이 줄어도 램프 중심은 시안 자리를 지킨다
    const clampTop = (value: number) =>
      Math.min(
        Math.max(value, topMargin - BUBBLE_AT.top * width),
        columnBox.height - ctaSpace - LAMP_ASPECT * width,
      );
    const target = {
      left: columnBox.width * LAMP_FRAME.centerXRatio - width / 2,
      top: clampTop(columnBox.height * LAMP_FRAME.topRatio),
      width,
    };

    return {
      ...target,
      from: {
        x: lampBox.left - columnBox.left - target.left,
        y: lampBox.top - columnBox.top - target.top,
        scale: lampBox.width / target.width,
      },
    };
  };

  // 연출이 시작된 순간 기록한다 — 수락까지 기다리면 X 뒤 재진입마다 다시 나와 성가시다
  const summonWith = (asks: boolean) => {
    const lamp = measure();
    if (!lamp) return;
    if (today) markSummoned(today);
    setSummon({ lamp, asks });
  };

  // 자동 소환 — 그날 처음이거나 알림으로 들어왔을 때만. 그 외엔 카드에 담겨 있다.
  // column이 의존성에 있는 것은 첫 실행 때 아직 못 잡았을 수 있어서다 — 잡히면 다시 판정한다
  useEffect(() => {
    if (!today || !onStart || !column) return;

    const fromReminder = consumeReminderEntry();
    if (!decideSummon({ lastSeen: readLastSummoned(), today, fromReminder }))
      return;

    // 한 프레임 미룬다 — 레이아웃이 앉은 뒤에 램프 자리를 재고, 효과 안 동기 setState도 피한다
    const frame = requestAnimationFrame(() => summonWith(true));
    return () => cancelAnimationFrame(frame);
    // 마운트 시점의 판정이다 — today가 바뀌는 건 리마운트(다른 날 카드)뿐이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, column]);

  return (
    <>
      <LampWaiting
        ref={lampBoxRef}
        retry={retry}
        asleep={!summon}
        onSummon={onStart ? () => summonWith(false) : undefined}
      />

      {summon &&
        column &&
        createPortal(
          <LampSummon
            lamp={summon.lamp}
            asks={summon.asks}
            onAccept={() => onStart?.()}
            onClose={() => setSummon(null)}
          />,
          column,
        )}
    </>
  );
};
