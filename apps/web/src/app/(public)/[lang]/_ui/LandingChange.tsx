// 랜딧이 다른 점 — 보고서의 세 설계 원리(판단 대신 반응, 끊기지 않는 대화, 딱 한 단계 위 표현)를 옮겼다. 10명 중 8명은 대화 후 만족도(시나리오 1,618명 86.1%, 스몰톡 304명 81.6%) 기준이다
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';
import { RevealSection } from '@/shared/ui/RevealSection';

import { titleTags } from './title-tags';

/** 카드 순서 — 문구는 landing.change의 `{주제}Title`·`{주제}Body` */
const CHANGES = ['reaction', 'flow', 'nextStep'] as const;

export const LandingChange = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.change' });
  return (
    <RevealSection className="mx-auto max-w-[1040px] px-6 pt-24 sm:pt-32">
      <h2 className="text-center text-[32px] leading-[1.4] font-bold break-keep sm:text-[44px]">
        {t.rich('title', titleTags('double'))}
      </h2>
      <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-3">
        {CHANGES.map((topic) => (
          <li key={topic} className="rounded-[24px] bg-[#f5f5f3] px-7 py-8">
            <p className="text-[21px] leading-snug font-bold break-keep">
              {t(`${topic}Title`)}
            </p>
            <p className="mt-3 text-[16px] leading-[1.7] break-keep text-[#57524c]">
              {t(`${topic}Body`)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-[20px] font-bold break-keep sm:text-[24px]">
        {t.rich('satisfactionCaption', {
          em: (chunks) => <span className="text-[#a34a12]">{chunks}</span>,
        })}
      </p>
    </RevealSection>
  );
};
