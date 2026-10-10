// 흐르는 띠 — 같은 문구를 두 벌 이어 붙여 끝없이 흐른다. 검정 선·프리미엄 금색 쪽으로 누그러뜨린 노랑 바탕에 비스듬히 기울어 있다
/** 글자 하나가 지나가는 시간(초) — 문구 길이와 상관없이 띠마다 같은 속도로 흐른다 */
const SECONDS_PER_CHAR = 0.13;

export const Ticker = ({
  text,
  reverse = false,
}: {
  text: string;
  /** 오른쪽으로 흐른다 — 띠 두 줄을 서로 반대로 흘릴 때 */
  reverse?: boolean;
}) => (
  <div className="-mx-2 -rotate-2 overflow-hidden border-y-[3px] border-[#161616] bg-[#f6d77a] py-1.5">
    <div
      className="animate-ticker flex w-max whitespace-nowrap"
      style={{
        animationDuration: `${text.length * SECONDS_PER_CHAR}s`,
        animationDirection: reverse ? 'reverse' : undefined,
      }}
    >
      {[0, 1].map((copy) => (
        <span
          key={copy}
          aria-hidden={copy === 1}
          className="flex items-center gap-1 pr-1 text-[15px] font-black text-[#3a2400]"
        >
          {text}
          {text}
        </span>
      ))}
    </div>
  </div>
);
