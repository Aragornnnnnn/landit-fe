// 상대 자기소개 카드 — 영어가 본문이고 화면 언어로 된 해석은 못 알아들었을 때를 위한 받침이다
import { useTranslations } from 'next-intl';

import type { PartnerProfile } from '@/features/small-talk/model/partner';

// 스크롤 없는 화면이라 남은 높이(cq-short·cq-tiny)에 맞춰 여백과 글자를 두 단계까지 줄인다.
// 클래스명은 통째로 적어야 한다 — 조각을 이어 붙이면 Tailwind가 못 찾아 CSS가 안 나온다
export const PartnerIntroCard = ({ partner }: { partner: PartnerProfile }) => {
  const t = useTranslations('smallTalk');
  return (
    // 여백·그림자는 대화 화면의 질문 카드와 같은 값을 쓴다 — 같은 상대가 말하는 카드라 결이 붙어야 한다
    <section className="flex flex-col gap-3 rounded-3xl bg-card px-6 py-6 shadow-lg shadow-black/5 cq-short:gap-2 cq-short:px-5 cq-short:py-4 cq-tiny:gap-1.5 cq-tiny:px-4 cq-tiny:py-3">
      {/* 인사와 본문 사이 줄바꿈은 문구가 정한다 */}
      <p className="text-16 leading-relaxed font-bold whitespace-pre-line text-foreground cq-short:text-15 cq-short:leading-snug cq-tiny:text-sm cq-tiny:leading-snug">
        {partner.intro}
      </p>
      <p className="text-sm leading-relaxed font-normal text-muted-foreground cq-short:text-13 cq-short:leading-snug cq-tiny:text-xs cq-tiny:leading-snug">
        {t(partner.introTranslationKey)}
      </p>
    </section>
  );
};
