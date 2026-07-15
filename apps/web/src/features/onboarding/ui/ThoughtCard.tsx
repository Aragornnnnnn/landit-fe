// 상대의 속마음을 전해주는 마스코트 카드
'use client';

export type ThoughtType = 'GOOD' | 'NORMAL' | 'BAD';

export interface FloatingThought {
  text: string;
  type: ThoughtType;
}

// 타입별 톤 후광 색 — 랜디 표정과 함께 톤(GOOD/NORMAL/BAD)을 은은하게 전달하는 컴포넌트 전용 파스텔
const TYPE_HALO: Record<ThoughtType, string> = {
  GOOD: '#E1F5EE',
  NORMAL: '#F1EFE8',
  BAD: '#FAEEDA',
};

export const ThoughtCard = ({ thought }: { thought: FloatingThought }) => {
  return (
    <div className="flex w-full max-w-[300px] flex-col items-center rounded-[28px] bg-card px-6 pt-7 pb-6 shadow-xl">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 120,
          height: 120,
          backgroundColor: TYPE_HALO[thought.type],
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/character/landy-${thought.type.toLowerCase()}.webp`}
          alt="랜디"
          className="object-contain"
          style={{ width: 104, height: 104 }}
        />
      </div>
      <p className="mt-5 text-center text-base leading-relaxed text-foreground italic">
        {thought.text}
      </p>
    </div>
  );
};
