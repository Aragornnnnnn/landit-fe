// 상대 자기소개 카드 — 영어가 본문이고 한국어는 못 알아들었을 때를 위한 받침이다
import type { PartnerProfile } from '@/features/small-talk/model/partner';

// 이 화면은 스크롤이 없다 — 낮은 화면(≤740px)에서는 캐릭터 대신 이 카드가 먼저 줄어든다.
// 여백을 먼저 깎고 그래도 모자라면 글자를 한 단계 내린다.
// 클래스명은 통째로 적어야 한다 — 조각을 이어 붙이면 Tailwind가 못 찾아 CSS가 안 나온다
export const PartnerIntroCard = ({ partner }: { partner: PartnerProfile }) => (
  // 여백·그림자는 대화 화면의 질문 카드와 같은 값을 쓴다 — 같은 상대가 말하는 카드라 결이 붙어야 한다
  <section className="flex flex-col gap-3 rounded-3xl bg-card px-6 py-6 shadow-lg shadow-black/5 [@media(max-height:740px)]:gap-2 [@media(max-height:740px)]:px-5 [@media(max-height:740px)]:py-4">
    {/* 인사와 본문 사이 줄바꿈은 문구가 정한다 */}
    <p className="text-[16px] leading-relaxed font-bold whitespace-pre-line text-foreground [@media(max-height:740px)]:text-[15px] [@media(max-height:740px)]:leading-snug">
      {partner.intro}
    </p>
    <p className="text-sm leading-relaxed font-normal text-muted-foreground [@media(max-height:740px)]:text-[13px] [@media(max-height:740px)]:leading-snug">
      {partner.introTranslation}
    </p>
  </section>
);
