// 시리즈 카드 줄 — 카드마다 제목 한 줄과 아래로 잘린 폰 화면 한 장. 좌우로 넘겨 보고 싶은 사람만 본다.
// 화면은 코드로 그린 데모를 대표 장면 하나에 멈춰 둔다(움직여야 하는 카드만 제 시계를 가진다) — 세로 길이는 카드 한 장 높이뿐이다
import { PhoneFrame } from './PhoneFrame';
import { RevealSection } from './RevealSection';

/** 폰 화면 폭 — 다음 카드가 오른쪽에 살짝 보이도록 카드를 화면보다 좁게 둔다 */
export const SERIES_SCREEN_WIDTH = 236;

export interface SeriesItem {
  title: string;
  screen: React.ReactNode;
}

export const SeriesCarousel = ({
  label,
  items,
}: {
  label: string;
  items: SeriesItem[];
}) => (
  <RevealSection>
    <p className="reveal-up px-6 text-[22px] font-extrabold tracking-[-0.02em] text-foreground">
      {label}
    </p>
    <div className="mt-3 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <article
          key={item.title}
          className="relative h-[400px] w-[272px] shrink-0 snap-start overflow-hidden rounded-3xl border border-[#e9e7e2] bg-card shadow-[0_2px_10px_rgba(51,38,26,0.05)]"
        >
          <h3 className="px-5 pt-5 text-center text-[17px] leading-snug font-bold tracking-[-0.02em] text-foreground">
            {item.title}
          </h3>
          {/* 폰은 카드 아래로 잘려 화면 윗부분만 보인다 */}
          <PhoneFrame
            radius={22}
            className="absolute top-[62px] left-1/2 h-[520px] w-[239px] -translate-x-1/2"
          >
            {item.screen}
          </PhoneFrame>
        </article>
      ))}
    </div>
  </RevealSection>
);
