'use client';

// 알람 시각 휠 — iOS 시간 선택처럼 오전/오후·시·분 세 칸이 원통에 붙어 돈다. 튕기면 관성으로 돌고, 시·분은 끝없이 돈다.
// 원통·관성은 @ncdai/react-wheel-picker가 맡고, 우리는 칸이 넘어갈 때마다 틱 소리·진동·바뀌는 시각을 알리고,
// 시를 11과 12 사이로 넘기면 오전/오후를 저절로 바꾼다(iOS 알람 앱과 같다).
// 휠이 스스로 값을 들고 돈다(처음 값만 받는다) — 바깥에서 값을 다시 넣으면 라이브러리가 도는 칸을 순간이동시킨다.
// 쓰는 쪽은 굴리는 동안 onScrub으로, 확정할 때 ref의 read()로 "지금 보이는 시각"을 읽는다
import '@ncdai/react-wheel-picker/style.css';

import { useEffect, useImperativeHandle, useRef } from 'react';
import type { AlarmTime } from '@landit/bridge';
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from '@ncdai/react-wheel-picker';

import { haptic } from '@/shared/haptics';

import {
  playWheelTick,
  suspendWheelTick,
  unlockWheelTick,
} from '../lib/wheel-tick';
import { alarmPlatform } from '../model/shell-alarm';
import {
  fromWheel,
  meridiemAfter,
  rowStep,
  toWheel,
  type WheelTime,
} from '../model/time-wheel';

const ITEM_HEIGHT = 34;
// 원통 둘레에 놓이는 칸 수(4의 배수) — 가운데 위아래로 보이는 칸 수가 iOS와 비슷해지는 값
const RING_COUNT = 20;
// 화살표 키로 굴린 오전/오후 칸이 다 돌았을 때쯤 — 라이브러리 키 이동이 0.45초다
const MERIDIEM_SETTLE_MS = 500;

// 칸이 넘어갈 때의 진동 — Android의 selection은 너무 약해 거의 안 느껴져서 한 단계 센 light를 쓴다
const tickHaptic = () =>
  alarmPlatform() === 'android' ? ('light' as const) : ('selection' as const);

const MERIDIEMS: WheelPickerOption<number>[] = [
  { value: 0, label: '오전' },
  { value: 1, label: '오후' },
];
const HOURS: WheelPickerOption<number>[] = Array.from(
  { length: 12 },
  (_, index) => ({ value: index + 1, label: String(index + 1) }),
);
const MINUTES: WheelPickerOption<number>[] = Array.from(
  { length: 60 },
  (_, index) => ({ value: index, label: String(index).padStart(2, '0') }),
);

// 라이브러리 기본 CSS가 글자 크기를 덮어써서 !로 이긴다.
// 가운데 띠는 불투명해야 뒤에서 도는 회색 글자를 가린다(투명하면 글자가 두 겹으로 보인다) —
// 칸마다 그리되 양 끝 칸만 둥글게 해서 iOS처럼 한 줄로 이어 보이게 한다
const OPTION_CLASS = '!text-[21px] text-muted-foreground tabular-nums';
const BAND_CLASS =
  '!text-[22px] !font-normal text-foreground tabular-nums bg-[color-mix(in_srgb,#767680_12%,var(--wheel-surface))]';
const classNamesFor = (edge: 'start' | 'middle' | 'end') => ({
  optionItem: OPTION_CLASS,
  highlightWrapper: `${BAND_CLASS} ${edge === 'start' ? 'rounded-l-lg' : edge === 'end' ? 'rounded-r-lg' : ''}`,
});

// 칸 목록의 가운데에 있는 칸 번호 — 라이브러리가 가운데 띠 목록에 쓰는 translateY로 읽는다.
// 끝없이 도는 칸은 라이브러리가 목록 요소를 갈아 끼울 수 있어 매번 지금 요소를 찾는다
const centerRowOf = (column: HTMLElement) => {
  const list = column.querySelector<HTMLElement>('[data-rwp-highlight-list]');
  const match = list?.style.transform.match(/translateY\((-?[\d.]+)px\)/);
  return match ? Math.round(-Number(match[1]) / ITEM_HEIGHT) : null;
};

// 칸 번호 → 그 칸의 값 순번. 끝이 있는 칸은 끝 너머로 당겨도 끝 칸이다 — 순환시키면 반대 값으로 읽힌다
const optionIndexOf = (row: number, length: number, infinite: boolean) =>
  infinite
    ? ((row % length) + length) % length
    : Math.min(Math.max(row, 0), length - 1);

