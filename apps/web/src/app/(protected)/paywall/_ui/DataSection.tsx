// 「그림으로 배우면 더 오래 기억해요」 — 왜 그런지(근거) → 실제 예문 그림이 지나가 한 장에 멈추는 모습(ExampleDeck) 순서로 설득한다
import { RANDY } from '../_model/paywall-content';
import { ExampleDeck } from './ExampleDeck';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

export const DataSection = () => (
  <div className="pt-14">
    <RevealSection>
      <SectionHeading
        title={
          <>
            {'그림으로 배우면\n'}
            <Highlight>더 오래 기억해요</Highlight>
          </>
        }
        mascot={RANDY.cards}
      />
      {/* 근거는 제목 바로 아래 한 줄로 — 따로 상자에 두면 읽히지 않는 각주가 된다 */}
      <p className="reveal-up mt-3 px-6 text-sm leading-[21px] tracking-[-0.01em] text-muted-foreground">
        글자만 볼 때보다 그림과 함께 볼 때 더 잘 기억해요.
        <br />
        랜딧은 예문마다 상황 그림을 함께 보여줘요.
      </p>
      <p className="reveal-up mt-1.5 px-6 text-[11px] tracking-[-0.01em] text-[#a89a8b]">
        그림 우월성 효과 · Paivio, 이중 부호화 이론
      </p>
    </RevealSection>

    {/* 실제 예문 그림이 한 방향으로 촤르르륵 지나가 한 장에 멈춘다 */}
    <div className="mt-3">
      <ExampleDeck />
    </div>
  </div>
);
