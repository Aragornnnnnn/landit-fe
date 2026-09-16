'use client';

// 전체 문장 비교 듣기 말풍선 — 래디가 원어민 문장과 내 녹음을 나란히 들어보라고 권한다.
// 결과 화면에 줄을 더 쓰지 않으려고 코치 말풍선 자체에 듣기 버튼을 얹었다 (LAN-497)
import { ListenButton } from './ListenButton';

interface CompareListenBubbleProps {
  nativePlaying: boolean;
  minePlaying: boolean;
  onPlayNative: () => void;
  onPlayMine: () => void;
}

export const CompareListenBubble = ({
  nativePlaying,
  minePlaying,
  onPlayNative,
  onPlayMine,
}: CompareListenBubbleProps) => (
  // 발음 화면의 약속("제가 듣고 도와드릴게요")을 지키러 온 래디 — 등장은 칩 다음 차례
  <div
    className="animate-fade-up -my-1 flex items-end gap-2"
    style={{ animationDelay: '950ms' }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/images/character/landy-point.webp"
      alt=""
      className="w-14 flex-none object-contain"
    />
    <div className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5">
      <p className="text-sm font-semibold text-foreground">
        원어민이랑 비교해서 들어볼까요?
      </p>
      <div className="mt-2 flex gap-1.5">
        <ListenButton
          label="원어민"
          ariaLabel="원어민 문장 듣기"
          playing={nativePlaying}
          onClick={onPlayNative}
        />
        <ListenButton
          label="내 발음"
          ariaLabel="내가 말한 문장 듣기"
          playing={minePlaying}
          onClick={onPlayMine}
        />
      </div>
    </div>
  </div>
);