/**
 * 원통이 도는 동안 가운데 칸이 바뀌는 순간을 칸 번호와 함께 알린다.
 * 라이브러리는 멈춘 뒤에만 값을 알려 주지만, 도는 동안 매 프레임 가운데 띠 목록의 translateY를 갱신한다 — 그 변화를 지켜본다.
 * (라이브러리 내부 구조에 기대는 부분이라 버전을 고정해 둔다)
 */
const useCenterRow = (
  root: React.RefObject<HTMLDivElement | null>,
  onRow: (row: number) => void,
) => {
  const onRowRef = useRef(onRow);
  useEffect(() => {
    onRowRef.current = onRow;
  });

  useEffect(() => {
    const column = root.current;
    if (!column) return;
    let last: number | null = null;
    const read = () => {
      const row = centerRowOf(column);
      if (row === null || row === last) return;
      last = row;
      onRowRef.current(row);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(column, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, [root]);
};

const Column = ({
  label,
  edge,
  options,
  infinite,
  initial,
  onReady,
  onRow,
  columnRef,
}: {
  label: string;
  edge: 'start' | 'middle' | 'end';
  options: WheelPickerOption<number>[];
  infinite: boolean;
  initial: number;
  /** 처음 값 자리에 놓였을 때 한 번 — 그 칸 번호를 기준으로 삼는다 */
  onReady?: (row: number) => void;
  /** 그 뒤 가운데 칸이 바뀔 때마다 — 칸 번호(끝없는 칸은 되감길 수 있다)와 그 칸의 값 */
  onRow: (row: number, value: number) => void;
  columnRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = columnRef ?? ownRef;
  // 라이브러리는 첫 칸에서 시작해 처음 값 자리로 순간이동한다 — 거기 놓이기 전의 움직임은 사용자가 굴린 게 아니다
  const ready = useRef(false);
  // 같은 칸을 두 번 알리지 않는다 — 관찰을 다시 걸면(개발 모드의 effect 두 번 실행 등) 지금 칸을 처음부터 다시 읽는다
  const lastRow = useRef<number | null>(null);
  useCenterRow(ref, (row) => {
    if (row === lastRow.current) return;
    lastRow.current = row;
    const option = options[optionIndexOf(row, options.length, infinite)];
    if (!option) return;
    if (!ready.current) {
      if (option.value !== initial) return;
      ready.current = true;
      onReady?.(row);
      return;
    }
    onRow(row, option.value);
  });

  return (
    <div ref={ref} aria-label={label} className="flex-1">
      <WheelPicker
        options={options}
        defaultValue={initial}
        infinite={infinite}
        visibleCount={RING_COUNT}
        optionItemHeight={ITEM_HEIGHT}
        classNames={classNamesFor(edge)}
      />
    </div>
  );
};

export interface TimeWheelHandle {
  /** 지금 보이는 시각 — 관성으로 도는 중이어도 마지막으로 지나간 칸 */
  read: () => AlarmTime;
}

export const TimeWheel = ({
  initialValue,
  onScrub,
  surface = 'background',
  ref,
}: {
  /** 처음 보여 줄 시각 — 바꾸려면 휠을 다시 그린다(key) */
  initialValue: AlarmTime;
  /** 칸이 넘어갈 때마다 지금 보이는 시각 — 휠과 같이 바뀌는 글자에 쓴다 */
  onScrub?: (time: AlarmTime) => void;
  /** 휠이 놓인 바탕 — 가운데 띠 색을 바탕에 맞춰 섞는다 */
  surface?: 'background' | 'card';
  ref?: React.Ref<TimeWheelHandle>;
}) => {
  const initial = toWheel(initialValue);
  const meridiemColumn = useRef<HTMLDivElement>(null);
  // 지금 보이는 시·분과 있어야 할 오전/오후
  const live = useRef<WheelTime>(initial);

  // 오전/오후는 "기준값 + 시 칸이 기준 칸에서 지나온 12시 경계 수"로 정한다.
  // 시 칸 번호는 라이브러리가 되감아도 이어지게 펼쳐서(hourRow) 센다
  const meridiemBase = useRef(initial.meridiem);
  const baseHourRow = useRef<number | null>(null);
  const hourRow = useRef<number | null>(null);
  const lastRawHourRow = useRef<number | null>(null);

  // 오전/오후 칸을 우리가 굴리는 중인가 — 그동안 그 칸에서 오는 값은 사용자의 뜻이 아니다
  const meridiemRolling = useRef(false);
  const verifyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(verifyTimer.current);
      suspendWheelTick();
    },
    [],
  );

  useImperativeHandle(ref, () => ({ read: () => fromWheel(live.current) }));

  const tick = () => {
    playWheelTick();
    haptic(tickHaptic());
  };
  const notify = () => onScrub?.(fromWheel(live.current));

  // 오전/오후 칸을 목표로 굴린다. 라이브러리 값을 바로 바꾸면 순간이동해서, 부드럽게 한 칸 움직이는 화살표 키를 그 칸에 보낸다.
  // 굴리는 중에는 칸이 아직 출발 전이라 지금 자리로 판단하면 틀린다(손을 뗄 때 시 칸이 11로 붙었다 12로 가며 목표가 두 번 바뀐다) —
  // 굴리는 동안은 판단하지 않고, 다 돌았을 때쯤 실제 자리를 보고 다시 맞춘다
  const meridiemShown = () => {
    const column = meridiemColumn.current;
    const row = column ? centerRowOf(column) : null;
    return row === null ? null : optionIndexOf(row, 2, false);
  };
  const pushMeridiem = () => {
    const target = live.current.meridiem;
    meridiemColumn.current?.querySelector('[data-rwp]')?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: target === 1 ? 'ArrowDown' : 'ArrowUp',
        bubbles: true,
      }),
    );
  };
  const verifyMeridiem = () => {
    clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => {
      if (meridiemShown() === live.current.meridiem) {
        meridiemRolling.current = false;
        return;
      }
      pushMeridiem();
      verifyMeridiem();
    }, MERIDIEM_SETTLE_MS);
  };
  const followMeridiem = () => {
    if (!meridiemRolling.current) {
      if (meridiemShown() === live.current.meridiem) return;
      meridiemRolling.current = true;
      pushMeridiem();
    }
    verifyMeridiem();
  };

  const rollMeridiem = (meridiem: number) => {
    // 우리가 굴리는 중이면 사용자의 선택이 아니다 — 틱만 낸다
    if (meridiemRolling.current) {
      tick();
      return;
    }
    if (meridiem === live.current.meridiem) return;
    // 사용자가 직접 오전/오후를 바꿨다 — 지금 시 칸 자리를 새 기준으로 삼는다
    tick();
    live.current.meridiem = meridiem as 0 | 1;
    meridiemBase.current = meridiem as 0 | 1;
    baseHourRow.current = hourRow.current;
    notify();
  };

  const anchorHour = (rawRow: number) => {
    hourRow.current = rawRow;
    lastRawHourRow.current = rawRow;
    baseHourRow.current = rawRow;
  };

  const rollHour = (rawRow: number, hour12: number) => {
    const previous = lastRawHourRow.current ?? rawRow;
    hourRow.current =
      (hourRow.current ?? rawRow) + rowStep(previous, rawRow, HOURS.length);
    lastRawHourRow.current = rawRow;
    tick();
    live.current.hour12 = hour12;
    const meridiem = meridiemAfter(
      meridiemBase.current,
      baseHourRow.current ?? hourRow.current,
      hourRow.current,
    );
    if (meridiem !== live.current.meridiem) {
      live.current.meridiem = meridiem;
      followMeridiem();
    }
    notify();
  };

  const rollMinute = (_row: number, minute: number) => {
    tick();
    live.current.minute = minute;
    notify();
  };

  return (
    // 칸을 누를 때 앱 전역의 버튼 진동이 따로 울리지 않게 한다 — 휠은 칸이 넘어갈 때만 틱.
    // 손을 대는 순간 소리를 깨워 둔다 — iOS 웹뷰는 터치 뒤에야 소리를 낸다
    <div
      data-no-haptic
      onPointerDown={unlockWheelTick}
      onTouchStart={unlockWheelTick}
      className="mx-auto w-full max-w-[320px] touch-none"
      style={
        {
          '--wheel-surface':
            surface === 'card' ? 'var(--card)' : 'var(--background)',
        } as React.CSSProperties
      }
    >
      <WheelPickerWrapper>
        <Column
          label="오전 오후"
          edge="start"
          columnRef={meridiemColumn}
          options={MERIDIEMS}
          infinite={false}
          initial={initial.meridiem}
          onRow={(_row, meridiem) => rollMeridiem(meridiem)}
        />
        <Column
          label="시"
          edge="middle"
          options={HOURS}
          infinite
          initial={initial.hour12}
          onReady={anchorHour}
          onRow={rollHour}
        />
        <Column
          label="분"
          edge="end"
          options={MINUTES}
          infinite
          initial={initial.minute}
          onRow={rollMinute}
        />
      </WheelPickerWrapper>
    </div>
  );
};
