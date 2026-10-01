'use client';

// 편지함 사진 확대 보기 — 검은 전체 화면에 사진을 맞춰 띄우고, 버튼·더블탭·핀치로 키우고, 넘기고, 쓸어 닫는다.
// 받은 편지 이미지는 한 장, 보낸 편지 첨부는 여러 장을 넘겨 본다. 배율·이동·손가락 판정 규칙은 model/image-zoom
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '@/shared/lib/useFocusTrap';
import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';
import { CloseIcon, MinusIcon, PlusIcon } from '@/shared/ui/Icons';

import {
  clampPan,
  clampScale,
  MAX_SCALE,
  MIN_SCALE,
  readSwipe,
  stepScale,
  toggleScale,
  type Point,
  type Size,
} from '../../model/image-zoom';

export interface ViewerImage {
  src: string;
  alt: string;
}

interface ImageViewerProps {
  images: ViewerImage[];
  startIndex: number;
  onClose: () => void;
}

// 두 번 탭으로 읽는 간격과 거리 — 이보다 늦거나 멀면 따로 누른 것이다
const DOUBLE_TAP_MS = 300;
const TAP_SLOP_PX = 10;
const ORIGIN = { x: 0, y: 0 };

type Gesture =
  | { kind: 'drag'; start: Point; pan: Point; moved: boolean }
  | { kind: 'pinch'; distance: number; scale: number; pan: Point };

const distanceOf = (points: Point[]) =>
  Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

// 사진을 화면 안에 비율대로 맞춘 크기 — 이동 범위를 재는 기준이다
const fitInto = (natural: Size, frame: Size): Size => {
  const ratio = Math.min(
    frame.width / natural.width,
    frame.height / natural.height,
  );
  return { width: natural.width * ratio, height: natural.height * ratio };
};

