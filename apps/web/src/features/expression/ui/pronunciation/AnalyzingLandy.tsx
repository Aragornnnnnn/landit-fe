'use client';

// 발음 분석 대기 연출 — 로딩을 "듣기→비교→검토→정리" 서사로 풀어 래디 포즈와 문구가 단계마다 바뀐다.
// 전체 시간을 모르므로 서사는 한 번만 진행하고, 끝에 도달하면 마지막 두 단계(검토↔정리)를
// 오가며 살아 있게 한다 — 처음으로 되돌면 이야기가 리셋된 것처럼 보인다
import { useEffect, useState } from 'react';

const STAGES = [
  {
    image: '/images/character/landy-loading-01-listening.webp',
    text: '발음을 듣고 있어요',
  },
  {
    image: '/images/character/landy-loading-02-compare-orb.webp',
    text: '원어민 발음과 비교하고 있어요',
  },
  {
    image: '/images/character/landy-loading-03-review.webp',
    text: '단어 하나하나 살펴보고 있어요',
  },
  {
    image: '/images/character/landy-loading-04-finalize.webp',
    text: '피드백을 정리하고 있어요',
  },
];
const STAGE_MS = 2600;
const LAST = STAGES.length - 1;

export const AnalyzingLandy = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStage((current) => (current >= LAST ? LAST - 1 : current + 1)),
      STAGE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const { image, text } = STAGES[stage];

  // 진행바는 두지 않는다 — 전체 시간을 알 수 없어 게이지처럼 보이면 오해를 산다.
  // 진행감은 단계 문구·포즈 전환이 대신 전달한다
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* key로 단계마다 다시 마운트해 pop으로 튀어오르고, 머무는 동안엔 숨 쉬듯 맥동한다 */}
      <div key={image} className="animate-pop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="animate-breathe object-contain"
          style={{ width: 140, height: 140 }}
        />
      </div>
      {/* pop(등장)은 바깥, shimmer(상시)는 안쪽 — 한 요소에 두 animation을 겹치면 서로 덮어쓴다 */}
      <p
        key={stage}
        role="status"
        aria-live="polite"
        className="animate-pop text-base font-medium"
      >
        <span className="animate-text-shimmer">{text}...</span>
      </p>
    </div>
  );
};
