'use client';

// 답변 줄에 올린 단어 칩을 끌어 순서를 바꾸는 드래그 — 끄는 동안 다른 칩이 실시간으로 밀려나 자리를 내준다
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  dropIndexAt,
  moveChip,
  shiftOrigin,
  type ChipBox,
  type Point,
} from './chip-drag';

// 이만큼 움직여야 드래그로 본다 — 그 아래는 칩을 빼는 탭이다
const DRAG_THRESHOLD = 6;
const NO_BOX: ChipBox = { left: 0, top: 0, right: 0, bottom: 0 };

interface ChipDrag {
  // 끌고 있는 칩(자리는 끄는 동안 바뀌므로 id로 잡는다)
  id: number;
  // 처음 누른 곳에서 얼마나 왔는가 — 칩이 손가락을 따라오게 하는 값
  dx: number;
  dy: number;
}

export const useChipReorder = (
  selected: number[],
  onReorder: (next: number[]) => void,
) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const chipNodes = useRef(new Map<number, HTMLElement>());
  const [drag, setDrag] = useState<ChipDrag | null>(null);
  // 방금 포인터가 드래그로 끝났는가 — 이어서 오는 클릭을 칩 빼기로 세지 않으려고 기억한다
  const dragged = useRef(false);
  // 칩이 제자리에 있는 것으로 치는 포인터 위치. 순서가 바뀌어 칩 자리가 옮겨가면 그만큼 같이 옮긴다
  const origin = useRef<Point>({ x: 0, y: 0 });
  const pointer = useRef<Point>({ x: 0, y: 0 });
  // 순서를 바꾸기 직전에 잰 칩 자리 — 바뀐 뒤 자리와 비교해 보정폭을 얻는다
  const slotBefore = useRef<{ id: number; box: ChipBox } | null>(null);
  // 답변 줄의 화면 위치 — 포인터를 줄 기준 좌표로 옮길 때 쓴다
  const rowOrigin = useRef<Point>({ x: 0, y: 0 });
  const stopDrag = useRef<(() => void) | undefined>(undefined);

  const bindChip = (id: number) => (node: HTMLElement | null) => {
    if (node) chipNodes.current.set(id, node);
    else chipNodes.current.delete(id);
  };

  // 칩 자리는 레이아웃 좌표로 잰다 — 밀려나는 연출 중에 재도 최종 자리가 나온다
  const boxOf = (id: number): ChipBox => {
    const node = chipNodes.current.get(id);
    if (!node) return NO_BOX;
    return {
      left: node.offsetLeft,
      top: node.offsetTop,
      right: node.offsetLeft + node.offsetWidth,
      bottom: node.offsetTop + node.offsetHeight,
    };
  };

  const pointInRow = (event: { clientX: number; clientY: number }): Point => ({
    x: event.clientX - rowOrigin.current.x,
    y: event.clientY - rowOrigin.current.y,
  });

  const offsetFromOrigin = () => ({
    dx: pointer.current.x - origin.current.x,
    dy: pointer.current.y - origin.current.y,
  });

  // 순서가 바뀌면 끌던 칩의 자리도 옮겨간다 — 화면에선 손가락을 그대로 따라오도록 기준점을 같이 민다
  useLayoutEffect(() => {
    const before = slotBefore.current;
    if (!before) return;
    slotBefore.current = null;

    origin.current = shiftOrigin(origin.current, before.box, boxOf(before.id));
    setDrag((current) => current && { ...current, ...offsetFromOrigin() });
  });

  // 끌던 중에 화면이 사라지면 창에 붙인 리스너가 남는다
  useEffect(() => () => stopDrag.current?.(), []);

  const pressChip = (id: number) => (event: React.PointerEvent) => {
    // 이미 다른 손가락이 칩을 끌고 있으면 받지 않는다 — 두 드래그가 서로의 순서를 덮어쓴다
    if (stopDrag.current) return;
    const { pointerId } = event;
    const row = rowRef.current?.getBoundingClientRect();
    rowOrigin.current = { x: row?.left ?? 0, y: row?.top ?? 0 };
    origin.current = pointInRow(event);
    pointer.current = origin.current;
    // 끄는 동안 순서를 바로바로 바꾸므로, 지금 어떤 순서인지는 이 클로저가 들고 간다
    let live = selected;
    let started = false;
    dragged.current = false;
    const dragging = new AbortController();

    const followPointer = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      pointer.current = pointInRow(move);
      const offset = offsetFromOrigin();
      if (!started && Math.hypot(offset.dx, offset.dy) < DRAG_THRESHOLD) return;
      started = true;
      dragged.current = true;

      const from = live.indexOf(id);
      const to = dropIndexAt(live.map(boxOf), from, pointer.current);
      if (to !== from) {
        slotBefore.current = { id, box: boxOf(id) };
        live = moveChip(live, from, to);
        onReorder(live);
      }
      setDrag({ id, ...offset });
    };

    // 화면을 떠날 때는 이벤트 없이도 부른다
    const dropChip = (end?: PointerEvent) => {
      if (end && end.pointerId !== pointerId) return;
      dragging.abort();
      stopDrag.current = undefined;
      slotBefore.current = null;
      setDrag(null);
    };

    stopDrag.current = dropChip;
    const listen = { signal: dragging.signal };
    window.addEventListener('pointermove', followPointer, listen);
    window.addEventListener('pointerup', dropChip, listen);
    window.addEventListener('pointercancel', dropChip, listen);
  };

  // 드래그로 끝난 포인터의 클릭을 한 번 삼킨다 — 끌어놓고 손을 뗀 자리에서 칩이 빠지지 않게
  const swallowDragClick = () => {
    if (!dragged.current) return false;
    dragged.current = false;
    return true;
  };

  return { drag, rowRef, bindChip, pressChip, swallowDragClick };
};
