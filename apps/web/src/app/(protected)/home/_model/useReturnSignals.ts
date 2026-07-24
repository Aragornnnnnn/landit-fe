'use client';

// 홈 복귀 신호(flip·card·just)를 첫 렌더에 캡처하고 리스트 첫 배치 후 소비한다 —
// 신호가 URL에 남아 카테고리 전환·리페치 때마다 재발동하던 버그(뒤집힌 카드로 되돌아감)의 근본 수정
import { useEffect, useState } from 'react';

export interface ReturnPositioning {
  // 방금 해금된 다음 카드로 스크롤·강조 (just)
  focusActive: boolean;
  // 이 카드로 스크롤하고 뒷면으로 자동 뒤집기 (표현 마무리 복귀)
  flipScenarioId: number | null;
  // 이 카드 앞면으로 스크롤 (대화 이탈·재대화 복귀)
  cardScenarioId: number | null;
}

const EMPTY: ReturnPositioning = {
  focusActive: false,
  flipScenarioId: null,
  cardScenarioId: null,
};

const toId = (raw: string | null) => {
  const id = Number(raw);
  return raw && Number.isFinite(id) ? id : null;
};

const parse = (searchParams: URLSearchParams): ReturnPositioning => {
  const just = searchParams.get('just');
  return {
    focusActive: just != null,
    flipScenarioId: toId(searchParams.get('flip')),
    cardScenarioId: toId(searchParams.get('card')),
  };
};

// justScenarioId — just가 카테고리 복원용 시나리오 id를 담는 경우 (레거시 '1'은 강조 전용 플래그)
const parseJustId = (searchParams: URLSearchParams) => {
  const just = searchParams.get('just');
  return just && just !== '1' ? toId(just) : null;
};

export const useReturnSignals = (
  searchParams: URLSearchParams,
  // 리스트가 실제로 신호를 쓸 수 있는 시점(데이터 준비) — 그 전에 소비하면 배치가 유실된다
  ready: boolean,
) => {
  // 신호는 진입 시점 값으로 고정한다 — 이후 URL·파라미터 변화에 흔들리지 않는다
  const [captured] = useState(() => ({
    positioning: parse(searchParams),
    justScenarioId: parseJustId(searchParams),
  }));
  // ready가 된 렌더가 커밋된 뒤 비동기로 소비한다 — 같은 렌더에서 소비하면
  // 리스트가 신호를 받아 배치하기 전에 비워진다 (렌더 중 조정 패턴은 여기선 못 쓴다)
  const [consumed, setConsumed] = useState(false);
  useEffect(() => {
    if (!ready || consumed) return;
    const id = setTimeout(() => setConsumed(true), 0);
    return () => clearTimeout(id);
  }, [ready, consumed]);

  return {
    // 카테고리 기본 선택용 — 소비 후에도 유지해 첫 카테고리로 튀지 않게 한다
    returnScenarioId:
      captured.positioning.flipScenarioId ??
      captured.positioning.cardScenarioId ??
      captured.justScenarioId,
    // 리스트 배치용 — 소비된 뒤에는 비워져 카테고리 전환에도 재발동하지 않는다
    positioning: consumed ? EMPTY : captured.positioning,
  };
};
