// 상대 자기소개 카드 — 영어가 본문이고 한국어는 못 알아들었을 때를 위한 받침이다
import type { PartnerProfile } from '@/features/small-talk/model/partner';

// 스크롤 없는 화면이라 남은 높이(스몰톡 영역의 컨테이너 쿼리)에 맞춰 여백과 글자를 두 단계까지 줄인다.
// 두 단계는 높이 구간이 겹치지 않는다 — 겹치면 CSS 순서상 첫 단계가 둘째 단계를 덮어쓴다
// 클래스명은 통째로 적어야 한다 — 조각을 이어 붙이면 Tailwind가 못 찾아 CSS가 안 나온다
export const PartnerIntroCard = ({ partner }: { partner: PartnerProfile }) => (
  // 여백·그림자는 대화 화면의 질문 카드와 같은 값을 쓴다 — 같은 상대가 말하는 카드라 결이 붙어야 한다
  <section className="flex flex-col gap-3 rounded-3xl bg-card px-6 py-6 shadow-lg shadow-black/5 [@container(480px<height<=620px)]:gap-2 [@container(480px<height<=620px)]:px-5 [@container(480px<height<=620px)]:py-4 [@container(height<=480px)]:gap-1.5 [@container(height<=480px)]:px-4 [@container(height<=480px)]:py-3">
    {/* 인사와 본문 사이 줄바꿈은 문구가 정한다 */}
    <p className="text-[16px] leading-relaxed font-bold whitespace-pre-line text-foreground [@container(480px<height<=620px)]:text-[15px] [@container(480px<height<=620px)]:leading-snug [@container(height<=480px)]:text-sm [@container(height<=480px)]:leading-snug">
      {partner.intro}
    </p>
    <p className="text-sm leading-relaxed font-normal text-muted-foreground [@container(480px<height<=620px)]:text-[13px] [@container(480px<height<=620px)]:leading-snug [@container(height<=480px)]:text-xs [@container(height<=480px)]:leading-snug">
      {partner.introTranslation}
    </p>
  </section>
);
