// 롱 페이월 섹션 제목 — 형광펜 그어진 큰 제목, 옆에 둥실 떠 있는 래디
import Image from 'next/image';

interface SectionHeadingProps {
  title: React.ReactNode;
  /** 래디 그림 경로. 없으면 제목만 */
  mascot?: string;
}

/** 제목 일부에 형광펜을 긋는다 — 섹션이 보이면 왼쪽에서 오른쪽으로 그어진다 */
export const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="relative isolate inline-block">
    <span
      aria-hidden="true"
      className="reveal-highlight absolute inset-x-[-3px] bottom-[3px] -z-10 h-[18px] rounded-[3px] bg-[#f9c99a]/70"
    />
    {children}
  </span>
);

export const SectionHeading = ({ title, mascot }: SectionHeadingProps) => (
  <div className="flex items-end px-6">
    <div className="reveal-up shrink-0">
      <h2 className="text-[26px] leading-[34px] font-black tracking-[-0.025em] whitespace-pre-line text-foreground">
        {title}
      </h2>
    </div>
    {/* 높이를 먹지 않게 음수 여백으로 제목 줄에 겹쳐 앉힌다 — 래디가 커도 섹션 간격은 제목이 정한다 */}
    {mascot && (
      <div className="reveal-mascot relative -my-5 -ml-1 size-[124px] shrink-0">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(249_201_154/0.55),rgb(249_201_154/0.22)_55%,transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-[26px] left-1/2 h-2 w-[50px] -translate-x-1/2 rounded-[50%] bg-[#8a6d45]/18 blur-[2px]"
        />
        <Image
          src={mascot}
          alt=""
          width={84}
          height={84}
          className="animate-float absolute top-5 left-5 size-[84px]"
        />
      </div>
    )}
  </div>
);
