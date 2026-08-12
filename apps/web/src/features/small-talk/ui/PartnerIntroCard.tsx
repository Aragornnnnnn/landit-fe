// 상대 자기소개 카드 — 영어가 본문이고 한국어는 못 알아들었을 때를 위한 받침이다
import type { PartnerProfile } from '../model/partner';

export const PartnerIntroCard = ({ partner }: { partner: PartnerProfile }) => (
  // 상대를 바꿔도 카드 높이가 튀지 않게 최소 높이를 잡아 둔다 — 소개 길이가 제각각이다
  // 여백·그림자는 대화 화면의 질문 카드와 같은 값을 쓴다 — 같은 상대가 말하는 카드라 결이 붙어야 한다
  <section className="flex min-h-[145px] flex-col gap-3 rounded-3xl bg-card px-6 py-6 shadow-lg shadow-black/5">
    {/* 인사와 본문 사이 줄바꿈은 문구가 정한다 */}
    <p className="text-[16px] leading-normal font-bold whitespace-pre-line text-foreground">
      {partner.intro}
    </p>
    <p className="text-sm leading-normal font-normal text-muted-foreground">
      {partner.introTranslation}
    </p>
  </section>
);