export const ImageViewer = ({
  images,
  startIndex,
  onClose,
}: ImageViewerProps) => {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(MIN_SCALE);
  const [pan, setPan] = useState<Point>(ORIGIN);
  // 원래 크기에서 손가락을 따라 움직이는 만큼 — 넘기기·쓸어 닫기가 손을 따라오게 한다
  const [drag, setDrag] = useState<Point>(ORIGIN);
  const [isGesturing, setIsGesturing] = useState(false);
  const [natural, setNatural] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ at: number; point: Point } | null>(null);

  // onClose는 대개 인라인 함수라 렌더마다 바뀐다 — 등록은 한 번만 하고 최신 것을 읽는다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 안드로이드 뒤로가기는 편지 화면을 떠나지 않고 확대 보기만 닫는다 — 열린 시트와 같은 스택을 쓴다
  useEffect(() => registerOpenSheet(() => onCloseRef.current()), []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useFocusTrap(true, panelRef);

  const frameSize = (): Size => {
    const rect = frameRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  };

  const zoomTo = (next: number) => {
    const nextScale = clampScale(next);
    setScale(nextScale);
    const frame = frameSize();
    setPan((current) =>
      natural
        ? clampPan(current, nextScale, fitInto(natural, frame), frame)
        : ORIGIN,
    );
  };

  const goTo = (next: number) => {
    if (next < 0 || next >= images.length) return;
    setIndex(next);
    setScale(MIN_SCALE);
    setPan(ORIGIN);
    setNatural(null);
    setFailed(false);
  };

  const readTap = (point: Point) => {
    const now = Date.now();
    const previous = lastTap.current;
    const isDouble =
      previous !== null &&
      now - previous.at < DOUBLE_TAP_MS &&
      Math.hypot(point.x - previous.point.x, point.y - previous.point.y) <
        TAP_SLOP_PX * 3;
    lastTap.current = isDouble ? null : { at: now, point };
    if (isDouble) zoomTo(toggleScale(scale));
  };

  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    setIsGesturing(true);
    const points = [...pointers.current.values()];
    gesture.current =
      points.length >= 2
        ? { kind: 'pinch', distance: distanceOf(points), scale, pan }
        : { kind: 'drag', start: points[0], pan, moved: false };
  };

  const moveGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const current = gesture.current;
    const points = [...pointers.current.values()];

    if (current.kind === 'pinch' && points.length >= 2) {
      setScale(
        clampScale((current.scale * distanceOf(points)) / current.distance),
      );
      return;
    }
    if (current.kind !== 'drag') return;

    const delta = {
      x: points[0].x - current.start.x,
      y: points[0].y - current.start.y,
    };
    if (Math.hypot(delta.x, delta.y) > TAP_SLOP_PX) current.moved = true;

    if (scale > MIN_SCALE && natural) {
      const frame = frameSize();
      setPan(
        clampPan(
          { x: current.pan.x + delta.x, y: current.pan.y + delta.y },
          scale,
          fitInto(natural, frame),
          frame,
        ),
      );
      return;
    }
    // 원래 크기 — 가로는 넘길 사진이 있을 때만, 세로는 아래로만 따라온다
    setDrag({
      x: images.length > 1 ? delta.x : 0,
      y: Math.max(0, delta.y),
    });
  };

  // 거의 원래 크기로 돌아왔으면 딱 맞춘다 — 1.02배 같은 어중간한 상태로 넘기기가 막히지 않게
  const settlePinch = () =>
    zoomTo(scale < MIN_SCALE + 0.05 ? MIN_SCALE : scale);

  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    const point = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) {
      // 핀치에서 한 손가락이 먼저 떨어졌다 — 배율을 정리하고 남은 손가락으로 이어서 옮기게 한다
      if (current?.kind === 'pinch') settlePinch();
      const [rest] = pointers.current.values();
      gesture.current = { kind: 'drag', start: rest, pan, moved: true };
      return;
    }
    gesture.current = null;
    setIsGesturing(false);
    setDrag(ORIGIN);
    if (!current || !point) return;

    if (current.kind === 'pinch') {
      settlePinch();
      return;
    }
    if (!current.moved) {
      readTap(point);
      return;
    }
    const action = readSwipe(
      { dx: point.x - current.start.x, dy: point.y - current.start.y },
      scale,
    );
    if (action === 'close') onClose();
    if (action === 'next') goTo(index + 1);
    if (action === 'prev') goTo(index - 1);
  };

  // 손가락 대신 방향키로도 넘긴다 — 포커스는 확대 보기 안에 갇혀 있어 여기서 받는다
  const goByKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') goTo(index + 1);
    if (event.key === 'ArrowLeft') goTo(index - 1);
  };

  const image = images[index];
  const isSingle = images.length === 1;
  // 아래로 끌수록 흐려져 닫힌다는 걸 미리 보여준다
  const backdropOpacity = Math.max(0.4, 1 - drag.y / 400);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      tabIndex={-1}
      onKeyDown={goByKey}
      className="fixed inset-0 z-50 flex flex-col outline-none"
      style={{ backgroundColor: `rgba(0,0,0,${backdropOpacity})` }}
    >
      <div
        ref={frameRef}
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        className="relative flex-1 touch-none overflow-hidden select-none"
      >
        {failed ? (
          <div className="flex size-full items-center justify-center text-sm text-white/70">
            사진을 불러오지 못했어요
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- 인증 사진은 blob 주소, 편지 이미지는 도메인 미정이라 next/image를 못 쓴다
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            draggable={false}
            onLoad={(event) =>
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-contain"
            style={{
              transform: `translate(${pan.x + drag.x}px, ${pan.y + drag.y}px) scale(${scale})`,
              transition: isGesturing ? 'none' : 'transform 200ms ease-out',
            }}
          />
        )}
      </div>

      {/* 밝은 사진 위에서도 위아래 조작이 보이게 어둡게 번지는 막을 깐다 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-center px-4 pt-[max(var(--safe-area-inset-top),16px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-black/50 text-white active:scale-90"
          style={{ top: 'max(var(--safe-area-inset-top), 16px)' }}
        >
          <CloseIcon size={24} />
        </button>
        {!isSingle && (
          // 넘기기 손짓을 못 쓰는 스크린 리더용 — 화면 모양은 바꾸지 않는다
          <div className="sr-only">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              이전 사진
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === images.length - 1}
            >
              다음 사진
            </button>
          </div>
        )}
        {!isSingle && (
          <p
            aria-live="polite"
            className="mt-2.5 rounded-full bg-black/50 px-3 py-1.5 text-[15px] font-bold text-white"
          >
            {index + 1} / {images.length}
          </p>
        )}
      </div>

      <div className="absolute right-4 bottom-[max(var(--safe-area-inset-bottom),24px)] flex flex-col items-center rounded-full bg-black/50 text-white">
        <button
          type="button"
          onClick={() => zoomTo(stepScale(scale, 1))}
          disabled={scale >= MAX_SCALE}
          aria-label="확대"
          className="flex size-11 items-center justify-center disabled:opacity-30"
        >
          <PlusIcon size={24} />
        </button>
        <span className="h-px w-7 bg-white/20" />
        <button
          type="button"
          onClick={() => zoomTo(stepScale(scale, -1))}
          disabled={scale <= MIN_SCALE}
          aria-label="축소"
          className="flex size-11 items-center justify-center disabled:opacity-30"
        >
          <MinusIcon size={24} />
        </button>
      </div>
    </div>,
    document.body,
  );
};
