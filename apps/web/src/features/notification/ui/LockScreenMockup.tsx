// 알림이 도착한 잠금화면 목업 — 실제 발송 문구와 무관한 연출용 정지 화면 (피그마 874:157)
export const LockScreenMockup = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <div className="relative w-full max-w-[342px]">
    <div className="relative h-[295px] w-full overflow-hidden rounded-[32px] bg-linear-to-b from-[#2e2621] to-[#12110f]">
      {/* 다이내믹 아일랜드 */}
      <div className="absolute top-[13px] left-1/2 h-6 w-[88px] -translate-x-1/2 rounded-full bg-[#0a0a0a]" />

      <p className="pt-[50px] text-center text-[13px] font-medium text-white/20">
        7월 28일 화요일
      </p>
      <p className="text-center text-[40px] leading-[48px] font-semibold text-white/20">
        8:00
      </p>

      {/* 푸시 알림 미리보기 카드 */}
      <div className="absolute inset-x-5 top-[160px] rounded-[22px] bg-white px-3.5 pt-[13px] pb-[15px] shadow-[0px_10px_28px_-8px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#6b7280]">Landit</span>
          <span className="flex-1 text-right text-xs text-[#6b7280]">지금</span>
        </div>
        <p className="mt-1 text-[15px] leading-[21px] font-bold text-[#111]">
          {title}
        </p>
        <p className="mt-1 text-[13.5px] leading-[19px] text-[#6b7280]">
          {body}
        </p>
      </div>
    </div>
  </div>
);
